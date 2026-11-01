import assert from 'node:assert/strict';
import express from 'express';
import { deflateSync } from 'node:zlib';
import { detectReviewImageMime, parseReviewMultipart, parseReviewUpload } from '../src/modules/reviews/reviews.upload';

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, content: Buffer): Buffer {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(content.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, content])));
  return Buffer.concat([length, typeBuffer, content, checksum]);
}

function validPng(): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]);
  return Buffer.concat([signature, pngChunk('IHDR', header), pngChunk('IDAT', deflateSync(Buffer.from([0, 255, 0, 0]))), pngChunk('IEND', Buffer.alloc(0))]);
}

function validJpeg(): Buffer {
  return Buffer.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x00,
    0xff, 0xd9,
  ]);
}

function validWebp(): Buffer {
  const chunk = Buffer.from([0x56, 0x50, 0x38, 0x4c, 0x05, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const header = Buffer.from('WEBP');
  const size = Buffer.alloc(4);
  size.writeUInt32LE(4 + chunk.length);
  return Buffer.concat([Buffer.from('RIFF'), size, header, chunk]);
}

function multipart(files: Buffer[], keepImageIds?: number[]): Buffer {
  const boundary = 'review-test-boundary';
  const parts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="rating"\r\n\r\n5\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="comment"\r\n\r\nHay\r\n`,
    ...(keepImageIds ? [`--${boundary}\r\nContent-Disposition: form-data; name="keepImageIds"\r\n\r\n${JSON.stringify(keepImageIds)}\r\n`] : []),
    ...files.map((file) => Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="photo.png"\r\nContent-Type: image/png\r\n\r\n`),
      file,
      Buffer.from('\r\n'),
    ])),
    `--${boundary}--\r\n`,
  ];
  return Buffer.concat(parts.map((part) => typeof part === 'string' ? Buffer.from(part) : part));
}

const png = validPng();
assert.equal(detectReviewImageMime(png), 'image/png');
assert.equal(detectReviewImageMime(validJpeg()), 'image/jpeg');
assert.equal(detectReviewImageMime(validWebp()), 'image/webp');
const parsed = parseReviewMultipart(multipart([png]), 'review-test-boundary');
assert.equal(parsed.fields.rating, '5');
assert.equal(parsed.images.length, 1);
assert.equal(parseReviewMultipart(multipart([], [12, 13]), 'review-test-boundary').fields.keepImageIds, '[12,13]');
assert.equal(parseReviewMultipart(multipart(Array(5).fill(png)), 'review-test-boundary').images.length, 5);
assert.throws(() => parseReviewMultipart(multipart(Array(6).fill(png)), 'review-test-boundary'), /tối đa 5 ảnh/);
assert.throws(() => parseReviewMultipart(multipart([Buffer.alloc(5 * 1024 * 1024 + 1)]), 'review-test-boundary'), /5 MB/);
assert.throws(() => parseReviewMultipart(multipart([Buffer.from('not an image')]), 'review-test-boundary'), /JPG, PNG hoặc WEBP/);
assert.equal(detectReviewImageMime(Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.from('fakeIEND')])), null);

async function verifyBrowserMultipart() {
  const form = new FormData();
  form.set('rating', '4');
  form.set('comment', 'Ổn');
  form.append('images', new Blob([png], { type: 'image/png' }), 'photo.png');
  const request = new Request('http://localhost/reviews', { method: 'POST', body: form });
  const boundary = /boundary=([^;]+)/i.exec(request.headers.get('content-type') ?? '')?.[1];
  assert.ok(boundary);
  const browserParsed = parseReviewMultipart(Buffer.from(await request.arrayBuffer()), boundary);
  assert.equal(browserParsed.fields.rating, '4');
  assert.equal(browserParsed.fields.comment, 'Ổn');
  assert.equal(browserParsed.images.length, 1);

  const app = express();
  app.put('/review/:id', parseReviewUpload, (request, response) => response.json({ body: request.body, imageCount: request.reviewImages?.length }));
  const server = app.listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const updateForm = new FormData();
    updateForm.set('rating', '4');
    updateForm.set('comment', 'Ổn');
    updateForm.set('keepImageIds', '[12,13]');
    updateForm.append('images', new Blob([png], { type: 'image/png' }), 'photo.png');
    const parsedResponse = await fetch(`http://127.0.0.1:${address.port}/review/1`, { method: 'PUT', body: updateForm });
    const result = await parsedResponse.json() as { body: { rating: number; comment: string; keepImageIds: number[] }; imageCount: number };
    assert.equal(parsedResponse.status, 200);
    assert.deepEqual(result.body, { rating: 4, comment: 'Ổn', keepImageIds: [12, 13] });
    assert.equal(result.imageCount, 1);
  } finally {
    server.close();
  }
}

void verifyBrowserMultipart().then(() => console.log('✅ Review upload: định dạng, giới hạn và multipart từ FormData đạt.'));
