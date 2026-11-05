import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Heart,
  MapPin,
  Sparkles,
  Wallet,
} from "lucide-react";
import styles from "./ChatPage.module.css";

/** Decorative destination card. No itinerary, prices or bookings are invented. */
export default function TripInvitation({
  onStart,
  disabled = false,
}: {
  onStart?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.invitation}>
      <div className={styles.destinationPostcard}>
        <div className={styles.postcardTop}>
          <span>
            <MapPin size={11} />
            ĐÀ NẴNG
          </span>
          <span className={styles.postcardStamp}>
            <Sparkles size={11} />
            Đi cùng Gô
          </span>
        </div>
        <div className={styles.destinationArt} aria-hidden="true">
          <svg viewBox="0 0 260 160" fill="none">
            <circle cx="203" cy="41" r="24" className={styles.artSunHalo} />
            <circle cx="203" cy="41" r="16" className={styles.artSun} />
            <path
              d="M0 99L31 68L59 88L91 49L133 91L165 67L201 101L232 73L260 94V160H0Z"
              className={styles.artMountainBack}
            />
            <path
              d="M0 114L35 94L72 112L107 87L154 116L192 94L229 110L260 100V160H0Z"
              className={styles.artMountainFront}
            />
            <path
              d="M0 122Q54 107 112 124T260 116V160H0Z"
              className={styles.artRiver}
            />
            <path
              d="M-10 138Q33 128 74 137T159 137T270 136M-10 153Q33 143 74 152T159 152T270 151"
              className={styles.artRipples}
              strokeWidth="1.3"
            />
            <path
              d="M18 115H242"
              className={styles.artBridge}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M32 114V126M88 114V126M148 114V127M211 114V126"
              className={styles.artBridgeSupports}
              strokeWidth="3"
            />
            <path
              d="M35 112C49 76 67 73 86 110C104 62 128 57 149 110C169 76 185 79 198 111L213 101L225 102L232 96L239 101L232 107L220 107L211 114"
              className={styles.artDragon}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M68 88L72 81M116 74L120 64M172 90L176 83"
              className={styles.artDragonSpikes}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="231" cy="101" r="1.5" className={styles.artEye} />
            <path
              d="M30 37Q37 31 44 37M44 37Q51 31 58 37M81 24Q86 20 91 24M91 24Q96 20 101 24"
              className={styles.artBirds}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className={styles.postcardCaption}>
          <span>BIỂN XANH. MÓN NGON. CHUYỆN MỚI.</span>
          <h3>
            Thành phố đáng đến.
            <br />
            <em>Chuyến đi của riêng bạn.</em>
          </h3>
        </div>
        <div className={styles.postcardTear}>
          <span />
          <i />
          <span />
        </div>
        <div className={styles.postcardBottom}>
          <span>
            HÀNH TRÌNH CỦA BẠN<strong>Đang chờ một ý tưởng…</strong>
          </span>
          <span className={styles.ticketMark} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
      <div className={styles.invitationIntro}>
        <span className={styles.invitationSpark}>
          <Sparkles size={14} />
        </span>
        <p>
          <b>Bạn kể một chút.</b>
          <br />
          Gô ghép thành một chuyến đi.
        </p>
      </div>
      <div
        className={styles.briefIngredients}
        aria-label="Thông tin giúp Gô tư vấn"
      >
        <span>
          <Wallet size={12} />
          Ngân sách
        </span>
        <span>
          <Heart size={12} />
          Sở thích
        </span>
        <span>
          <CalendarDays size={12} />
          Số ngày
        </span>
      </div>
      <div className={styles.invitationSteps}>
        <div>
          <span>01</span>
          <p>
            <b>Kể Gô nghe bạn muốn gì</b>
            <small>Đi mấy ngày, cùng ai, thích điều gì.</small>
          </p>
        </div>
        <div>
          <span>02</span>
          <p>
            <b>Nhận lịch trình gợi ý</b>
            <small>Điểm đến, ăn uống và chỗ nghỉ.</small>
          </p>
        </div>
        <div>
          <span>
            <Check size={12} />
          </span>
          <p>
            <b>Chỉnh đến khi vừa ý</b>
            <small>Nhắn tiếp để cùng Gô điều chỉnh.</small>
          </p>
        </div>
      </div>
      {onStart && (
        <button
          className={styles.invitationCta}
          type="button"
          onClick={onStart}
          disabled={disabled}
        >
          <span>Phác thảo chuyến đi của tôi</span>
          <ArrowUpRight size={16} />
        </button>
      )}
      <p className={styles.invitationNote}>
        Chưa cần chốt mọi thứ. Mình bắt đầu từ một ý tưởng nhé.
      </p>
    </div>
  );
}
