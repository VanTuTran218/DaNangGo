import { closeDB, connectDB, getPool, sql } from '../config/db';

/**
 * Adds three clearly marked subscription rows for UI review to one existing,
 * approved partner. Safe to rerun; it does not create users or partner data.
 * Run with `npm run seed:subscriptions` only in a development database.
 */
async function main(): Promise<void> {
  await connectDB();
  const pool = getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

  try {
    const partnerResult = await new sql.Request(transaction).query<{ partner_id: number }>(`
      SELECT TOP (1) partner_id
      FROM dbo.partner_profiles WITH (UPDLOCK, HOLDLOCK)
      WHERE approval_status = 'APPROVED'
      ORDER BY partner_id;
    `);
    const partnerId = partnerResult.recordset[0]?.partner_id;
    if (!partnerId) throw new Error('No existing APPROVED partner was found.');

    const packagesResult = await new sql.Request(transaction).query<{
      package_id: number;
      package_code: string;
      name: string;
      duration_months: number;
      price: number;
    }>(`
      SELECT package_id, package_code, name, duration_months, price
      FROM dbo.subscription_packages
      WHERE package_code IN ('1_MONTH', '6_MONTHS', '1_YEAR');
    `);
    const packages = new Map(packagesResult.recordset.map((item) => [item.package_code, item]));
    const month = packages.get('1_MONTH');
    const halfYear = packages.get('6_MONTHS');
    const year = packages.get('1_YEAR');
    if (!month || !halfYear || !year) throw new Error('The three standard subscription packages are required.');

    const samples = [
      { key: 'PENDING', pkg: month, subscriptionStatus: 'PENDING', paymentStatus: 'PENDING' },
      { key: 'REJECTED', pkg: halfYear, subscriptionStatus: 'REJECTED', paymentStatus: 'REJECTED' },
      { key: 'ACTIVE', pkg: year, subscriptionStatus: 'ACTIVE', paymentStatus: 'PAID' },
    ] as const;

    for (const sample of samples) {
      const transactionCode = `DNG-UI-${partnerId}-${sample.key}`;
      const request = new sql.Request(transaction)
        .input('transactionCode', sql.NVarChar(50), transactionCode)
        .input('partnerId', sql.Int, partnerId)
        .input('packageId', sql.Int, sample.pkg.package_id)
        .input('packageName', sql.NVarChar(100), sample.pkg.name)
        .input('durationMonths', sql.Int, sample.pkg.duration_months)
        .input('price', sql.BigInt, sample.pkg.price)
        .input('subscriptionStatus', sql.NVarChar(20), sample.subscriptionStatus)
        .input('paymentStatus', sql.NVarChar(20), sample.paymentStatus);

      await request.query(`
        IF NOT EXISTS (
          SELECT 1 FROM dbo.partner_subscriptions WITH (UPDLOCK, HOLDLOCK)
          WHERE transaction_code = @transactionCode
        )
        BEGIN
          INSERT INTO dbo.partner_subscriptions (
            transaction_code, partner_id, package_id, package_name, duration_months, price,
            subscription_status, payment_status, payment_method, payment_reference,
            payment_proof_note, payment_submitted_at, start_date, end_date,
            confirmed_at, rejection_reason, is_renewal
          )
          VALUES (
            @transactionCode, @partnerId, @packageId, @packageName, @durationMonths, @price,
            @subscriptionStatus, @paymentStatus, N'BANK_TRANSFER',
            CASE WHEN @paymentStatus = N'PENDING' THEN N'UI-SEED-PENDING' ELSE NULL END,
            N'UI sample seed; safe to remove by DNG-UI transaction code prefix.',
            SYSUTCDATETIME(),
            CASE WHEN @paymentStatus = N'PAID' THEN DATEADD(day, -10, SYSUTCDATETIME()) ELSE NULL END,
            CASE WHEN @paymentStatus = N'PAID' THEN DATEADD(month, @durationMonths, SYSUTCDATETIME()) ELSE NULL END,
            CASE WHEN @paymentStatus = N'PENDING' THEN NULL ELSE SYSUTCDATETIME() END,
            CASE WHEN @paymentStatus = N'REJECTED' THEN N'UI sample rejection' ELSE NULL END,
            0
          );
        END;
      `);
    }

    await transaction.commit();
    console.log(`UI subscription samples are ready for approved partner ${partnerId}.`);
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    throw error;
  }
}

main().catch((error: unknown) => {
  console.error('Subscription sample seed failed:', error);
  process.exitCode = 1;
}).finally(async () => {
  await closeDB();
});
