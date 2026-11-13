import { normalize } from '../ai/ai.rules';
import { comparePlaces, comparisonNames, resolvePlaceName } from './chat.compare';
import { placeCard } from './chat.advisor';
import { searchPlacesForChat, type PlaceSearchRow } from './chat.repository';
import { isFavoritePlanRequest } from './chat.favorite-plan';
import type { ChatComparison, ChatPlaceCard, SendMessageInput } from './chat.types';

export interface FavoriteConsultState {
  mode: 'compare' | 'near' | 'alternative';
  pair?: [number,number];
  anchorId?: number;
  type?: PlaceSearchRow['placeType'];
  radius?: 2 | 5 | 10;
  gps?:boolean;
  shownIds?:number[];
}
interface ConsultReply {
  content:string;
  places?:ChatPlaceCard[];
  comparison?:ChatComparison;
  state?:FavoriteConsultState;
  quickReplies?:string[];
}
const hasScope=(n:string)=>/\b(?:yeu thich|da luu|bam tim)\b/.test(n);
export function isFavoriteConsultRequest(message:string,context=false){
  const n=normalize(message);
  if(isFavoritePlanRequest(message))return false;
  if(/\bngan sach\b/.test(n)&&!/\b(?:tim|goi y|so sanh|thay the|thay cho)\b/.test(n))return false;
  return (hasScope(n)||context) && /\b(?:so sanh|re hon|gia thap hon|gan|quanh|lan can|thay the|thay cho|lua chon khac|thay .+ bang)\b/.test(n);
}
const stripScope=(n:string)=>n
  .replace(/\b(?:trong|tu)\s+(?:cac\s+)?(?:danh sach\s+)?(?:dia diem\s+)?(?:yeu thich|da luu)(?:\s+cua\s+(?:toi|minh))?/g,'')
  .replace(/\b(?:yeu thich|da luu)(?:\s+cua\s+(?:toi|minh))?/g,'')
  .replace(/[?!.,]+$/g,'').trim();
const coordinates=(point:{latitude?:number|null;longitude?:number|null})=>
  typeof point.latitude==='number'&&Number.isFinite(point.latitude)&&Math.abs(point.latitude)<=90&&
  typeof point.longitude==='number'&&Number.isFinite(point.longitude)&&Math.abs(point.longitude)<=180;
export function favoriteDistanceKm(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number}){
  const rad=(n:number)=>n*Math.PI/180;
  const h=Math.sin(rad(b.latitude-a.latitude)/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(rad(b.longitude-a.longitude)/2)**2;
  return 6371*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));
}
const category=(n:string):PlaceSearchRow['placeType']|undefined=>/\b(?:quan an|am thuc|nha hang|quan ca phe)\b/.test(n)?'RESTAURANT':/\b(?:khach san|luu tru|homestay|resort)\b/.test(n)?'ACCOMMODATION':/\b(?:tham quan|diem du lich|check in)\b/.test(n)?'ATTRACTION':undefined;
const asPoint=(p:{latitude?:number|null;longitude?:number|null})=>({latitude:p.latitude!,longitude:p.longitude!});

export async function favoriteConsultReply(
  message:string,
  owner:Pick<SendMessageInput,'userId'|'userRole'|'location'>,
  previous?:FavoriteConsultState,
  inContext=false,
  search=searchPlacesForChat,
  safety:{dietaryRestricted?:boolean;notice?:string}={},
):Promise<ConsultReply|null>{
  const n=normalize(message);
  const shortFollow=!!previous && /^(?:noi nao |cho nao |cai nao )?(?:re hon|gia thap hon|gan hon|con lua chon khac|xem tiep)(?:\s*[?!.,])?$/.test(n);
  if(!isFavoriteConsultRequest(message,inContext||!!previous)&&!shortFollow)return null;
  if(!owner.userId)return{content:'Bạn đăng nhập để Gô so sánh, tìm gần hoặc gợi ý thay thế từ các địa điểm đã yêu thích của tài khoản nhé.'};
  if(owner.userRole!=='USER'&&owner.userRole!=='PARTNER')return{content:'Tư vấn từ yêu thích dành cho tài khoản người dùng và đối tác. Gô không đọc danh sách tài khoản khác.'};
  if(/\bcua (?!toi\b|minh\b|tai khoan (?:(?:cua )?(?:toi|minh)|nay|hien tai|dang dang nhap)\b)/.test(n))return{content:'Gô chỉ tư vấn từ danh sách yêu thích của tài khoản bạn đang đăng nhập, không đọc danh sách người khác.'};
  if(/\bngoai (?:danh sach )?yeu thich\b/.test(n))return{content:'Chế độ này chỉ tư vấn trong danh sách yêu thích. Bạn hỏi tìm địa điểm công khai trong một yêu cầu riêng nếu muốn mở rộng; Gô chưa tự thêm hoặc thay đổi danh sách.'};
  const mode:FavoriteConsultState['mode']=/\bso sanh\b/.test(n)||previous?.mode==='compare'&&shortFollow?'compare':/\b(?:thay the|thay cho|lua chon khac|thay .+ bang)\b/.test(n)||previous?.mode==='alternative'&&shortFollow?'alternative':'near';
  const clean=stripScope(n);
  try{
    const rows=await search({favoriteUserId:owner.userId,limit:501,strictKeywords:true});
    if(rows.length>500)return{content:'Danh sách có hơn 500 nơi đủ điều kiện. Gô chưa tư vấn từ một phần danh sách như thể đã đọc toàn bộ; bạn thu gọn yêu thích rồi thử lại nhé.'};
    if(!rows.length)return{content:'Chưa có địa điểm yêu thích đang công khai và đủ dữ liệu để tư vấn. Nơi bị ẩn hoặc ngừng hoạt động không được dùng; Gô chưa lấy nơi ngoài danh sách thay thế.'};
    if(mode==='compare'){
      let pair:PlaceSearchRow[]=[];
      const names=comparisonNames(clean);
      if(names){
        const matches=names.map(name=>resolvePlaceName(name,rows));
        if(matches.every(match=>match.length===1))pair=matches.map(match=>match[0]!);
      }else if(shortFollow&&previous?.pair)pair=previous.pair.flatMap(id=>rows.filter(row=>row.placeId===id));
      if(pair.length!==2||pair[0]!.placeId===pair[1]!.placeId)return{content:'Bạn nêu rõ hai tên hoặc chi nhánh đang có trong yêu thích nhé. Có thể một nơi đã bỏ lưu, bị ẩn hoặc tên trùng; Gô chưa lấy địa điểm ngoài danh sách để so thay.'};
      const [a,b]=pair as [PlaceSearchRow,PlaceSearchRow];
      let conclusion='Bạn muốn cân nhắc giá, khu vực hay thời lượng?';
      if(/\bgan hon\b/.test(n))conclusion='Bạn cho điểm xuất phát hoặc chia sẻ GPS để so khoảng cách từ cùng một mốc nhé; Gô chưa suy ra khoảng cách từ tên quận.';
      if(/\bgan hon\b/.test(n)&&owner.location&&coordinates(owner.location)&&coordinates(a)&&coordinates(b)){
        const da=favoriteDistanceKm(owner.location,asPoint(a)),db=favoriteDistanceKm(owner.location,asPoint(b));
        conclusion=`Từ GPS bạn chia sẻ: ${a.name} cách ${da.toFixed(2)}km, ${b.name} cách ${db.toFixed(2)}km đường chim bay. ${Math.abs(da-db)<0.01?'Hai nơi gần như tương đương.':`${da<db?a.name:b.name} gần hơn theo tọa độ.`} Đây không phải quãng đường hay thời gian lái xe.`;
      }
      if(/\b(?:re hon|gia thap hon)\b/.test(n)){
        conclusion=a.placeType!==b.placeType?'Hai nơi khác loại/đơn vị giá nên Gô không kết luận nơi nào rẻ hơn.'
          :a.priceMin===null||b.priceMin===null?'Còn thiếu giá nên chưa kết luận nơi nào có mức giá thấp hơn.'
          :a.priceMin===b.priceMin?'Mức giá thấp nhất đang ghi nhận của hai nơi bằng nhau.'
          :`${a.priceMin<b.priceMin?a.name:b.name} có mức giá thấp nhất trong dữ liệu thấp hơn. Đây không phải so cùng món/hạng phòng hoặc tổng hóa đơn, chưa xác nhận giá theo ngày đi.`;
      }
      return{content:`Gô so sánh hai nơi đang có trong yêu thích: ${a.name} và ${b.name}. ${conclusion}${safety.dietaryRestricted?' Thông tin quán ăn không xác nhận phù hợp dị ứng/kiêng ăn của bạn.':''}`,comparison:comparePlaces([a,b]),state:{mode,pair:[a.placeId,b.placeId]},quickReplies:['Nơi nào rẻ hơn?']};
    }
    let anchor:PlaceSearchRow|undefined;
    let origin:{latitude:number;longitude:number}|undefined;
    let originName='vị trí bạn đã cho phép chia sẻ';
    const byGPS=/\b(?:gan toi|quanh toi|vi tri toi|vi tri cua toi|gan day|quanh day)\b/.test(n) || !!(shortFollow&&previous?.gps);
    const marker=mode==='near'?/\b(?:gan|quanh|lan can)\s+(.+)$/:/\b(?:thay the|thay cho|thay)\s+(.+?)(?:\s+bang\b.*|$)/;
    const named=clean.match(marker);
    if(!byGPS&&named){
      const query=named[1]!.replace(/\s+(?:trong )?(?:ban kinh )?\d+(?:[.,]\d+)?\s*km.*$/,'').replace(/\s+(?:re hon|gia thap hon).*$/,'').trim();
      const matches=resolvePlaceName(query,rows);
      if(matches.length===1)anchor=matches[0];
    }else if(!byGPS&&shortFollow&&previous?.anchorId)anchor=rows.find(row=>row.placeId===previous.anchorId);
    if(mode==='alternative'&&!anchor)return{content:'Bạn nêu rõ tên nơi muốn tìm lựa chọn thay thế, đang nằm trong yêu thích nhé. Gô chưa chọn đại một nơi hoặc dùng nơi đã bỏ lưu/bị ẩn.'};
    if(mode==='near'){
      if(byGPS){if(!owner.location||!coordinates(owner.location))return{content:'Bạn bấm “Tìm quanh vị trí tôi” và cho phép chia sẻ vị trí, hoặc nêu tên một địa điểm đã yêu thích làm mốc. Gô chưa đoán vị trí từ địa chỉ/quận.'};origin=asPoint(owner.location);}
      else {if(!anchor)return{content:'Bạn cho tên đầy đủ hoặc chi nhánh của địa điểm đã yêu thích để làm mốc nhé; Gô chưa xác định duy nhất một nơi đang công khai trong danh sách.'};if(!coordinates(anchor))return{content:`${anchor.name} còn thiếu tọa độ hợp lệ nên Gô chưa tính được khoảng cách. Gô không thay tọa độ bằng tâm quận.`};origin=asPoint(anchor);originName=anchor.name;}
    }
    const rawRadius=n.match(/([+-]?\d+(?:[.,]\d+)?)\s*km\b/);
    const radius=rawRadius?Number(rawRadius[1]!.replace(',','.')):previous?.radius??owner.location?.radiusKm??5;
    if(mode==='near'&&![2,5,10].includes(radius))return{content:'Gô hỗ trợ bán kính 2km, 5km hoặc 10km. Bạn chọn một mức nhé.'};
    const prefix=named?clean.slice(0,named.index):clean;
    const type=mode==='alternative'?anchor!.placeType:category(prefix)??(shortFollow?previous?.type:undefined);
    if(safety.dietaryRestricted&&type==='RESTAURANT')return{content:'Gô chưa có dữ liệu thành phần/kiêng ăn đủ để gợi ý quán phù hợp hạn chế ăn uống của bạn. Danh sách có quán đã lưu không đồng nghĩa an toàn với dị ứng. Bạn cần xác nhận trực tiếp với quán.'};
    let candidates=rows.filter(row=>row.placeId!==anchor?.placeId&&(!type||row.placeType===type)&&!(safety.dietaryRestricted&&row.placeType==='RESTAURANT'));
    let missingCoordinates=0;
    if(mode==='near'){
      missingCoordinates=candidates.filter(row=>!coordinates(row)).length;
      candidates=candidates.filter(coordinates).map(row=>({...row,distanceKm:favoriteDistanceKm(origin!,asPoint(row)),distanceOriginName:originName})).filter(row=>row.distanceKm<=radius).sort((a,b)=>a.distanceKm!-b.distanceKm!||a.placeId-b.placeId);
    }else{
      if(/\b(?:re hon|gia thap hon)\b/.test(n)){
        if(anchor!.priceMin===null)return{content:`${anchor!.name} chưa có giá để lọc lựa chọn thay thế giá thấp hơn. Gô chưa dùng mức 0đ thay giá còn thiếu.`};
        candidates=candidates.filter(row=>row.priceMin!==null&&row.priceMin<anchor!.priceMin!);
      }
      candidates.sort((a,b)=>(a.priceMin??Infinity)-(b.priceMin??Infinity)||b.rating-a.rating||a.placeId-b.placeId);
    }
    const seen=shortFollow&&/\b(?:lua chon khac|xem tiep)\b/.test(n)?previous?.shownIds??[]:[];
    candidates=candidates.filter(row=>!seen.includes(row.placeId));
    const state:FavoriteConsultState={mode,...(anchor?{anchorId:anchor.placeId}:{}),...(type?{type}:{}),...(seen.length?{shownIds:seen}:{}),...(mode==='near'?{radius:radius as 2|5|10,...(byGPS?{gps:true}:{})}:{})};
    const notice=safety.notice??(safety.dietaryRestricted?'Gô không gợi ý quán ăn khi chưa xác minh điều kiện kiêng ăn/dị ứng.':'');
    if(!candidates.length)return{content:(mode==='near'?`Không tìm thấy nơi yêu thích đủ tọa độ trong ${radius}km tính từ ${originName}.${missingCoordinates?` Có ${missingCoordinates} nơi thiếu tọa độ nên chưa thể xét khoảng cách.`:''} Gô chưa mở rộng ra ngoài danh sách.`:`Chưa có nơi yêu thích cùng loại đáp ứng điều kiện thay thế ${anchor!.name}. Gô chưa sửa lịch hay thêm nơi ngoài danh sách.`)+(notice?' '+notice:''),state};
    return{
      content:(mode==='near'?`Gô tìm thấy ${candidates.length} nơi yêu thích trong ${radius}km từ ${originName}, hiển thị ${Math.min(6,candidates.length)} nơi gần nhất. Khoảng cách đường chim bay từ tọa độ, không phải tuyến đường hoặc thời gian lái xe.${missingCoordinates?` ${missingCoordinates} nơi thiếu tọa độ chưa được xét.`:''}`
        :`Có ${candidates.length} lựa chọn yêu thích cùng loại để cân nhắc thay ${anchor!.name}; hiển thị ${Math.min(6,candidates.length)} nơi. Giá là mức thấp nhất trong dữ liệu, không bảo đảm cùng món/hạng phòng hoặc giá hiện tại. Đây là gợi ý, chưa sửa lịch trình hoặc danh sách yêu thích.`)+(notice?' '+notice:''),
      places:candidates.slice(0,6).map(row=>placeCard(row,mode==='near'?'Đang yêu thích; khoảng cách đường chim bay':'Đang yêu thích; cùng loại với nơi cần thay')),
      state:{...state,shownIds:[...new Set([...seen,...candidates.slice(0,6).map(row=>row.placeId)])].slice(-500)},
    };
  }catch{return{content:'Gô chưa đọc được dữ liệu yêu thích để tư vấn lúc này. Đây là lỗi truy cập, không phải danh sách rỗng; Gô chưa tìm nơi ngoài danh sách thay thế.',state:previous};}
}
