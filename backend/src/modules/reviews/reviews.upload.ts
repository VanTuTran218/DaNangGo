import type { RequestHandler } from "express";
import { inflateSync } from "node:zlib";

export interface ReviewImageUpload {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  data: Buffer;
}

const maxBytes = 5 * 1024 * 1024;
const maxRequestBytes = 26 * 1024 * 1024;

function invalid(message: string): Error {
  return Object.assign(new Error(message), { status: 400 });
}

const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit++)
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

function validPng(data: Buffer): boolean {
  if (
    data.length < 45 ||
    !data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return false;
  let offset = 8;
  let hasHeader = false;
  const imageData: Buffer[] = [];
  while (offset + 12 <= data.length) {
    const size = data.readUInt32BE(offset);
    const end = offset + 12 + size;
    if (end > data.length) return false;
    const type = data.toString("ascii", offset + 4, offset + 8);
    let crc = 0xffffffff;
    for (let index = offset + 4; index < offset + 8 + size; index++)
      crc = crcTable[(crc ^ data[index]!) & 0xff]! ^ (crc >>> 8);
    if ((crc ^ 0xffffffff) >>> 0 !== data.readUInt32BE(offset + 8 + size))
      return false;
    if (!hasHeader) {
      if (type !== "IHDR" || size !== 13) return false;
      const width = data.readUInt32BE(offset + 8);
      const height = data.readUInt32BE(offset + 12);
      if (width < 1 || height < 1 || width * height > 40_000_000) return false;
      hasHeader = true;
    }
    if (type === "IDAT" && size)
      imageData.push(data.subarray(offset + 8, offset + 8 + size));
    offset = end;
    if (type === "IEND") {
      if (size !== 0 || !imageData.length || offset !== data.length)
        return false;
      try {
        return (
          inflateSync(Buffer.concat(imageData), {
            maxOutputLength: 160 * 1024 * 1024,
          }).length > 0
        );
      } catch {
        return false;
      }
    }
  }
  return false;
}

function validJpeg(data: Buffer): boolean {
  if (
    data.length < 12 ||
    data[0] !== 0xff ||
    data[1] !== 0xd8 ||
    data[data.length - 2] !== 0xff ||
    data[data.length - 1] !== 0xd9
  )
    return false;
  let offset = 2;
  let hasFrame = false;
  while (offset < data.length - 2 && data[offset] === 0xff) {
    while (data[offset] === 0xff) offset++;
    const marker = data[offset++]!;
    if (
      marker === 0xd8 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    )
      continue;
    if (offset + 2 > data.length) return false;
    const length = data.readUInt16BE(offset);
    if (length < 2 || offset + length > data.length) return false;
    if (
      [
        0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
        0xcf,
      ].includes(marker)
    ) {
      if (
        length < 8 ||
        data.readUInt16BE(offset + 3) * data.readUInt16BE(offset + 5) >
          40_000_000
      )
        return false;
      hasFrame = true;
    }
    if (marker === 0xda) return hasFrame && data.length >= offset + length + 3;
    offset += length;
  }
  return false;
}

function validWebp(data: Buffer): boolean {
  if (
    data.length < 20 ||
    data.toString("ascii", 0, 4) !== "RIFF" ||
    data.toString("ascii", 8, 12) !== "WEBP" ||
    data.readUInt32LE(4) !== data.length - 8
  )
    return false;
  let offset = 12;
  let hasImage = false;
  while (offset + 8 <= data.length) {
    const type = data.toString("ascii", offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    const end = offset + 8 + size + (size % 2);
    if (end > data.length) return false;
    if (
      type === "VP8 " &&
      size >= 10 &&
      data.toString("hex", offset + 11, offset + 14) === "9d012a"
    )
      hasImage = true;
    if (type === "VP8L" && size >= 5 && data[offset + 8] === 0x2f)
      hasImage = true;
    offset = end;
  }
  return hasImage && offset === data.length;
}

export function detectReviewImageMime(
  data: Buffer,
): ReviewImageUpload["mimeType"] | null {
  if (validJpeg(data)) return "image/jpeg";
  if (validPng(data)) return "image/png";
  if (validWebp(data)) return "image/webp";
  return null;
}

export function parseReviewMultipart(
  data: Buffer,
  boundary: string,
): { fields: Record<string, string>; images: ReviewImageUpload[] } {
  const delimiter = Buffer.from(`--${boundary}`);
  const fields: Record<string, string> = {};
  const images: ReviewImageUpload[] = [];
  let cursor = data.indexOf(delimiter);

  while (cursor >= 0) {
    cursor += delimiter.length;
    if (data.subarray(cursor, cursor + 2).toString() === "--") break;
    if (data.subarray(cursor, cursor + 2).toString() !== "\r\n")
      throw invalid("Dữ liệu ảnh gửi lên không hợp lệ.");
    const headerEnd = data.indexOf("\r\n\r\n", cursor, "latin1");
    if (headerEnd < 0) throw invalid("Dữ liệu ảnh gửi lên không hợp lệ.");
    const headers = data.toString("latin1", cursor, headerEnd);
    const name = /(?:^|;)\s*name="([^"]+)"/i.exec(headers)?.[1];
    const isFile = /(?:^|;)\s*filename="[^"]*"/i.test(headers);
    const bodyStart = headerEnd + 4;
    const next = data.indexOf(
      Buffer.concat([Buffer.from("\r\n"), delimiter]),
      bodyStart,
    );
    if (next < 0) throw invalid("Dữ liệu ảnh gửi lên không hợp lệ.");
    const value = data.subarray(bodyStart, next);

    if (isFile) {
      if (name !== "images") throw invalid("Trường ảnh gửi lên không hợp lệ.");
      if (images.length >= 5)
        throw invalid("Mỗi đánh giá chỉ được đính kèm tối đa 5 ảnh.");
      if (value.length > maxBytes)
        throw invalid("Mỗi ảnh không được vượt quá 5 MB.");
      const mimeType = detectReviewImageMime(value);
      if (!mimeType) throw invalid("Ảnh phải là JPG, PNG hoặc WEBP hợp lệ.");
      images.push({ mimeType, data: value });
    } else {
      if (
        !name ||
        !["rating", "comment", "keepImageIds"].includes(name) ||
        name in fields
      )
        throw invalid("Thông tin đánh giá gửi lên không hợp lệ.");
      fields[name] = value.toString("utf8");
    }
    cursor = next + 2;
    cursor = data.indexOf(delimiter, cursor);
  }

  return { fields, images };
}

// Dùng chung cho tạo và sửa review để giới hạn request, xác thực nội dung ảnh thật trước khi vào service.
export const parseReviewUpload: RequestHandler = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    req.reviewImages = [];
    next();
    return;
  }
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(
    req.get("content-type") ?? "",
  );
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];
  const rawBoundary = boundary;
  if (
    !rawBoundary ||
    rawBoundary.length > 70 ||
    !/^[\w'()+_,./:=?-]+$/.test(rawBoundary)
  ) {
    res
      .status(400)
      .json({ success: false, message: "Định dạng dữ liệu ảnh không hợp lệ." });
    return;
  }
  const chunks: Buffer[] = [];
  let total = 0;
  let tooLarge = false;
  req.on("data", (chunk: Buffer) => {
    total += chunk.length;
    if (total > maxRequestBytes) {
      tooLarge = true;
      return;
    }
    chunks.push(chunk);
  });
  req.on("end", () => {
    if (tooLarge) {
      res.status(413).json({
        success: false,
        message: "Tổng dung lượng ảnh vượt quá giới hạn cho phép.",
      });
      return;
    }
    try {
      const parsed = parseReviewMultipart(Buffer.concat(chunks), rawBoundary);
      let keepImageIds: unknown;
      try {
        keepImageIds =
          parsed.fields.keepImageIds === undefined
            ? undefined
            : JSON.parse(parsed.fields.keepImageIds);
      } catch {
        throw invalid("Danh sách ảnh giữ lại không hợp lệ.");
      }
      req.body = {
        ...parsed.fields,
        rating: Number(parsed.fields.rating),
        ...(keepImageIds === undefined ? {} : { keepImageIds }),
      };
      req.reviewImages = parsed.images;
      next();
    } catch (error) {
      if (error instanceof Error && "status" in error) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  });
  req.on("error", next);
};

declare global {
  namespace Express {
    interface Request {
      reviewImages?: ReviewImageUpload[];
    }
  }
}
