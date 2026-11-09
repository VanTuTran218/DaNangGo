import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import { once } from "node:events";
import { aiRouter } from "../src/modules/ai/ai.routes";
import {
  feedbackFeatures,
  type FeedbackCounts,
} from "../src/modules/ai/ai.feedback-readiness";
const empty: FeedbackCounts = {
  approvedReviews: 0,
  pendingReviews: 0,
  summaryReadyPlaces: 0,
  partnerReplyReviews: 0,
  submittedResponses: 0,
  textAnswers: 0,
};
test("Dữ liệu trống không giả trạng thái sẵn sàng hoặc tự tạo phản hồi", () => {
  assert.ok(
    feedbackFeatures(empty).every(
      (feature) => !feature.ready && feature.available === 0,
    ),
  );
});
test("Nhiều đánh giá rải rác chưa thay thế 5 đánh giá cùng địa điểm; phiếu chỉ điểm không đủ nhóm chủ đề", () => {
  const result = feedbackFeatures({
    ...empty,
    approvedReviews: 12,
    submittedResponses: 20,
  });
  assert.equal(result.find((f) => f.key === "reviewSummary")!.ready, false);
  assert.equal(result.find((f) => f.key === "survey")!.ready, false);
});
test("Bốn tính năng chỉ sẵn sàng theo dữ kiện riêng của chúng", () => {
  const result = feedbackFeatures({
    ...empty,
    summaryReadyPlaces: 1,
    partnerReplyReviews: 2,
    pendingReviews: 3,
    textAnswers: 4,
  });
  assert.deepEqual(
    result.map((f) => f.available),
    [1, 2, 3, 4],
  );
  assert.ok(result.every((f) => f.ready));
});
test("API tình trạng phản hồi yêu cầu quyền Admin trước khi đọc database", async () => {
  const app = express();
  app.use(cookieParser());
  app.use("/ai", aiRouter);
  const server = app.listen(0);
  await once(server, "listening");
  try {
    const address = server.address() as import("node:net").AddressInfo;
    const response = await fetch(
      `http://127.0.0.1:${address.port}/ai/admin/feedback-readiness`,
    );
    assert.equal(response.status, 401);
  } finally {
    server.close();
    await once(server, "close");
  }
});
