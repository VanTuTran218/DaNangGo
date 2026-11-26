import test from "node:test";
import assert from "node:assert/strict";
import { connectDB, closeDB, getPool, sql } from "../src/config/db";
import {
  eventInputSchema,
  statusPatchSchema,
  validateEventPublishRequirements,
  EventError,
} from "../src/modules/events/events.validation";
import {
  ensureEventsSchemaAndSeed,
  listPublicEvents,
  getPublicEventByIdOrSlug,
  listAdminEvents,
  createAdminEvent,
  updateAdminEvent,
  changeAdminEventStatus,
  listEventSubmissions,
  getEventSubmissionById,
  reviewEventSubmission,
  listUpcomingEventAlerts,
  subscribeEventReminder,
} from "../src/modules/events/events.repository";

test("Validation sự kiện: DRAFT cho phép thiếu thông tin, PUBLISHED bắt buộc đủ trường và kiểm tra giờ kết thúc", () => {
  const draftParsed = eventInputSchema.parse({
    title: "Sự kiện bản nháp thử nghiệm",
    status: "DRAFT",
  });
  assert.equal(
    validateEventPublishRequirements(draftParsed, "DRAFT").length,
    0,
  );

  const pubIssues = validateEventPublishRequirements(draftParsed, "PUBLISHED");
  const missingPaths = new Set(pubIssues.map((i) => i.path[0]));
  assert.ok(missingPaths.has("cover_image"));
  assert.ok(missingPaths.has("short_description"));
  assert.ok(missingPaths.has("category"));
  assert.ok(missingPaths.has("start_time"));
  assert.ok(missingPaths.has("end_time"));
  assert.ok(missingPaths.has("location_name"));
  assert.ok(missingPaths.has("address"));
  assert.ok(missingPaths.has("district"));

  const invalidRange = eventInputSchema.parse({
    title: "Sự kiện sai giờ",
    start_time: "2026-12-20T10:00:00",
    end_time: "2026-12-20T09:00:00",
  });
  const rangeIssues = validateEventPublishRequirements(invalidRange, "DRAFT");
  assert.equal(rangeIssues[0]?.path[0], "end_time");
});

test("Integration SQL Server thật: Public Events, Admin CRUD, Đổi trạng thái và Duyệt đề xuất sự kiện", async () => {
  await connectDB();
  let createdEventId: number | undefined;
  let tempSubmissionId: number | undefined;
  let approvedDraftEventId: number | undefined;

  try {
    await ensureEventsSchemaAndSeed();

    // 1. Public list ẩn DRAFT và CANCELLED
    const publicEvents = await listPublicEvents();
    assert.ok(publicEvents.length >= 6);
    assert.ok(
      publicEvents.every(
        (e) => e.status !== "DRAFT" && e.status !== "CANCELLED",
      ),
    );

    // 2. Chi tiết sự kiện đã hủy vẫn đọc được qua slug, nhưng bản nháp bị chặn 403
    const cancelledEvent = await getPublicEventByIdOrSlug(
      "workshop-nhiep-anh-san-may-dinh-ban-co-da-huy",
    );
    assert.ok(cancelledEvent);
    assert.equal(cancelledEvent.status, "CANCELLED");

    await assert.rejects(
      () => getPublicEventByIdOrSlug("ban-nhap-le-hoi-dua-thuyen-song-han"),
      (err) => err instanceof EventError && err.status === 403,
    );

    // 3. Admin tạo bản nháp -> cập nhật đủ thông tin -> đăng PUBLISHED -> đổi lịch RESCHEDULED -> HỦY CANCELLED
    const draft = await createAdminEvent(
      eventInputSchema.parse({
        title: "KIỂM THỬ TẠM: Đêm Nhạc Hội Cầu Rồng",
        status: "DRAFT",
      }),
    );
    createdEventId = draft.event_id;
    assert.equal(draft.status, "DRAFT");

    const updated = await updateAdminEvent(
      createdEventId,
      eventInputSchema.parse({
        title: "KIỂM THỬ TẠM: Đêm Nhạc Hội Cầu Rồng",
        cover_image: "https://example.com/dragon-bridge.jpg",
        short_description: "Đêm nhạc thử nghiệm bên bờ sông Hàn",
        description: "Chi tiết chương trình đêm nhạc",
        category: "MUSIC",
        start_time: "2026-12-24T19:00:00",
        end_time: "2026-12-24T22:00:00",
        is_all_day: false,
        location_name: "Công viên Cầu Rồng",
        address: "Đường Trần Hưng Đạo",
        district: "Sơn Trà",
        ticket_type: "FREE_OPEN",
        is_featured: false,
      }),
    );
    assert.equal(updated.district, "Sơn Trà");

    const published = await changeAdminEventStatus(
      createdEventId,
      statusPatchSchema.parse({ status: "PUBLISHED" }),
    );
    assert.equal(published.status, "PUBLISHED");

    const rescheduled = await changeAdminEventStatus(
      createdEventId,
      statusPatchSchema.parse({
        status: "RESCHEDULED",
        start_time: "2026-12-25T19:00:00",
        end_time: "2026-12-25T22:00:00",
        reschedule_notice: "Dời sang tối hôm sau do thời tiết.",
      }),
    );
    assert.equal(rescheduled.status, "RESCHEDULED");
    assert.equal(
      rescheduled.reschedule_notice,
      "Dời sang tối hôm sau do thời tiết.",
    );

    const cancelled = await changeAdminEventStatus(
      createdEventId,
      statusPatchSchema.parse({
        status: "CANCELLED",
        reschedule_notice: "Hủy sự kiện kiểm thử.",
      }),
    );
    assert.equal(cancelled.status, "CANCELLED");

    // Sự kiện đã hủy không thể đổi lịch lại
    await assert.rejects(
      () =>
        changeAdminEventStatus(
          createdEventId!,
          statusPatchSchema.parse({
            status: "POSTPONED",
            reschedule_notice: "Thử hoãn sau khi đã hủy",
          }),
        ),
      (err) => err instanceof EventError && err.status === 400,
    );

    const adminPage = await listAdminEvents({ status: "ALL", page: 1, limit: 20 });
    assert.ok(adminPage.items.some((e) => e.event_id === createdEventId));

    // 4. Duyệt đề xuất sự kiện (Event Submissions)
    const pool = getPool();
    const subInsert = await pool.request().query<{ submission_id: number }>(`
      INSERT INTO dbo.event_submissions (
        title, organizer_name, category, short_description, location_name, address, district, status
      )
      OUTPUT INSERTED.submission_id
      VALUES (
        N'KIỂM THỬ TẠM: Đề xuất Triển lãm Ảnh Đà Nẵng',
        N'CLB Nhiếp Ảnh Đà Nẵng',
        'EXHIBITION',
        N'Triển lãm ảnh nghệ thuật',
        N'Công viên APEC',
        N'Đường 2 Tháng 9',
        N'Hải Châu',
        'PENDING'
      )
    `);
    tempSubmissionId = subInsert.recordset[0]!.submission_id;

    const pendingList = await listEventSubmissions({
      status: "PENDING",
      page: 1,
      limit: 50,
    });
    assert.ok(
      pendingList.items.some((s) => s.submission_id === tempSubmissionId),
    );

    const subDetail = await getEventSubmissionById(tempSubmissionId);
    assert.equal(subDetail.status, "PENDING");

    const reviewed = await reviewEventSubmission(tempSubmissionId, "APPROVED");
    assert.equal(reviewed.submission.status, "APPROVED");
    approvedDraftEventId = reviewed.createdEventId;
    assert.ok(approvedDraftEventId);

    // 5. Thông báo sự kiện sắp diễn ra (upcoming-alerts) & Đặt nhắc lịch (subscribeEventReminder)
    const alerts = await listUpcomingEventAlerts(168);
    assert.ok(alerts.length >= 1);
    assert.ok(alerts.every((a) => typeof a.startsInHours === "number"));

    const targetSlug = publicEvents[0]!.slug;
    const rem1 = await subscribeEventReminder(targetSlug, {
      recipient_email: "remind-test@example.com",
      recipient_name: "Du Khách Test",
    });
    assert.equal(rem1.alreadySubscribed, false);
    const rem2 = await subscribeEventReminder(targetSlug, {
      recipient_email: "remind-test@example.com",
    });
    assert.equal(rem2.alreadySubscribed, true);
    await pool
      .request()
      .input("rid", sql.Int, rem1.reminderId)
      .query("DELETE FROM dbo.event_reminders WHERE reminder_id = @rid");
  } finally {
    const pool = getPool();
    if (tempSubmissionId) {
      await pool
        .request()
        .input("subId", sql.Int, tempSubmissionId)
        .query("DELETE FROM dbo.event_submissions WHERE submission_id = @subId");
    }
    for (const evId of [approvedDraftEventId, createdEventId]) {
      if (evId) {
        await pool
          .request()
          .input("evId", sql.Int, evId)
          .query("DELETE FROM dbo.events WHERE event_id = @evId");
      }
    }
    await closeDB();
  }
});
