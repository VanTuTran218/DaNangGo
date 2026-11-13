import { normalize } from '../ai/ai.rules';
import { listFavorites } from '../favorites/favorites.service';
import type { FavoritePlaceType } from '../favorites/favorites.repository';
import type { ChatPlaceCard, SendMessageInput } from './chat.types';

export interface FavoritesCursor { type: FavoritePlaceType | 'ALL'; page: number }
const pageSize = 6;
const labels = { ALL: 'địa điểm', RESTAURANT: 'quán ăn', ACCOMMODATION: 'lưu trú', ATTRACTION: 'điểm tham quan' };
type FavoritesReply = {
  content: string;
  places?: ChatPlaceCard[];
  quickReplies: string[];
  actionLink?: { text: string; url: string };
  cursor?: FavoritesCursor;
};

/** Only explicit saved-place requests, never a general taste or preference. */
export function favoritesRequest(message: string, previous?: FavoritesCursor): FavoritesCursor | null {
  const n = normalize(message);
  const favorite = /\b(?:yeu thich|favorites?)\b/.test(n)
    && /\b(?:xem|liet ke|danh sach|da luu|cua toi|cua minh|toi da|minh da|nhung|cac|bao nhieu|hay luu|luu vao|xoa|bo luu|them)\b/.test(n);
  const savedPlaces = /\b(?:dia diem|noi|quan(?: an)?|khach san|diem tham quan)\b.*\b(?:da luu|da bam tim)\b|\b(?:(?:toi|minh) )?da (?:luu|bam tim)\b.*\b(?:dia diem|noi|quan|khach san|nhung gi)\b/.test(n);
  const followUp = !!previous && /^(?:cho (?:toi|minh) )?(?:xem )?(?:tiep|them|trang (?:tiep|sau|truoc|\d+)|quay lai trang truoc|chi (?:quan an|luu tru|khach san|diem tham quan)|tat ca)[.!?\s]*$/.test(n);
  if (!favorite && !savedPlaces && !followUp) return null;
  let type: FavoritesCursor['type'] = previous && (followUp || /\b(?:trang|tiep|xem them)\b/.test(n)) ? previous.type : 'ALL';
  if (/\b(?:tham quan|diem du lich|check in)\b/.test(n)) type = 'ATTRACTION';
  else if (/\b(?:luu tru|khach san|homestay|resort)\b/.test(n)) type = 'ACCOMMODATION';
  else if (/\b(?:quan(?: an)?|am thuc|nha hang)\b/.test(n)) type = 'RESTAURANT';
  if (/\b(?:tat ca|toan bo)\b/.test(n)) type = 'ALL';
  const explicitPage = n.match(/\btrang\s+([+-]?\d+(?:[.,]\d+)?)/);
  const sameType = previous?.type === type;
  const page = explicitPage ? Number(explicitPage[1]!.replace(',', '.'))
    : sameType && /\b(?:tiep|trang sau|xem them)\b/.test(n) ? previous!.page + 1
    : sameType && /\btrang truoc\b/.test(n) ? Math.max(1, previous!.page - 1) : 1;
  return { type, page };
}

/** Reads only the authenticated owner; never accepts an owner parsed from a prompt. */
export async function favoritesReply(
  message: string,
  owner: Pick<SendMessageInput, 'userId' | 'userRole'>,
  previous?: FavoritesCursor,
  read = listFavorites,
): Promise<FavoritesReply | null> {
  const cursor = favoritesRequest(message, previous);
  if (!cursor) return null;
  if (!owner.userId) return {
    content: 'Bạn đang dùng phiên khách. Bạn đăng nhập để Gô xem các địa điểm đã bấm tim của tài khoản nhé. Danh sách này khác với khẩu vị và sở thích tư vấn.',
    quickReplies: [], actionLink: { text: 'Đăng nhập để xem yêu thích', url: '/dang-nhap?redirect=%2Fchat' },
  };
  if (owner.userRole !== 'USER' && owner.userRole !== 'PARTNER') return {
    content: 'Danh sách địa điểm yêu thích dành cho tài khoản người dùng và đối tác. Gô không đọc danh sách của tài khoản khác.', quickReplies: [],
  };
  const n = normalize(message);
  if (/\bcua (?!toi\b|minh\b|tai khoan (?:(?:cua )?(?:toi|minh)|nay|hien tai|dang dang nhap)\b)/.test(n)) return {
    content: 'Gô chỉ xem danh sách yêu thích của tài khoản bạn đang đăng nhập, không đọc danh sách của người khác. Bạn có thể hỏi “Xem địa điểm yêu thích của tôi”.', quickReplies: [],
  };
  if (/\b(?:xoa|bo luu|bo yeu thich|hay luu|luu vao)\b|^(?:hay |go )?them\b/.test(n)) return {
    content: 'Bạn dùng nút tim trên thẻ địa điểm để thêm hoặc bỏ yêu thích nhé. Gô chưa thay đổi danh sách bằng câu lệnh chat.', quickReplies: [],
  };
  if (!Number.isSafeInteger(cursor.page) || cursor.page < 1 || cursor.page > 1_000_000) return {
    content: 'Số trang yêu thích không hợp lệ. Bạn chọn trang từ 1 đến 1.000.000 nhé.', quickReplies: ['Xem danh sách địa điểm yêu thích của tôi'],
  };
  const label = labels[cursor.type];
  try {
    const result = await read({ userId: owner.userId, ...(cursor.type === 'ALL' ? {} : { type: cursor.type }), page: cursor.page, limit: pageSize });
    const totalPages = Math.ceil(result.total / pageSize);
    const pagePrompt = (page: number) => `Xem trang ${page} danh sách ${label} yêu thích của tôi`;
    const notice = 'Chỉ hiển thị nơi đang công khai; địa điểm bị ẩn hoặc ngừng hoạt động không xuất hiện. Đây là danh sách đã lưu, chưa xác nhận giờ mở cửa, giá hay tình trạng đặt dịch vụ.';
    if (!result.total) return {
      content: `Chưa có ${label} đang công khai trong danh sách yêu thích của tài khoản này. Bạn có thể bấm tim trên thẻ địa điểm để lưu.\n\n${notice}`,
      quickReplies: cursor.type === 'ALL' ? [] : ['Xem tất cả địa điểm yêu thích của tôi'], cursor: { ...cursor, page: 1 },
    };
    if (cursor.page > totalPages) return {
      content: `Danh sách ${label} yêu thích hiện có ${totalPages} trang (${result.total} nơi). Trang ${cursor.page} không còn dữ liệu; danh sách có thể đã thay đổi.`,
      quickReplies: [pagePrompt(totalPages)], cursor: { ...cursor, page: totalPages },
    };
    if (!result.data.length) return {
      content: 'Danh sách yêu thích vừa thay đổi trong lúc tải. Bạn thử lại để Gô đọc dữ liệu mới nhất nhé.',
      quickReplies: [pagePrompt(cursor.page)], cursor,
    };
    const places: ChatPlaceCard[] = result.data.map(place => ({
      placeId: place.place_id, name: place.name, placeType: place.place_type,
      address: place.address, rating: Number(place.avg_rating), reviewCount: place.review_count,
      imageUrl: place.cover_image, detailUrl: `/places/${place.place_id}`,
      reason: 'Đã lưu trong danh sách yêu thích của bạn',
    }));
    return {
      content: `Gô tìm thấy ${result.total} ${label} đang công khai trong danh sách yêu thích của bạn. Trang ${cursor.page}/${totalPages}, hiển thị ${places.length} nơi, theo thứ tự lưu mới nhất.\n\n${notice}`
        + (/\b(?:lich trinh|len lich|lap lich)\b/.test(n) ? '\n\nGô đang hiển thị danh sách, chưa tạo lịch trình từ các địa điểm yêu thích trong yêu cầu này.' : ''),
      places, cursor,
      quickReplies: [
        ...(cursor.page > 1 ? [pagePrompt(cursor.page - 1)] : []),
        ...(cursor.page < totalPages ? [pagePrompt(cursor.page + 1)] : []),
        ...(cursor.type === 'ALL' ? ['Xem quán ăn yêu thích của tôi', 'Xem lưu trú yêu thích của tôi', 'Xem điểm tham quan yêu thích của tôi'] : ['Xem tất cả địa điểm yêu thích của tôi']),
      ],
    };
  } catch {
    return {
      content: 'Gô chưa tải được danh sách yêu thích lúc này. Đây là lỗi truy cập dữ liệu, không có nghĩa danh sách của bạn trống. Bạn thử lại nhé.',
      quickReplies: [`Xem trang ${cursor.page} danh sách ${label} yêu thích của tôi`], cursor,
    };
  }
}
