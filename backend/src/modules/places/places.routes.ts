import { Router, Request, Response } from 'express';
import { getAllPlaces, getPlaceById, createPlace } from './places.service';

const router = Router();

// GET /api/places - Lấy tất cả địa điểm
router.get('/', async (req: Request, res: Response) => {
  try {
    const places = await getAllPlaces();
    res.json({ success: true, data: places });
  } catch (error) {
    console.error('Lỗi lấy danh sách địa điểm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/places/:id - Lấy 1 địa điểm theo ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const place = await getPlaceById(id);
    if (!place) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
    }

    res.json({ success: true, data: place });
  } catch (error) {
    console.error('Lỗi lấy địa điểm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/places - Tạo địa điểm mới
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, address, category } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên địa điểm là bắt buộc' });
    }

    const newPlace = await createPlace({ name, description, address, category });
    res.status(201).json({ success: true, data: newPlace });
  } catch (error) {
    console.error('Lỗi tạo địa điểm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

export default router;
