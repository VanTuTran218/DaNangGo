import { createHmac, timingSafeEqual } from 'node:crypto';
import express, { Router, type Request, type Response } from 'express';
import { processSePayTransaction, type SePayTransactionPayload } from './sepay.repository';

const router = Router();

// This route is mounted before express.json() so the HMAC is checked against
// the exact JSON bytes sent by SePay.
router.use(express.raw({ type: 'application/json', limit: '1mb' }));

router.post('/', async (req: Request, res: Response) => {
  const secret = process.env.SEPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    res.status(503).json({ success: false, message: 'SePay webhook chưa được cấu hình.' });
    return;
  }

  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    res.status(400).json({ success: false, message: 'Webhook cần raw JSON body.' });
    return;
  }

  const rawBody = req.body as Buffer;
  const timestamp = req.get('x-sepay-timestamp') ?? '';
  const signature = req.get('x-sepay-signature') ?? '';
  if (!/^\d{10}$/.test(timestamp) || !/^sha256=[a-f0-9]{64}$/i.test(signature)) {
    res.status(401).json({ success: false, message: 'Thiếu hoặc sai định dạng chữ ký SePay.' });
    return;
  }

  const maxAgeSeconds = Number(process.env.SEPAY_WEBHOOK_MAX_AGE_SECONDS || 300);
  const requestAge = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(maxAgeSeconds) || requestAge > maxAgeSeconds) {
    res.status(401).json({ success: false, message: 'Webhook đã quá thời hạn chấp nhận.' });
    return;
  }

  const expected = `sha256=${createHmac('sha256', secret)
    .update(Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), rawBody]))
    .digest('hex')}`;
  const receivedBytes = Buffer.from(signature.toLowerCase(), 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  if (receivedBytes.length !== expectedBytes.length || !timingSafeEqual(receivedBytes, expectedBytes)) {
    res.status(401).json({ success: false, message: 'Chữ ký webhook không hợp lệ.' });
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ success: false, message: 'Payload webhook không phải JSON hợp lệ.' });
    return;
  }

  if (!isSePayPayload(payload)) {
    res.status(400).json({ success: false, message: 'Payload giao dịch SePay không hợp lệ.' });
    return;
  }

  try {
    const result = await processSePayTransaction(payload, rawBody.toString('utf8'));
    // Acknowledge valid but unmatched transactions too; they are stored for manual review.
    res.status(200).json({ success: true, duplicate: result.duplicate, status: result.status });
  } catch (error) {
    console.error('SePay webhook processing failed:', error);
    // A 5xx response asks SePay to retry. DB changes are transactional/idempotent.
    res.status(500).json({ success: false, message: 'Không thể xử lý giao dịch lúc này.' });
  }
});

function isSePayPayload(value: unknown): value is SePayTransactionPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return Number.isSafeInteger(payload.id)
    && Number(payload.id) > 0
    && (payload.accountNumber === undefined || payload.accountNumber === null || typeof payload.accountNumber === 'string')
    && (payload.transferType === 'in' || payload.transferType === 'out')
    && Number.isSafeInteger(payload.transferAmount)
    && Number(payload.transferAmount) >= 0
    && (payload.code === undefined || payload.code === null || typeof payload.code === 'string')
    && (payload.content === undefined || payload.content === null || typeof payload.content === 'string')
    && (payload.referenceCode === undefined || payload.referenceCode === null || typeof payload.referenceCode === 'string')
    && (payload.transactionDate === undefined || payload.transactionDate === null || typeof payload.transactionDate === 'string');
}

export default router;
