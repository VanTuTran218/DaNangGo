import { conversationalText } from "./chat.language";
import { explicitPreferences, deleteProfile, writeProfile } from "./chat.profile";
import { preferenceLabels, type Dialogue, type PreferenceKey } from "./chat.contract";

export async function profileCommand(message: string, userId: number | null | undefined, dialogue: Dialogue, saved: PreferenceKey[], loaded = true) {
  const n = conversationalText(message);
  const keys = explicitPreferences(message);
  const refusing = /\b(?:dung|khong) (?:luu|ghi nho)\b/.test(n);
  if (refusing) { dialogue.profilePending = []; return { content: "Gô không lưu lâu dài ưu tiên này. Thông tin bạn vừa nói chỉ được dùng trong cuộc trò chuyện hiện tại." }; }
  const listing = /\b(?:xem|liet ke|co nho|da luu|dang nho|nho gi)\b.*\b(?:so thich|thich|uu tien|toi)\b/.test(n) && !/\b(?:luu lai|hay luu)\b/.test(n);
  const deleting = /\b(?:xoa|quen|bo luu)\b.*\b(?:so thich|uu tien|ghi nho)\b/.test(n);
  const saving = /\b(?:hay luu|hay ghi nho|luu (?:toi|so thich|uu tien)|ghi nho (?:toi|uu tien|so thich))\b/.test(n);
  const confirming = /^\s*(?:dong y|co)(?:,?\s*(?:hay )?(?:luu|ghi nho)(?: (?:uu tien|so thich)(?: nay)?)?(?: cho lan sau)?)?[.!\s]*$/.test(n) && dialogue.profilePending.length > 0;
  if (!listing && !deleting && !saving && !confirming) return null;
  if (!userId) return { content: "Bạn đang dùng phiên khách. Gô chỉ dùng sở thích tạm thời trong phiên này; bạn đăng nhập để xem, lưu hoặc xóa sở thích lâu dài của tài khoản." };
  if (!loaded) return { content: "Gô chưa truy cập được sở thích đã lưu của tài khoản. Bạn thử lại sau nhé; Gô chưa xác nhận hoặc thay đổi dữ liệu ghi nhớ." };
  if (listing) return { content: saved.length ? `Gô đang ghi nhớ cho tài khoản của bạn:\n${saved.map(key => "• " + preferenceLabels[key]).join("\n")}\n\nBạn có thể sửa hoặc xóa trong mục Sở thích đã lưu. Yêu cầu mới của chuyến này luôn được ưu tiên.` : "Tài khoản của bạn chưa có sở thích được lưu. Gô không tự lưu từ lịch sử trò chuyện." };
  if (deleting) {
    const all = /\b(tat ca|toan bo|het)\b/.test(n);
    const selected = all ? undefined : keys;
    if (!all && !keys.length) return { content: "Bạn muốn xóa sở thích nào, hay xóa tất cả sở thích đã lưu? Gô chưa thay đổi dữ liệu." };
    await deleteProfile(userId, selected);
    const removed = selected ?? saved;
    dialogue.sessionPreferences = dialogue.sessionPreferences.filter(key => !removed.includes(key));
    dialogue.context.preferences = dialogue.context.preferences.filter(key => !removed.includes(key));
    dialogue.context.dietaryRestrictions = dialogue.context.dietaryRestrictions.filter(key => !removed.includes(key));
    dialogue.profilePending = [];
    return { content: all ? "Gô đã xóa các sở thích lưu lâu dài của tài khoản này." : `Gô đã xóa ưu tiên đã lưu: ${removed.map(key => preferenceLabels[key]).join(", ")}.` };
  }
  const selected = confirming ? dialogue.profilePending : keys;
  if (!selected.length) return { content: "Bạn muốn ghi nhớ ưu tiên cụ thể nào? Gô chỉ lưu sở thích du lịch/ăn uống được bạn nói rõ, không lưu thông tin cá nhân không cần thiết." };
  await writeProfile(userId, selected, "CHAT_EXPLICIT");
  dialogue.profilePending = [];
  return { content: `Gô đã lưu theo yêu cầu của bạn: ${selected.map(key => preferenceLabels[key]).join(", ")}. Bạn có thể xem, sửa hoặc xóa trong Sở thích đã lưu; điều kiện riêng của chuyến hiện tại vẫn được ưu tiên.` };
}
