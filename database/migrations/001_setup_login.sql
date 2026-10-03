-- ============================================================
-- DaNangGo Database Setup Script
-- Chạy file này để tạo login và user cho ứng dụng
-- ============================================================

-- 1. Tạo login (chạy trong context master)
USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'danangogo_app')
BEGIN
    CREATE LOGIN danangogo_app WITH PASSWORD = 'TuTran@123';
    PRINT 'Đã tạo login danangogo_app';
END
ELSE
BEGIN
    ALTER LOGIN danangogo_app WITH PASSWORD = 'TuTran@123';
    PRINT 'Đã cập nhật password cho danangogo_app';
END
GO

-- 2. Tạo user trong database DaNangGo
USE DaNangGo;
GO

IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'danangogo_app')
BEGIN
    CREATE USER danangogo_app FOR LOGIN danangogo_app;
    PRINT 'Đã tạo user danangogo_app';
END
GO

-- 3. Cấp quyền đọc/ghi
ALTER ROLE db_datareader ADD MEMBER danangogo_app;
ALTER ROLE db_datawriter ADD MEMBER danangogo_app;
GO

PRINT '✅ Setup hoàn tất! danangogo_app đã có quyền đọc/ghi trên DaNangGo';
