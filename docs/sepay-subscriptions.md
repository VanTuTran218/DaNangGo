# SePay integration for partner subscriptions

## Setup

1. Run `database/migrations/006_sepay_webhook.sql` manually against the `DaNangGo` SQL Server database.
2. Copy the `SEPAY_*` settings from `backend/.env.example` into the backend `.env` and fill in the real receiving account details. `SEPAY_BANK_CODE` should be the bank BIN accepted by VietQR. Do not commit `.env`.
3. In SePay, create a webhook for incoming transfers and configure HMAC-SHA256. Set the callback URL to `https://<public-api-host>/api/webhooks/sepay`, then save its Secret Key as `SEPAY_WEBHOOK_SECRET` in the backend environment.
4. Configure SePay to recognize payment codes with prefix `DNG` and a 10-character alphanumeric suffix. New subscription requests use a code in that format; the generated QR includes the amount and code.
5. Restart the backend after changing environment variables.

If `SEPAY_WEBHOOK_SECRET` is empty, the partner UI clearly indicates manual review: an Admin must verify the bank transfer and confirm it in the Admin subscription page. A secret alone only enables signature verification on the backend; an active SePay webhook with the public callback URL is also required for automatic confirmation.

## Processing behavior

- The webhook verifies the HMAC against the raw request body and rejects stale timestamps.
- The SePay transaction ID is the primary key in `dbo.sepay_webhook_transactions`, so retries cannot activate a subscription twice.
- Only incoming transfers that match a pending subscription code and its exact price activate the subscription. The activation and webhook ledger update share a SQL transaction.
- Valid unmatched transfers, wrong amounts, and outgoing transfers are recorded with a processing status. Admins can inspect the latest events at `GET /api/admin/subscriptions/webhook-transactions`.
- Matched transactions appear as `PAID` in the existing Admin subscription list. Admin confirmation remains available for manual reconciliation; already paid subscriptions cannot be approved twice.
- The partner payment-proof form remains available for supplemental information when automatic matching needs help.

## Notes

- The webhook endpoint is mounted before the global JSON parser because HMAC verification requires the original bytes.
- Account details are returned to the partner UI and are not secret. The HMAC secret must stay on the backend.
- Existing subscription requests made before the new compact `DNG` payment-code format may not be auto-matched. Reconcile those manually.
