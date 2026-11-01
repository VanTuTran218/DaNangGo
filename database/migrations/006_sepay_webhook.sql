-- SePay webhook transaction ledger for idempotent bank-transfer reconciliation.
USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.sepay_webhook_transactions', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.sepay_webhook_transactions (
            sepay_id          BIGINT NOT NULL CONSTRAINT PK_sepay_webhook_transactions PRIMARY KEY,
            transaction_code  NVARCHAR(50) NULL,
            transfer_type     NVARCHAR(10) NOT NULL,
            transfer_amount   BIGINT NOT NULL,
            reference_code    NVARCHAR(255) NULL,
            transaction_date  NVARCHAR(40) NULL,
            processing_status NVARCHAR(30) NOT NULL,
            processing_note   NVARCHAR(500) NULL,
            raw_payload       NVARCHAR(MAX) NOT NULL,
            received_at       DATETIME2 NOT NULL CONSTRAINT DF_sepay_webhook_received_at DEFAULT (SYSUTCDATETIME()),
            processed_at      DATETIME2 NULL
        );

        CREATE INDEX IX_sepay_webhook_transactions_status_received
            ON dbo.sepay_webhook_transactions (processing_status, received_at DESC);
        CREATE INDEX IX_sepay_webhook_transactions_code
            ON dbo.sepay_webhook_transactions (transaction_code);
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
