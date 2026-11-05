import type { ChatPlaceCard } from "@/types/chat";
import styles from "./ChatPage.module.css";
import { freshStayFacts } from "@/lib/chat-stay-facts";

function Source({ url, date }: { url: string; date: string }) {
  if (!url.startsWith("https://")) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      Nguồn · đối chiếu {date.split("-").reverse().join("/")}
    </a>
  );
}
export default function StayFacts({ place }: { place: ChatPlaceCard }) {
  const facts = freshStayFacts(place.stayFacts);
  if (!facts) return null;
  return (
    <details className={styles.stayFacts}>
      <summary>
        Thông tin lưu trú & nguồn
        {facts.publicRates.length ? " · Có giá niêm yết" : ""}
      </summary>
      {facts.hours && (
        <p>
          Nhận phòng từ <b>{facts.hours.checkIn}</b> · Trả phòng trước{" "}
          <b>{facts.hours.checkOut}</b> (giờ Đà Nẵng).{" "}
          <Source url={facts.hours.sourceUrl} date={facts.hours.checkedOn} />
        </p>
      )}
      {facts.rooms.map((room) => (
        <p key={room.name}>
          <b>{room.name}:</b> {room.occupancyText}{" "}
          <Source url={room.sourceUrl} date={room.checkedOn} />
        </p>
      ))}
      {facts.publicRates.map((rate) => (
        <div className={styles.referenceRate} key={rate.roomName}>
          <b>Giá niêm yết tham khảo · {rate.roomName}</b>
          <p>
            {rate.nightlyVnd.toLocaleString("vi-VN")}đ/phòng/đêm · Gồm{" "}
            {rate.includedGuests} khách trong giá
          </p>
          <p>
            Hiệu lực {rate.validFrom.split("-").reverse().join("/")}–
            {rate.validTo.split("-").reverse().join("/")}. {rate.conditions}
          </p>
          <Source url={rate.sourceUrl} date={rate.checkedOn} />
        </div>
      ))}
      {facts.notices.map((note) => (
        <p key={note}>{note}</p>
      ))}
      <p>Thông tin tham khảo; chưa xác nhận đặt phòng hoặc phòng trống.</p>
    </details>
  );
}
