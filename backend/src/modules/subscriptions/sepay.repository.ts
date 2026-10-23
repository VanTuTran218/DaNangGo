import { getPool, sql } from '../../config/db';
import { insertSubscriptionStatusLog } from './subscriptions.repository';

export interface SePayTransactionPayload {
  id: number;
  gateway?: string | null;
  accountNumber?: string | null;
  transactionDate?: string | null;
  code?: string | null;
  content?: string | null;
  transferType: 'in' | 'out';
  transferAmount: number;
  referenceCode?: string | null;
}

export type SePayProcessingStatus =
  | 'PAID'
  | 'UNMATCHED'
  | 'AMOUNT_MISMATCH'
  | 'ALREADY_PROCESSED'
  | 'IGNORED_OUTGOING';

export async function listRecentSePayTransactions(): Promise<Array<{
  sepay_id: number;
  transaction_code: string | null;
  transfer_type: string;
  transfer_amount: number;
  reference_code: string | null;
  processing_status: string;
  processing_note: string | null;
  received_at: Date;
  processed_at: Date | null;
}>> {
  const result = await getPool().request().query(`
    SELECT TOP (100) sepay_id, transaction_code, transfer_type, transfer_amount,
           reference_code, processing_status, processing_note, received_at, processed_at
    FROM dbo.sepay_webhook_transactions
    ORDER BY received_at DESC;
  `);
  return result.recordset;
}

/**
 * Record and reconcile a SePay event atomically. The SePay id primary key
 * makes retries and concurrent duplicate deliveries safe.
 */
export async function processSePayTransaction(
  payload: SePayTransactionPayload,
  rawPayload: string
): Promise<{ duplicate: boolean; status: SePayProcessingStatus }> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

  try {
    const existingResult = await new sql.Request(transaction)
      .input('sepayId', sql.BigInt, payload.id)
      .query<{ sepay_id: number; processing_status: SePayProcessingStatus }>(`
        SELECT sepay_id, processing_status
        FROM dbo.sepay_webhook_transactions WITH (UPDLOCK, HOLDLOCK)
        WHERE sepay_id = @sepayId;
      `);

    const existingEvent = existingResult.recordset[0];
    if (existingEvent) {
      await transaction.commit();
      return { duplicate: true, status: existingEvent.processing_status };
    }

    await new sql.Request(transaction)
      .input('sepayId', sql.BigInt, payload.id)
      .input('transactionCode', sql.NVarChar(50), payload.code?.trim().toUpperCase() || null)
      .input('transferType', sql.NVarChar(10), payload.transferType)
      .input('transferAmount', sql.BigInt, payload.transferAmount)
      .input('referenceCode', sql.NVarChar(255), payload.referenceCode ?? null)
      .input('transactionDate', sql.NVarChar(40), payload.transactionDate ?? null)
      .input('rawPayload', sql.NVarChar(sql.MAX), rawPayload)
      .query(`
        INSERT INTO dbo.sepay_webhook_transactions (
          sepay_id, transaction_code, transfer_type, transfer_amount,
          reference_code, transaction_date, processing_status, raw_payload
        ) VALUES (
          @sepayId, @transactionCode, @transferType, @transferAmount,
          @referenceCode, @transactionDate, 'RECEIVED', @rawPayload
        );
      `);

    if (payload.transferType !== 'in') {
      await setEventStatus(transaction, payload.id, 'IGNORED_OUTGOING', 'Giao dịch tiền ra không dùng để xác nhận thanh toán.');
      await transaction.commit();
      return { duplicate: false, status: 'IGNORED_OUTGOING' };
    }

    const expectedAccount = process.env.SEPAY_BANK_ACCOUNT?.replace(/\D/g, '');
    const receivedAccount = payload.accountNumber?.replace(/\D/g, '');
    if (expectedAccount && receivedAccount && expectedAccount !== receivedAccount) {
      await setEventStatus(transaction, payload.id, 'UNMATCHED', 'Giao dịch được báo về tài khoản nhận không khớp tài khoản DaNangGo đã cấu hình.');
      await transaction.commit();
      return { duplicate: false, status: 'UNMATCHED' };
    }

    const paymentCode = extractPaymentCode(payload.code, payload.content);
    if (!paymentCode) {
      await setEventStatus(transaction, payload.id, 'UNMATCHED', 'Không tìm thấy mã đăng ký gói trong giao dịch.');
      await transaction.commit();
      return { duplicate: false, status: 'UNMATCHED' };
    }

    const subscriptionResult = await new sql.Request(transaction)
      .input('transactionCode', sql.NVarChar(50), paymentCode)
      .query<{
        subscription_id: number;
        partner_id: number;
        duration_months: number;
        price: number;
        payment_status: string;
      }>(`
        SELECT TOP (1) subscription_id, partner_id, duration_months, price, payment_status
        FROM dbo.partner_subscriptions WITH (UPDLOCK, HOLDLOCK)
        WHERE transaction_code = @transactionCode;
      `);

    const subscription = subscriptionResult.recordset[0];
    if (!subscription) {
      await setEventStatus(transaction, payload.id, 'UNMATCHED', `Không tìm thấy yêu cầu đăng ký cho mã ${paymentCode}.`);
      await transaction.commit();
      return { duplicate: false, status: 'UNMATCHED' };
    }

    if (Number(subscription.price) !== payload.transferAmount) {
      await setEventStatus(transaction, payload.id, 'AMOUNT_MISMATCH', `Số tiền nhận ${payload.transferAmount} không khớp số tiền cần ${subscription.price}.`);
      await transaction.commit();
      return { duplicate: false, status: 'AMOUNT_MISMATCH' };
    }

    if (subscription.payment_status !== 'PENDING') {
      await setEventStatus(transaction, payload.id, 'ALREADY_PROCESSED', `Yêu cầu đã có trạng thái ${subscription.payment_status}.`);
      await transaction.commit();
      return { duplicate: false, status: 'ALREADY_PROCESSED' };
    }

    const currentEndResult = await new sql.Request(transaction)
      .input('partnerId', sql.Int, subscription.partner_id)
      .query<{ end_date: Date }>(`
        SELECT TOP (1) end_date
        FROM dbo.partner_subscriptions WITH (UPDLOCK, HOLDLOCK)
        WHERE partner_id = @partnerId
          AND subscription_status = 'ACTIVE'
          AND payment_status = 'PAID'
          AND end_date > SYSUTCDATETIME()
        ORDER BY end_date DESC;
      `);

    const currentActiveEnd = currentEndResult.recordset[0]?.end_date ?? null;
    const confirmed = await new sql.Request(transaction)
      .input('subscriptionId', sql.Int, subscription.subscription_id)
      .input('durationMonths', sql.Int, subscription.duration_months)
      .input('currentActiveEnd', sql.DateTime2, currentActiveEnd)
      .input('paymentReference', sql.NVarChar(100), payload.referenceCode?.slice(0, 100) || `SEPAY-${payload.id}`)
      .query<{ subscription_id: number }>(`
        DECLARE @baseDate DATETIME2;
        DECLARE @startDate DATETIME2;
        DECLARE @endDate DATETIME2;
        IF @currentActiveEnd IS NOT NULL AND @currentActiveEnd > SYSUTCDATETIME()
        BEGIN
          SET @startDate = @currentActiveEnd;
          SET @baseDate = @currentActiveEnd;
        END
        ELSE
        BEGIN
          SET @startDate = SYSUTCDATETIME();
          SET @baseDate = SYSUTCDATETIME();
        END
        SET @endDate = DATEADD(month, @durationMonths, @baseDate);

        UPDATE dbo.partner_subscriptions
        SET payment_status = 'PAID',
            subscription_status = 'ACTIVE',
            payment_reference = @paymentReference,
            payment_proof_note = N'Tự động xác thực thanh toán qua SePay.',
            payment_submitted_at = SYSUTCDATETIME(),
            confirmed_by = NULL,
            confirmed_at = SYSUTCDATETIME(),
            start_date = @startDate,
            end_date = @endDate
        OUTPUT INSERTED.subscription_id
        WHERE subscription_id = @subscriptionId AND payment_status = 'PENDING';
      `);

    if (!confirmed.recordset[0]) {
      await setEventStatus(transaction, payload.id, 'ALREADY_PROCESSED', 'Yêu cầu đã được xử lý đồng thời.');
      await transaction.commit();
      return { duplicate: false, status: 'ALREADY_PROCESSED' };
    }

    await insertSubscriptionStatusLog(transaction, {
      subscriptionId: subscription.subscription_id,
      previousStatus: 'PENDING',
      newStatus: 'PAID_AND_ACTIVE',
      changedBy: null,
      note: 'SePay xác thực giao dịch ngân hàng và tự động kích hoạt gói.',
    });

    await setEventStatus(transaction, payload.id, 'PAID', `Đã kích hoạt yêu cầu ${paymentCode}.`);
    await transaction.commit();
    return { duplicate: false, status: 'PAID' };
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    throw error;
  }
}

function extractPaymentCode(code?: string | null, content?: string | null): string | null {
  const candidates = [code ?? '', content ?? ''].join(' ').toUpperCase();
  return candidates.match(/DNG[A-F0-9]{10}/)?.[0] ?? null;
}

async function setEventStatus(
  transaction: sql.Transaction,
  sepayId: number,
  status: SePayProcessingStatus,
  note: string
): Promise<void> {
  await new sql.Request(transaction)
    .input('sepayId', sql.BigInt, sepayId)
    .input('status', sql.NVarChar(30), status)
    .input('note', sql.NVarChar(500), note)
    .query(`
      UPDATE dbo.sepay_webhook_transactions
      SET processing_status = @status,
          processing_note = @note,
          processed_at = SYSUTCDATETIME()
      WHERE sepay_id = @sepayId;
    `);
}
