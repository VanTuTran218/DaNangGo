# Quy ước chung của dự án (Conventions)

## 1. Sơ đồ luồng dữ liệu
Luồng đi của dữ liệu xuyên suốt từ Frontend xuống Database tuân thủ đường dẫn sau:
**Trang (FE) → Component (FE) → Hook (FE) → lib/api (FE) → API Backend (BE) → Service (BE) → Repository (BE) → Database**

## 2. Muốn làm X thì đặt file ở đâu?
| Bạn muốn... | Đặt file tại đâu? |
| :--- | :--- |
| Thêm trang FE mới | `app/(main)/<tên-trang>/page.tsx` |
| Thêm component FE dùng chung | `components/ui/` hoặc `components/layout/` |
| Thêm component FE cho 1 tính năng | `components/<tên-domain>/` (VD: `components/places/`) |
| Thêm hàm gọi API mới ở FE | `lib/api/<tên-domain>.ts` |
| Thêm kiểu dữ liệu TypeScript (FE) | `types/<tên-domain>.ts` |
| Thêm API endpoint mới (BE) | `backend/src/modules/<tên-module>/<tên>.routes.js` (hoặc `.ts`) |
| Viết truy vấn SQL mới (BE) | `backend/src/modules/<tên-module>/<tên>.repository.js` |
| Cập nhật, thay đổi cấu trúc DB | `database/migrations/<số-thứ-tự>_<mô-tả>.sql` |

## 3. Quy ước đặt tên (Naming Conventions)
- **Frontend**:
  - Component: `PascalCase` (VD: `HotelCard.tsx`).
  - Hook: Bắt đầu bằng `use`, dùng camelCase (VD: `usePlaces.ts`).
  - Utils/Lib/Types: `camelCase` hoặc giữ nguyên theo cấu trúc hiện có (VD: `user.ts`, `place.mapper.ts`).
- **Backend**: 
  - Tên file dùng `kebab-case` hoặc cấu trúc `module.layer.js` (VD: `user.controller.js`, `place.service.js`).
  - URL API: Bắt đầu bằng `/api/` và dùng danh từ số nhiều (VD: `/api/places`, `/api/users`).
- **Database**:
  - Bảng và cột: Dùng chữ thường `snake_case` (VD: `user_preferences`, `created_at`).

## 4. Gợi ý làm việc nhóm (Git Workflow)
- Khuyến khích tạo nhánh mới khi làm tính năng: `feature/<tên-module>-<mô-tả>` (VD: `feature/places-add-filter`).
- Mỗi người làm việc gọn trong thư mục module mình được phân công để hạn chế merge conflict.
- Khi làm xong, tạo Pull Request để review code.

## 5. Cảnh báo bảo mật quan trọng
- **TUYỆT ĐỐI KHÔNG** commit các file chứa thông tin nhạy cảm (như `.env`, API keys, DB password) lên Github.
- Mọi file `.env` hoặc file chứa chứng chỉ cấu hình local phải được thêm vào `.gitignore` trước khi commit.
