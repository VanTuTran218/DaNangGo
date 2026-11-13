import { normalize } from '../ai/ai.rules';
import { tripBrief, tripContext, unsupportedTripDays } from './chat.intent';
import { buildTravelPlan, placeCard } from './chat.advisor';
import { attachPlanCosts, isPlanEdit } from './chat.plan-edit';
import { excludedNames, isExcluded } from './chat.exclusions';
import { dietaryConcern, isRestart } from './chat.knowledge';
import { searchPlacesForChat } from './chat.repository';
import type { ChatTravelPlan, SendMessageInput } from './chat.types';

export interface FavoritePlanState { context: string; pending: boolean; dietaryRestricted?: boolean; excludedNames?: string[] }
interface FavoritePlanReply {
  content: string;
  travelPlan?: ChatTravelPlan;
  questions?: string[];
  state?: FavoritePlanState;
}
export function isFavoritePlanRequest(message: string, fromFavoriteList = false) {
  const n = normalize(message);
  return /\b(?:(?:lap|len|tao|xep)(?: lai)? lich|lich trinh|len ke hoach)\b/.test(n)
    && (/\b(?:yeu thich|bam tim|da luu)\b/.test(n) || fromFavoriteList && /\b(?:nhung noi nay|cac noi nay|danh sach nay|cac dia diem nay)\b/.test(n));
}

/** A constrained planner: candidates come exclusively from current, owned favorites. */
export async function favoritePlanReply(
  message: string,
  owner: Pick<SendMessageInput, 'userId' | 'userRole'>,
  previous?: FavoritePlanState,
  fromFavoriteList = false,
  search = searchPlacesForChat,
  safety: { dietaryRestricted?: boolean; notice?: string } = {},
): Promise<FavoritePlanReply | null> {
  const n = normalize(message);
  const explicit = isFavoritePlanRequest(message, fromFavoriteList);
  const continuing = previous && !isRestart(message) && (
    previous.pending && (/\d/.test(n) || /\b(?:ngay|nguoi|khach|tong|ngan sach|trieu|dem|mai|qua dem|khong|co|sang|chieu|toi)\b/.test(n))
    || !previous.pending && /\b(?:ngan sach|gio den|gio ve|taxi|o to|xe may|di bo|xe buyt|nhip nhe|tre em|nguoi lon tuoi)\b/.test(n)
  );
  const targetedEdit = previous && !previous.pending && isPlanEdit(message);
  if (!explicit && !continuing && !targetedEdit) return null;
  if (!owner.userId) return {content:'Bạn đăng nhập để Gô lập lịch từ các địa điểm đã bấm tim của tài khoản nhé. Gô chưa đọc danh sách hay tạo lịch từ yêu thích trong phiên khách.'};
  if (owner.userRole !== 'USER' && owner.userRole !== 'PARTNER') return {content:'Lập lịch từ yêu thích dành cho tài khoản người dùng và đối tác; Gô không đọc danh sách của tài khoản khác.'};
  if (/\bcua (?!toi\b|minh\b|tai khoan (?:(?:cua )?(?:toi|minh)|nay|hien tai|dang dang nhap)\b)/.test(n)) return {content:'Gô chỉ lập lịch từ danh sách yêu thích của tài khoản bạn đang đăng nhập, không dùng danh sách của người khác.'};
  if (targetedEdit && !explicit && !continuing) return {
    content:'Đây là lịch từ yêu thích. Để giữ đúng nguồn địa điểm, bạn yêu cầu lập lại lịch từ yêu thích kèm điều kiện mới nhé; Gô chưa thay điểm bằng kết quả ngoài danh sách.', state:previous,
  };
  // A fresh explicit request starts a new brief; answers to pending questions retain validated facts.
  const reuse = previous && (!explicit || /\b(?:giu|doi|thay|dieu chinh|(?:lap|len|tao|xep) lai)\b/.test(n));
  const brief = tripBrief(reuse ? `Giữ yêu cầu. ${message}` : message, reuse ? [previous.context] : []);
  const state: FavoritePlanState = {
    context:tripContext(brief),pending:true,
    dietaryRestricted:Boolean(safety.dietaryRestricted || dietaryConcern(brief.text) || reuse && previous?.dietaryRestricted),
    excludedNames:excludedNames([brief.text],reuse ? previous?.excludedNames : []),
  };
  if (unsupportedTripDays(message) || (brief.request.days !== null && (brief.request.days < 1 || brief.request.days > 3))) return {
    content:'Gô hỗ trợ lập lịch từ yêu thích trong 1–3 ngày. Bạn chọn lại số ngày nhé; chưa tạo lịch mới.',state,
  };
  if (brief.issues.length) return {content:brief.issues.join('\n\n')+'\n\nGô chưa tạo lịch để tránh hiểu sai điều kiện chuyến đi.',state};
  const questions = [...new Set([
    ...(!brief.request.days ? ['Bạn muốn đi mấy ngày (1–3 ngày)?'] : []),
    ...(!brief.request.guests ? ['Nhóm có bao nhiêu khách?'] : []),
    ...(!brief.request.budget ? ['Tổng ngân sách cả nhóm là bao nhiêu?'] : []),
    ...brief.questions,
    ...(!brief.request.start_date ? ['Bạn khởi hành ngày nào?'] : []),
  ])].slice(0,3);
  if (questions.length) return {
    content:'Gô sẽ dùng các địa điểm đang công khai trong danh sách yêu thích của bạn. Trước khi xếp lịch, bạn xác nhận giúp Gô:\n'+questions.map(q=>'• '+q).join('\n'), questions,state,
  };
  try {
    // 501 detects overflow without silently treating a truncated catalog as the entire list.
    const rows = await search({favoriteUserId:owner.userId,limit:501,strictKeywords:true,partySize:brief.request.guests});
    if (rows.length > 500) return {content:'Danh sách có hơn 500 địa điểm đủ điều kiện. Gô chưa lập lịch để tránh bỏ sót; bạn thu gọn danh sách yêu thích rồi thử lại nhé.',state};
    if (!rows.length) return {content:'Chưa có địa điểm yêu thích đang công khai và đủ điều kiện dữ liệu để xếp lịch. Bạn bấm tim một số nơi rồi yêu cầu lại nhé. Nơi bị ẩn/ngừng hoạt động không được dùng; Gô không tự lấy nơi ngoài danh sách thay thế.',state};
    const excluded = state.excludedNames ?? [];
    const eligible = rows.filter(row=>!isExcluded(row.name,excluded));
    const plan = attachPlanCosts(buildTravelPlan(brief.request,brief.text,{
      sights:eligible.filter(p=>p.placeType==='ATTRACTION'),food:eligible.filter(p=>p.placeType==='RESTAURANT'),stays:eligible.filter(p=>p.placeType==='ACCOMMODATION'),
    },{preferences:brief.preferences,freeOnly:brief.freeOnly,dietaryRestricted:state.dietaryRestricted}),eligible);
    const scheduled = new Set(plan.days.flatMap(day=>day.periods.flatMap(period=>period.items.flatMap(item=>item.place?[item.place.placeId]:[]))));
    if (!scheduled.size) return {content:'Các nơi yêu thích hiện chưa phù hợp thời gian, phương tiện hoặc điều kiện bạn đưa ra. Gô chưa tạo lịch trống và chưa tự thêm nơi ngoài danh sách. Bạn điều chỉnh điều kiện hoặc lưu thêm nơi phù hợp rồi yêu cầu lại nhé.',state};
    if (brief.request.budget !== null && plan.costs.knownSubtotal !== null && plan.costs.knownSubtotal > brief.request.budget) return {
      content:'Chỉ các khoản đã có giá của lựa chọn này đã vượt tổng ngân sách. Gô chưa gửi lịch như thể đã phù hợp; bạn tăng ngân sách, chọn vé miễn phí hoặc điều chỉnh danh sách yêu thích rồi lập lại nhé.',state,
    };
    const unused = rows.filter(row=>!scheduled.has(row.placeId));
    plan.source='FAVORITES';
    if (plan.costs.knownSubtotal !== null) {
      plan.costs.projectedSubtotal = plan.costs.knownSubtotal + (plan.costs.foodAllowance ?? 0) + (plan.costs.transportAllowance ?? 0) + (plan.costs.contingencyAllowance ?? 0);
      plan.costs.remaining = brief.request.budget === null ? null : brief.request.budget - plan.costs.projectedSubtotal;
      if (plan.costs.remaining !== null && plan.costs.remaining < 0) plan.notes.unshift('Các khoản dự trù đã vượt ngân sách; bản nháp này cần điều chỉnh trước khi dùng.');
    }
    if (safety.notice) plan.notes.unshift(safety.notice);
    plan.title=`Lịch ${plan.dayCount} ngày từ địa điểm yêu thích`;
    plan.assumptions.unshift('Chỉ dùng địa điểm đang công khai trong danh sách đã bấm tim tại thời điểm lập lịch, không chỉ các nơi trên trang danh sách vừa xem.');
    plan.notes.unshift(`Đã xếp ${scheduled.size}/${rows.length} địa điểm đủ điều kiện dữ liệu vào từng buổi. ${unused.length} nơi chưa xếp; danh sách yêu thích không bị thay đổi.`);
    if(unused.length) plan.groups.push({title:'Yêu thích chưa xếp vào từng buổi',places:unused.slice(0,20).map(row=>placeCard(row,isExcluded(row.name,excluded)?'Bạn đã yêu cầu loại khỏi chuyến này; vẫn giữ trong yêu thích':'Chưa xếp theo giới hạn buổi, khoảng cách, giá hoặc điều kiện chuyến đi; có thể là lựa chọn thay thế'))});
    if(unused.length>20)plan.notes.push(`Chỉ hiển thị 20/${unused.length} nơi chưa xếp; bạn xem danh sách yêu thích để kiểm tra toàn bộ.`);
    plan.notes.push('Các mục chưa đủ giá vẫn để chưa đủ dữ liệu; không coi phần cộng đã biết là tổng chi phí, không xác nhận phòng trống hay đặt dịch vụ.');
    if (!eligible.some(row=>row.placeType==='RESTAURANT')) plan.notes.push('Chưa có quán ăn yêu thích phù hợp; các bữa chưa có địa điểm cụ thể, chưa có giá thực đơn để tính hóa đơn.');
    if ((brief.request.days ?? 1)>1 && !eligible.some(row=>row.placeType==='ACCOMMODATION')) plan.notes.push('Chưa có lưu trú yêu thích phù hợp; cần bổ sung chỗ ở nếu bạn chưa đặt riêng.');
    return {
      content:`Gô đã phác thảo lịch ${plan.dayCount} ngày từ danh sách yêu thích hiện tại của bạn, xếp ${scheduled.size}/${rows.length} nơi vào từng buổi. Những nơi chưa xếp được ghi riêng bên dưới; Gô không tự thêm địa điểm ngoài danh sách. Giá/giờ còn thiếu cần xác nhận trước khi đi.`+(plan.costs.remaining !== null && plan.costs.remaining < 0 ? '\n\nCác khoản dự trù vượt ngân sách; lịch này cần điều chỉnh, chưa phải phương án vừa ngân sách.' : ''),
      travelPlan:plan,questions:plan.questions,state:{...state,pending:false},
    };
  } catch {
    return {content:'Gô chưa đọc được dữ liệu yêu thích để lập lịch lúc này. Đây là lỗi truy cập, không có nghĩa danh sách trống. Bạn thử yêu cầu lập lịch từ yêu thích lại nhé; Gô chưa dùng nơi khác thay thế.',state};
  }
}
