import type { ChatPlaceCard } from "../types/chat";

/** History can contain old snapshots: recheck validity again when displaying them. */
export function freshStayFacts(
  facts: ChatPlaceCard["stayFacts"],
  today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }),
) {
  if (!facts) return undefined;
  const fresh = (checkedOn: string, days: number) => {
    const age = (Date.parse(today) - Date.parse(checkedOn)) / 86400000;
    return Number.isFinite(age) && age >= 0 && age <= days;
  };
  const publicRates = facts.publicRates.filter(
    (rate) =>
      fresh(rate.checkedOn, 30) &&
      rate.validFrom <= today &&
      today <= rate.validTo,
  );
  return {
    ...facts,
    hours:
      facts.hours && fresh(facts.hours.checkedOn, 180)
        ? facts.hours
        : undefined,
    rooms: facts.rooms.filter((room) => fresh(room.checkedOn, 180)),
    publicRates,
    notices: [
      ...facts.notices,
      ...(publicRates.length < facts.publicRates.length
        ? [
            "Bảng giá trong cuộc trò chuyện cũ đã hết hiệu lực hoặc cần đối chiếu lại; vui lòng hỏi cơ sở để lấy giá mới.",
          ]
        : []),
    ],
  };
}
