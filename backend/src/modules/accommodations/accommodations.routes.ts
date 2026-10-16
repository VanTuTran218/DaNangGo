import { Router } from 'express';
import { manageAuth, parseId, resolveActor } from './accommodations.access';
import {
  addRoom, createAccommodation, createSchema, getAccommodationFull, hideAccommodation, hideRoom,
  listMine, roomSchema, updateAccommodation, updateRoom, updateSchema,
} from './accommodations.service';

const router = Router();

// GET /api/accommodations/mine - lưu trú của tôi (Admin thấy tất cả)
router.get('/mine', ...manageAuth, async (_req, res) => {
  const actor = await resolveActor(res);
  res.json({ success: true, data: await listMine(actor) });
});

// POST /api/accommodations
router.post('/', ...manageAuth, async (req, res) => {
  const actor = await resolveActor(res);
  const input = createSchema.parse(req.body);
  const placeId = await createAccommodation(actor, input);
  res.status(201).json({ success: true, data: { placeId } });
});

// PUT /api/accommodations/:id
router.put('/:id', ...manageAuth, async (req, res) => {
  const actor = await resolveActor(res);
  const placeId = parseId(req.params.id);
  await updateAccommodation(actor, placeId, updateSchema.parse(req.body));
  res.json({ success: true, message: 'Đã cập nhật lưu trú.', data: await getAccommodationFull(placeId) });
});

// DELETE /api/accommodations/:id  (ẩn, không xóa)
router.delete('/:id', ...manageAuth, async (req, res) => {
  const actor = await resolveActor(res);
  await hideAccommodation(actor, parseId(req.params.id));
  res.json({ success: true, message: 'Đã ẩn lưu trú.' });
});

// Loại phòng
router.post('/:id/rooms', ...manageAuth, async (req, res) => {
  const actor = await resolveActor(res);
  const roomId = await addRoom(actor, parseId(req.params.id), roomSchema.parse(req.body));
  res.status(201).json({ success: true, data: { roomId } });
});

router.put('/:id/rooms/:roomId', ...manageAuth, async (req, res) => {
  const actor = await resolveActor(res);
  await updateRoom(actor, parseId(req.params.id), parseId(req.params.roomId, 'ID loại phòng'), roomSchema.parse(req.body));
  res.json({ success: true, message: 'Đã cập nhật loại phòng.' });
});

router.delete('/:id/rooms/:roomId', ...manageAuth, async (req, res) => {
  const actor = await resolveActor(res);
  await hideRoom(actor, parseId(req.params.id), parseId(req.params.roomId, 'ID loại phòng'));
  res.json({ success: true, message: 'Đã ẩn loại phòng.' });
});

export default router;
