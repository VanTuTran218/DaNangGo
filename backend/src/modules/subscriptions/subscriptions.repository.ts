import { getPool, sql } from '../../config/db';

export interface SubscriptionPackageRow {
  package_id: number;
  package_code: string;
  name: string;
  duration_months: number;
  price: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date | null;
}

export interface PartnerSubscriptionRow {
  subscription_id: number;
  transaction_code: string;
  partner_id: number;
  package_id: number;
  package_name: string;
  duration_months: number;
  price: number;
  subscription_status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REJECTED' | 'CANCELLED';
  payment_status: 'PENDING' | 'PAID' | 'REJECTED';
  payment_method: string;
  payment_reference: string | null;
  payment_proof_note: string | null;
  payment_submitted_at: Date | null;
  start_date: Date | null;
  end_date: Date | null;
  created_at: Date;
  confirmed_by: number | null;
  confirmed_at: Date | null;
  rejection_reason: string | null;
  is_renewal: boolean;
  renewed_from_id: number | null;
  business_name?: string;
  contact_phone?: string | null;
  partner_email?: string;
  partner_user_name?: string;
  admin_name?: string | null;
}

/**
 * Lấy danh sách gói đang hoạt động cho đối tác
 */
export async function listActivePackages(): Promise<SubscriptionPackageRow[]> {
  const pool = getPool();
  const result = await pool.request().query<SubscriptionPackageRow>(`
    SELECT package_id, package_code, name, duration_months, price, description, is_active, sort_order, created_at, updated_at
    FROM dbo.subscription_packages
    WHERE is_active = 1
    ORDER BY sort_order ASC, price ASC;
  `);
  return result.recordset;
}

/**
 * Lấy tất cả gói cho Admin (kể cả đã ẩn)
 */
export async function listAllPackages(): Promise<SubscriptionPackageRow[]> {
  const pool = getPool();
  const result = await pool.request().query<SubscriptionPackageRow>(`
    SELECT package_id, package_code, name, duration_months, price, description, is_active, sort_order, created_at, updated_at
    FROM dbo.subscription_packages
    ORDER BY sort_order ASC, price ASC;
  `);
  return result.recordset;
}

/**
 * Lấy thông tin 1 gói theo ID
 */
export async function getPackageById(packageId: number): Promise<SubscriptionPackageRow | null> {
  const pool = getPool();
  const result = await pool.request()
    .input('packageId', sql.Int, packageId)
    .query<SubscriptionPackageRow>(`
      SELECT package_id, package_code, name, duration_months, price, description, is_active, sort_order, created_at, updated_at
      FROM dbo.subscription_packages
      WHERE package_id = @packageId;
    `);
  return result.recordset[0] ?? null;
}

/**
 * Admin cập nhật gói (bật/tắt hoặc sửa mô tả, không cho phép xóa cứng)
 */
export async function updatePackage(
  packageId: number,
  data: { isActive?: boolean | undefined; description?: string | null | undefined; name?: string | undefined }
): Promise<SubscriptionPackageRow | null> {
  const pool = getPool();
  const result = await pool.request()
    .input('packageId', sql.Int, packageId)
    .input('isActive', sql.Bit, data.isActive !== undefined ? data.isActive : null)
    .input('description', sql.NVarChar(500), data.description !== undefined ? data.description : null)
    .input('name', sql.NVarChar(100), data.name !== undefined ? data.name : null)
    .query<SubscriptionPackageRow>(`
      UPDATE dbo.subscription_packages
      SET is_active = COALESCE(@isActive, is_active),
          description = COALESCE(@description, description),
          name = COALESCE(@name, name),
          updated_at = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE package_id = @packageId;
    `);
  return result.recordset[0] ?? null;
}

/**
 * Tạo yêu cầu đăng ký gói mới cho đối tác
 */
export async function createSubscriptionRecord(data: {
  transactionCode: string;
  partnerId: number;
  packageId: number;
  packageName: string;
  durationMonths: number;
  price: number;
  isRenewal: boolean;
  renewedFromId?: number | null;
}): Promise<PartnerSubscriptionRow> {
  const pool = getPool();
  const result = await pool.request()
    .input('transactionCode', sql.NVarChar(50), data.transactionCode)
    .input('partnerId', sql.Int, data.partnerId)
    .input('packageId', sql.Int, data.packageId)
    .input('packageName', sql.NVarChar(100), data.packageName)
    .input('durationMonths', sql.Int, data.durationMonths)
    .input('price', sql.BigInt, data.price)
    .input('isRenewal', sql.Bit, data.isRenewal)
    .input('renewedFromId', sql.Int, data.renewedFromId ?? null)
    .query<PartnerSubscriptionRow>(`
      INSERT INTO dbo.partner_subscriptions (
        transaction_code, partner_id, package_id, package_name, duration_months, price,
        subscription_status, payment_status, payment_method, is_renewal, renewed_from_id, created_at
      )
      OUTPUT INSERTED.*
      VALUES (
        @transactionCode, @partnerId, @packageId, @packageName, @durationMonths, @price,
        'PENDING', 'PENDING', 'BANK_TRANSFER', @isRenewal, @renewedFromId, SYSUTCDATETIME()
      );
    `);
  const row = result.recordset[0];
  if (!row) throw new Error('Không thể tạo bản ghi đăng ký gói.');
  return row;
}

/**
 * Partner gửi thông tin chuyển khoản / mã tham chiếu để Admin đối soát
 */
export async function submitPaymentProofRecord(
  subscriptionId: number,
  partnerId: number,
  data: { paymentReference: string | null; paymentProofNote?: string | null }
): Promise<PartnerSubscriptionRow | null> {
  const pool = getPool();
  const result = await pool.request()
    .input('subscriptionId', sql.Int, subscriptionId)
    .input('partnerId', sql.Int, partnerId)
    .input('paymentReference', sql.NVarChar(100), data.paymentReference)
    .input('paymentProofNote', sql.NVarChar(500), data.paymentProofNote ?? null)
    .query<PartnerSubscriptionRow>(`
      UPDATE dbo.partner_subscriptions
      SET payment_reference = @paymentReference,
          payment_proof_note = @paymentProofNote,
          payment_submitted_at = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE subscription_id = @subscriptionId
        AND partner_id = @partnerId
        AND payment_status = 'PENDING';
    `);
  return result.recordset[0] ?? null;
}

/**
 * Lấy lịch sử đăng ký của đối tác (kèm thông tin gói)
 */
export async function getPartnerSubscriptionsList(partnerId: number): Promise<PartnerSubscriptionRow[]> {
  const pool = getPool();
  const result = await pool.request()
    .input('partnerId', sql.Int, partnerId)
    .query<PartnerSubscriptionRow>(`
      SELECT ps.*, pp.business_name
      FROM dbo.partner_subscriptions AS ps
      INNER JOIN dbo.partner_profiles AS pp ON pp.partner_id = ps.partner_id
      WHERE ps.partner_id = @partnerId
      ORDER BY ps.created_at DESC;
    `);
  return result.recordset;
}

/**
 * Lấy thông tin gói đang hoạt động của đối tác
 */
export async function getPartnerActiveSubscription(partnerId: number): Promise<PartnerSubscriptionRow | null> {
  const pool = getPool();
  const result = await pool.request()
    .input('partnerId', sql.Int, partnerId)
    .query<PartnerSubscriptionRow>(`
      SELECT TOP (1) ps.*, pp.business_name
      FROM dbo.partner_subscriptions AS ps
      INNER JOIN dbo.partner_profiles AS pp ON pp.partner_id = ps.partner_id
      WHERE ps.partner_id = @partnerId
        AND ps.subscription_status = 'ACTIVE'
        AND ps.payment_status = 'PAID'
        AND ps.end_date > SYSUTCDATETIME()
      ORDER BY ps.end_date DESC;
    `);
  return result.recordset[0] ?? null;
}

/**
 * Kiểm tra đối tác có gói đang hoạt động không (dùng trực tiếp trong middleware bảo vệ API)
 */
export async function checkPartnerActiveSubscriptionExists(partnerProfileId: number): Promise<boolean> {
  const pool = getPool();
  const result = await pool.request()
    .input('partnerId', sql.Int, partnerProfileId)
    .query<{ has_active: number }>(`
      SELECT CASE WHEN EXISTS (
        SELECT 1
        FROM dbo.partner_subscriptions
        WHERE partner_id = @partnerId
          AND subscription_status = 'ACTIVE'
          AND payment_status = 'PAID'
          AND end_date > SYSUTCDATETIME()
      ) THEN 1 ELSE 0 END AS has_active;
    `);
  return result.recordset[0]?.has_active === 1;
}

/**
 * Lấy chi tiết 1 đăng ký theo ID
 */
export async function getSubscriptionDetailById(subscriptionId: number): Promise<PartnerSubscriptionRow | null> {
  const pool = getPool();
  const result = await pool.request()
    .input('subscriptionId', sql.Int, subscriptionId)
    .query<PartnerSubscriptionRow>(`
      SELECT ps.*, pp.business_name, pp.contact_phone, u.email AS partner_email, u.full_name AS partner_user_name,
             admin_user.full_name AS admin_name
      FROM dbo.partner_subscriptions AS ps
      INNER JOIN dbo.partner_profiles AS pp ON pp.partner_id = ps.partner_id
      INNER JOIN dbo.users AS u ON u.user_id = pp.user_id
      LEFT JOIN dbo.users AS admin_user ON admin_user.user_id = ps.confirmed_by
      WHERE ps.subscription_id = @subscriptionId;
    `);
  return result.recordset[0] ?? null;
}

/**
 * Danh sách đăng ký dành cho Admin kèm lọc và tìm kiếm
 */
export async function adminListSubscriptions(filters: {
  status?: string | undefined;
  packageId?: number | undefined;
  search?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}): Promise<PartnerSubscriptionRow[]> {
  const pool = getPool();
  const request = pool.request();

  let query = `
    SELECT ps.*, pp.business_name, pp.contact_phone, u.email AS partner_email, u.full_name AS partner_user_name,
           admin_user.full_name AS admin_name
    FROM dbo.partner_subscriptions AS ps
    INNER JOIN dbo.partner_profiles AS pp ON pp.partner_id = ps.partner_id
    INNER JOIN dbo.users AS u ON u.user_id = pp.user_id
    LEFT JOIN dbo.users AS admin_user ON admin_user.user_id = ps.confirmed_by
    WHERE 1=1
  `;

  if (filters.status && filters.status !== 'ALL') {
    request.input('status', sql.NVarChar(20), filters.status);
    query += ` AND (ps.subscription_status = @status OR ps.payment_status = @status)`;
  }

  if (filters.packageId) {
    request.input('packageId', sql.Int, filters.packageId);
    query += ` AND ps.package_id = @packageId`;
  }

  if (filters.search) {
    request.input('search', sql.NVarChar(100), `%${filters.search}%`);
    query += ` AND (ps.transaction_code LIKE @search OR pp.business_name LIKE @search OR u.email LIKE @search OR ps.payment_reference LIKE @search)`;
  }

  if (filters.startDate) {
    request.input('startDate', sql.DateTime2, new Date(filters.startDate));
    query += ` AND ps.created_at >= @startDate`;
  }

  if (filters.endDate) {
    request.input('endDate', sql.DateTime2, new Date(filters.endDate));
    query += ` AND ps.created_at <= @endDate`;
  }

  query += ` ORDER BY ps.created_at DESC;`;

  const result = await request.query<PartnerSubscriptionRow>(query);
  return result.recordset;
}

export type AdminConfirmResult =
  | { outcome: 'NOT_FOUND' }
  | { outcome: 'ALREADY_PROCESSED'; currentStatus: string }
  | { outcome: 'CONFIRMED'; subscription: PartnerSubscriptionRow };

/** Write a status log to either supported schema variant found in existing databases. */
export async function insertSubscriptionStatusLog(
  transaction: sql.Transaction,
  input: {
    subscriptionId: number;
    previousStatus: string;
    newStatus: string;
    changedBy: number | null;
    note: string;
  }
): Promise<void> {
  const request = new sql.Request(transaction)
    .input('subscriptionId', sql.Int, input.subscriptionId)
    .input('previousStatus', sql.NVarChar(50), input.previousStatus)
    .input('newStatus', sql.NVarChar(50), input.newStatus)
    .input('changedBy', sql.Int, input.changedBy)
    .input('note', sql.NVarChar(500), input.note);

  await request.query(`
    IF COL_LENGTH(N'dbo.subscription_status_logs', N'old_status') IS NOT NULL
    BEGIN
      EXEC sys.sp_executesql
        N'INSERT INTO dbo.subscription_status_logs (subscription_id, old_status, new_status, changed_by, notes)
          VALUES (@subscriptionId, @previousStatus, @newStatus, @changedBy, @note);',
        N'@subscriptionId INT, @previousStatus NVARCHAR(50), @newStatus NVARCHAR(50), @changedBy INT, @note NVARCHAR(500)',
        @subscriptionId = @subscriptionId,
        @previousStatus = @previousStatus,
        @newStatus = @newStatus,
        @changedBy = @changedBy,
        @note = @note;
    END
    ELSE IF COL_LENGTH(N'dbo.subscription_status_logs', N'previous_status') IS NOT NULL
    BEGIN
      EXEC sys.sp_executesql
        N'INSERT INTO dbo.subscription_status_logs (subscription_id, previous_status, new_status, action_by_user_id, note)
          VALUES (@subscriptionId, @previousStatus, @newStatus, @changedBy, @note);',
        N'@subscriptionId INT, @previousStatus NVARCHAR(50), @newStatus NVARCHAR(50), @changedBy INT, @note NVARCHAR(500)',
        @subscriptionId = @subscriptionId,
        @previousStatus = @previousStatus,
        @newStatus = @newStatus,
        @changedBy = @changedBy,
        @note = @note;
    END
    ELSE
    BEGIN
      THROW 52010, 'Schema dbo.subscription_status_logs không đúng cấu trúc ứng dụng yêu cầu.', 1;
    END;
  `);
}

/**
 * Admin xác nhận thanh toán hợp lệ (dùng TRANSACTION SERIALIZABLE và UPDLOCK để chống double-approval)
 * Xử lý chính xác gia hạn:
 * - Nếu đang có gói active chưa hết hạn: nối tiếp từ end_date hiện tại
 * - Nếu chưa có gói hoặc gói đã hết hạn: tính từ thời điểm hiện tại
 * - Tính đúng lịch tháng bằng DATEADD(month, duration_months, base_date)
 */
export async function adminConfirmSubscriptionPayment(
  subscriptionId: number,
  adminUserId: number
): Promise<AdminConfirmResult> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  let finished = false;

  try {
    // 1. Khóa bản ghi để tránh 2 admin cùng duyệt hoặc click đúp
    const checkReq = new sql.Request(transaction);
    checkReq.input('subscriptionId', sql.Int, subscriptionId);
    const subResult = await checkReq.query<PartnerSubscriptionRow>(`
      SELECT *
      FROM dbo.partner_subscriptions WITH (UPDLOCK, HOLDLOCK)
      WHERE subscription_id = @subscriptionId;
    `);

    const targetSub = subResult.recordset[0];
    if (!targetSub) {
      await transaction.rollback();
      finished = true;
      return { outcome: 'NOT_FOUND' };
    }

    if (targetSub.payment_status !== 'PENDING') {
      await transaction.rollback();
      finished = true;
      return { outcome: 'ALREADY_PROCESSED', currentStatus: targetSub.payment_status };
    }

    // 2. Tìm gói đang active hiện tại của partner này
    const partnerId = targetSub.partner_id;
    const durationMonths = targetSub.duration_months;

    const activeReq = new sql.Request(transaction);
    activeReq.input('partnerId', sql.Int, partnerId);
    const activeSubResult = await activeReq.query<{ end_date: Date }>(`
      SELECT TOP (1) end_date
      FROM dbo.partner_subscriptions WITH (UPDLOCK, HOLDLOCK)
      WHERE partner_id = @partnerId
        AND subscription_status = 'ACTIVE'
        AND payment_status = 'PAID'
        AND end_date > SYSUTCDATETIME()
      ORDER BY end_date DESC;
    `);

    const currentActiveEnd = activeSubResult.recordset[0]?.end_date ?? null;

    // 3. Cập nhật trạng thái và thời hạn sử dụng theo lịch
    const updateReq = new sql.Request(transaction);
    updateReq.input('subscriptionId', sql.Int, subscriptionId);
    updateReq.input('adminUserId', sql.Int, adminUserId);
    updateReq.input('durationMonths', sql.Int, durationMonths);
    updateReq.input('currentActiveEnd', sql.DateTime2, currentActiveEnd);

    const updateResult = await updateReq.query<PartnerSubscriptionRow>(`
      DECLARE @baseDate DATETIME2;
      DECLARE @startDate DATETIME2;
      DECLARE @endDate DATETIME2;

      -- Nếu đang có gói còn hạn, thời hạn mới nối tiếp từ ngày hết hạn hiện tại
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

      -- Tính ngày hết hạn theo lịch dương (xử lý chính xác ngày cuối tháng)
      SET @endDate = DATEADD(month, @durationMonths, @baseDate);

      UPDATE dbo.partner_subscriptions
      SET payment_status = 'PAID',
          subscription_status = 'ACTIVE',
          confirmed_by = @adminUserId,
          confirmed_at = SYSUTCDATETIME(),
          start_date = @startDate,
          end_date = @endDate
      OUTPUT INSERTED.*
      WHERE subscription_id = @subscriptionId AND payment_status = 'PENDING';
    `);

    const confirmedSub = updateResult.recordset[0];
    if (!confirmedSub) {
      await transaction.rollback();
      finished = true;
      return { outcome: 'ALREADY_PROCESSED', currentStatus: 'PROCESSED' };
    }

    await insertSubscriptionStatusLog(transaction, {
      subscriptionId,
      previousStatus: 'PENDING',
      newStatus: 'PAID_AND_ACTIVE',
      changedBy: adminUserId,
      note: 'Admin xác nhận thanh toán hợp lệ và kích hoạt gói.',
    });

    await transaction.commit();
    finished = true;
    return { outcome: 'CONFIRMED', subscription: confirmedSub };
  } catch (error) {
    if (!finished) {
      try { await transaction.rollback(); } catch {}
    }
    throw error;
  }
}

export type AdminRejectResult =
  | { outcome: 'NOT_FOUND' }
  | { outcome: 'ALREADY_PROCESSED'; currentStatus: string }
  | { outcome: 'REJECTED'; subscription: PartnerSubscriptionRow };

/**
 * Admin từ chối thanh toán kèm lý do
 */
export async function adminRejectSubscriptionPayment(
  subscriptionId: number,
  adminUserId: number,
  reason: string
): Promise<AdminRejectResult> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  let finished = false;

  try {
    const checkReq = new sql.Request(transaction);
    checkReq.input('subscriptionId', sql.Int, subscriptionId);
    const subResult = await checkReq.query<PartnerSubscriptionRow>(`
      SELECT *
      FROM dbo.partner_subscriptions WITH (UPDLOCK, HOLDLOCK)
      WHERE subscription_id = @subscriptionId;
    `);

    const targetSub = subResult.recordset[0];
    if (!targetSub) {
      await transaction.rollback();
      finished = true;
      return { outcome: 'NOT_FOUND' };
    }

    if (targetSub.payment_status !== 'PENDING') {
      await transaction.rollback();
      finished = true;
      return { outcome: 'ALREADY_PROCESSED', currentStatus: targetSub.payment_status };
    }

    const updateReq = new sql.Request(transaction);
    updateReq.input('subscriptionId', sql.Int, subscriptionId);
    updateReq.input('adminUserId', sql.Int, adminUserId);
    updateReq.input('reason', sql.NVarChar(500), reason);

    const updateResult = await updateReq.query<PartnerSubscriptionRow>(`
      UPDATE dbo.partner_subscriptions
      SET payment_status = 'REJECTED',
          subscription_status = 'REJECTED',
          confirmed_by = @adminUserId,
          confirmed_at = SYSUTCDATETIME(),
          rejection_reason = @reason
      OUTPUT INSERTED.*
      WHERE subscription_id = @subscriptionId AND payment_status = 'PENDING';
    `);

    const rejectedSub = updateResult.recordset[0];
    if (!rejectedSub) {
      await transaction.rollback();
      finished = true;
      return { outcome: 'ALREADY_PROCESSED', currentStatus: 'PROCESSED' };
    }

    await insertSubscriptionStatusLog(transaction, {
      subscriptionId,
      previousStatus: 'PENDING',
      newStatus: 'REJECTED',
      changedBy: adminUserId,
      note: reason,
    });

    await transaction.commit();
    finished = true;
    return { outcome: 'REJECTED', subscription: rejectedSub };
  } catch (error) {
    if (!finished) {
      try { await transaction.rollback(); } catch {}
    }
    throw error;
  }
}

export interface RevenueStats {
  totalRevenue: number;
  totalConfirmedCount: number;
  totalPendingCount: number;
  totalRejectedCount: number;
  activePackagesCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  byPackage: { packageCode: string; packageName: string; revenue: number; count: number }[];
  byDay: { date: string; revenue: number; count: number }[];
  byMonth: { month: string; revenue: number; count: number }[];
}

/**
 * Thống kê doanh thu CHỈ từ phí đăng ký gói đối tác DaNangGo
 * Chỉ tính giao dịch đã xác nhận (payment_status = 'PAID'), ghi nhận theo confirmed_at.
 */
export async function getRevenueStatistics(filters: {
  startDate?: string | undefined;
  endDate?: string | undefined;
  packageId?: number | undefined;
}): Promise<RevenueStats> {
  const pool = getPool();

  const reqSummary = pool.request();
  let summaryWhere = `WHERE 1=1`;

  if (filters.startDate) {
    reqSummary.input('startDate', sql.DateTime2, new Date(filters.startDate));
    summaryWhere += ` AND (confirmed_at >= @startDate OR (confirmed_at IS NULL AND created_at >= @startDate))`;
  }
  if (filters.endDate) {
    reqSummary.input('endDate', sql.DateTime2, new Date(filters.endDate));
    summaryWhere += ` AND (confirmed_at < DATEADD(day, 1, CONVERT(date, @endDate)) OR (confirmed_at IS NULL AND created_at < DATEADD(day, 1, CONVERT(date, @endDate))))`;
  }
  if (filters.packageId) {
    reqSummary.input('packageId', sql.Int, filters.packageId);
    summaryWhere += ` AND package_id = @packageId`;
  }

  // 1. Thống kê tổng quan các chỉ số
  const summaryRes = await reqSummary.query<{
    total_revenue: number;
    paid_count: number;
    pending_count: number;
    rejected_count: number;
  }>(`
    SELECT
      COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN price ELSE 0 END), 0) AS total_revenue,
      COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) AS paid_count,
      COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) AS pending_count,
      COUNT(CASE WHEN payment_status = 'REJECTED' THEN 1 END) AS rejected_count
    FROM dbo.partner_subscriptions
    ${summaryWhere};
  `);
  const summary = summaryRes.recordset[0] ?? {
    total_revenue: 0,
    paid_count: 0,
    pending_count: 0,
    rejected_count: 0,
  };

  // 2. Thống kê số lượng gói đang hoạt động, sắp hết hạn (< 7 ngày), đã hết hạn
  const packageStatusRes = await pool.request().query<{
    active_count: number;
    expiring_soon_count: number;
    expired_count: number;
  }>(`
    WITH partner_subscription_ends AS (
      SELECT partner_id, MAX(end_date) AS end_date
      FROM dbo.partner_subscriptions
      WHERE payment_status = 'PAID'
        AND subscription_status IN ('ACTIVE', 'EXPIRED')
      GROUP BY partner_id
    )
    SELECT
      COUNT(CASE WHEN end_date > SYSUTCDATETIME() THEN 1 END) AS active_count,
      COUNT(CASE WHEN end_date > SYSUTCDATETIME() AND end_date <= DATEADD(day, 7, SYSUTCDATETIME()) THEN 1 END) AS expiring_soon_count,
      COUNT(CASE WHEN end_date <= SYSUTCDATETIME() THEN 1 END) AS expired_count
    FROM partner_subscription_ends;
  `);
  const statusStats = packageStatusRes.recordset[0] ?? {
    active_count: 0,
    expiring_soon_count: 0,
    expired_count: 0,
  };

  // 3. Doanh thu theo loại gói (1 tháng, 6 tháng, 1 năm)
  const reqPackage = pool.request();
  let packageWhere = `WHERE ps.payment_status = 'PAID'`;
  if (filters.startDate) {
    reqPackage.input('startDate', sql.DateTime2, new Date(filters.startDate));
    packageWhere += ` AND ps.confirmed_at >= @startDate`;
  }
  if (filters.endDate) {
    reqPackage.input('endDate', sql.DateTime2, new Date(filters.endDate));
    packageWhere += ` AND ps.confirmed_at < DATEADD(day, 1, CONVERT(date, @endDate))`;
  }
  if (filters.packageId) {
    reqPackage.input('packageId', sql.Int, filters.packageId);
    packageWhere += ` AND ps.package_id = @packageId`;
  }

  const byPackageRes = await reqPackage.query<{
    package_code: string;
    package_name: string;
    revenue: number;
    tx_count: number;
  }>(`
    SELECT
      COALESCE(sp.package_code, 'CUSTOM') AS package_code,
      ps.package_name,
      SUM(ps.price) AS revenue,
      COUNT(*) AS tx_count
    FROM dbo.partner_subscriptions AS ps
    LEFT JOIN dbo.subscription_packages AS sp ON sp.package_id = ps.package_id
    ${packageWhere}
    GROUP BY sp.package_code, ps.package_name
    ORDER BY revenue DESC;
  `);

  // 4. Doanh thu theo ngày (7 ngày gần nhất hoặc theo filter)
  const reqDay = pool.request();
  let dayWhere = `WHERE payment_status = 'PAID' AND confirmed_at >= DATEADD(day, -30, SYSUTCDATETIME())`;
  if (filters.startDate) {
    reqDay.input('startDate', sql.DateTime2, new Date(filters.startDate));
    dayWhere = `WHERE payment_status = 'PAID' AND confirmed_at >= @startDate`;
  }
  if (filters.endDate) {
    reqDay.input('endDate', sql.DateTime2, new Date(filters.endDate));
    dayWhere += ` AND confirmed_at < DATEADD(day, 1, CONVERT(date, @endDate))`;
  }
  if (filters.packageId) {
    reqDay.input('packageId', sql.Int, filters.packageId);
    dayWhere += ` AND package_id = @packageId`;
  }

  const byDayRes = await reqDay.query<{
    tx_date: string;
    revenue: number;
    tx_count: number;
  }>(`
    SELECT
      CONVERT(VARCHAR(10), confirmed_at, 23) AS tx_date,
      SUM(price) AS revenue,
      COUNT(*) AS tx_count
    FROM dbo.partner_subscriptions
    ${dayWhere}
    GROUP BY CONVERT(VARCHAR(10), confirmed_at, 23)
    ORDER BY tx_date ASC;
  `);

  // 5. Doanh thu theo tháng
  const reqMonth = pool.request();
  let monthWhere = `WHERE payment_status = 'PAID' AND confirmed_at IS NOT NULL`;
  if (filters.startDate) {
    reqMonth.input('startDate', sql.DateTime2, new Date(filters.startDate));
    monthWhere += ` AND confirmed_at >= @startDate`;
  }
  if (filters.endDate) {
    reqMonth.input('endDate', sql.DateTime2, new Date(filters.endDate));
    monthWhere += ` AND confirmed_at < DATEADD(day, 1, CONVERT(date, @endDate))`;
  }
  if (filters.packageId) {
    reqMonth.input('packageId', sql.Int, filters.packageId);
    monthWhere += ` AND package_id = @packageId`;
  }

  const byMonthRes = await reqMonth.query<{
    tx_month: string;
    revenue: number;
    tx_count: number;
  }>(`
    SELECT
      FORMAT(confirmed_at, 'yyyy-MM') AS tx_month,
      SUM(price) AS revenue,
      COUNT(*) AS tx_count
    FROM dbo.partner_subscriptions
    ${monthWhere}
    GROUP BY FORMAT(confirmed_at, 'yyyy-MM')
    ORDER BY tx_month ASC;
  `);

  return {
    totalRevenue: Number(summary.total_revenue),
    totalConfirmedCount: Number(summary.paid_count),
    totalPendingCount: Number(summary.pending_count),
    totalRejectedCount: Number(summary.rejected_count),
    activePackagesCount: Number(statusStats.active_count),
    expiringSoonCount: Number(statusStats.expiring_soon_count),
    expiredCount: Number(statusStats.expired_count),
    byPackage: byPackageRes.recordset.map((r) => ({
      packageCode: r.package_code,
      packageName: r.package_name,
      revenue: Number(r.revenue),
      count: Number(r.tx_count),
    })),
    byDay: byDayRes.recordset.map((r) => ({
      date: r.tx_date,
      revenue: Number(r.revenue),
      count: Number(r.tx_count),
    })),
    byMonth: byMonthRes.recordset.map((r) => ({
      month: r.tx_month,
      revenue: Number(r.revenue),
      count: Number(r.tx_count),
    })),
  };
}

export const getRevenueStats = getRevenueStatistics;
