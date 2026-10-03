-- ============================================================
-- Migration: 002_create_booking_tables.sql
-- Tạo các bảng liên quan đến đặt dịch vụ
-- ============================================================

USE DaNangGo;
GO

-- 1. Bảng bookings - Đơn đặt chung cho mọi loại dịch vụ
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'bookings')
BEGIN
    CREATE TABLE bookings (
        booking_id      INT IDENTITY(1,1) PRIMARY KEY,
        user_id         INT NOT NULL,
        place_id        INT NULL,
        booking_type    NVARCHAR(20) NOT NULL CHECK (booking_type IN ('STAY', 'TABLE', 'TICKET')),
        status          NVARCHAR(20) NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
        total_amount    DECIMAL(18, 2) NOT NULL DEFAULT 0,
        contact_name    NVARCHAR(100) NOT NULL,
        contact_phone   NVARCHAR(20) NOT NULL,
        note            NVARCHAR(500) NULL,
        created_at      DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME NULL
    );
    PRINT '✅ Đã tạo bảng bookings';
END
ELSE
    PRINT '⚠️ Bảng bookings đã tồn tại';
GO

-- 2. Bảng booking_items - Từng mục trong đơn
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'booking_items')
BEGIN
    CREATE TABLE booking_items (
        item_id         INT IDENTITY(1,1) PRIMARY KEY,
        booking_id      INT NOT NULL,
        room_type_id    INT NULL,           -- Dùng khi booking_type = 'STAY'
        menu_item_id    INT NULL,           -- Dùng khi booking_type = 'TABLE'
        quantity        INT NOT NULL DEFAULT 1,
        unit_price      DECIMAL(18, 2) NOT NULL DEFAULT 0,
        check_in        DATE NULL,          -- Ngày nhận phòng (STAY)
        check_out       DATE NULL,          -- Ngày trả phòng (STAY)
        visit_date      DATE NULL,          -- Ngày đến (TABLE / TICKET)
        party_size      INT NULL,           -- Số người
        CONSTRAINT FK_booking_items_booking FOREIGN KEY (booking_id)
            REFERENCES bookings(booking_id) ON DELETE CASCADE
    );
    PRINT '✅ Đã tạo bảng booking_items';
END
ELSE
    PRINT '⚠️ Bảng booking_items đã tồn tại';
GO

-- 3. Bảng payments - Thanh toán của đơn
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'payments')
BEGIN
    CREATE TABLE payments (
        payment_id      INT IDENTITY(1,1) PRIMARY KEY,
        booking_id      INT NOT NULL,
        method          NVARCHAR(20) NOT NULL CHECK (method IN ('CASH', 'BANK_TRANSFER', 'MOMO', 'VNPAY')),
        amount          DECIMAL(18, 2) NOT NULL,
        status          NVARCHAR(20) NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
        paid_at         DATETIME NULL,
        reference_code  NVARCHAR(100) NULL,   -- Mã giao dịch ngân hàng
        created_at      DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_payments_booking FOREIGN KEY (booking_id)
            REFERENCES bookings(booking_id) ON DELETE CASCADE
    );
    PRINT '✅ Đã tạo bảng payments';
END
ELSE
    PRINT '⚠️ Bảng payments đã tồn tại';
GO

-- 4. Bảng booking_status_logs - Lịch sử đổi trạng thái
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'booking_status_logs')
BEGIN
    CREATE TABLE booking_status_logs (
        log_id          INT IDENTITY(1,1) PRIMARY KEY,
        booking_id      INT NOT NULL,
        old_status      NVARCHAR(20) NULL,
        new_status      NVARCHAR(20) NOT NULL,
        changed_by      INT NULL,             -- user_id của người thay đổi
        changed_at      DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_status_logs_booking FOREIGN KEY (booking_id)
            REFERENCES bookings(booking_id) ON DELETE CASCADE
    );
    PRINT '✅ Đã tạo bảng booking_status_logs';
END
ELSE
    PRINT '⚠️ Bảng booking_status_logs đã tồn tại';
GO

PRINT '';
PRINT '🎉 Hoàn tất! Đã tạo đủ 4 bảng booking.';
