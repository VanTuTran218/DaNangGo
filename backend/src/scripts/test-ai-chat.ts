/**
 * Công cụ kiểm thử tự động & tương tác trực tiếp với Trợ lý AI (Gô)
 *
 * Cách chạy:
 *   1. Chạy toàn bộ bộ test tự động:
 *      npm run test:ai
 *
 *   2. Chạy chế độ chat tương tác trực tiếp từ Terminal:
 *      npm run test:ai:chat
 */

import { randomUUID } from "node:crypto";
import readline from "readline";
import dotenv from "dotenv";
import { connectDB, closeDB } from "../config/db";
import { processUserMessage } from "../modules/chat/chat.service";

dotenv.config();

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bgTeal: "\x1b[46m\x1b[30m",
};

interface TestCase {
  id: string;
  name: string;
  message: string;
  expectPlaces: boolean;
  expectType?: "RESTAURANT" | "ACCOMMODATION" | "ATTRACTION";
  validate?: (res: any) => { pass: boolean; note: string };
}

const TEST_CASES: TestCase[] = [
  {
    id: "TC-01",
    name: "Chào hỏi tự nhiên (Không gợi ý bừa bãi)",
    message: "Xin chào bạn, hôm nay thời tiết Đà Nẵng thế nào?",
    expectPlaces: false,
    validate: (res) => {
      const places = res.message.places || [];
      const pass = places.length === 0;
      return {
        pass,
        note: pass
          ? "Tốt: AI chào hỏi lịch sự, không đẩy thẻ địa điểm thừa"
          : "Lỗi: Chào hỏi nhưng lại trả về thẻ địa điểm",
      };
    },
  },
  {
    id: "TC-02",
    name: "Ẩm thực + Quận + Ngân sách cụ thể",
    message: "Gợi ý cho mình quán hải sản tươi ngon ở quận Sơn Trà dưới 300k",
    expectPlaces: true,
    expectType: "RESTAURANT",
    validate: (res) => {
      const places = res.message.places || [];
      const hasRestaurant = places.some(
        (p: any) => p.placeType === "RESTAURANT",
      );
      const hasReason = places.some(
        (p: any) => p.reason && p.reason.length > 5,
      );
      const correctUrl = places.every((p: any) =>
        p.detailUrl.startsWith("/places/"),
      );
      const pass = places.length > 0 && hasRestaurant && correctUrl;
      return {
        pass,
        note: `Tìm thấy ${places.length} quán. Link chuẩn /places/:id: ${correctUrl ? "✅" : "❌"}. Có lý do gợi ý: ${hasReason ? "✅" : "❌"}`,
      };
    },
  },
  {
    id: "TC-03",
    name: "Tìm chỗ ở / Khách sạn gần biển",
    message: "Tìm giúp mình khách sạn view biển Mỹ Khê phòng đẹp giá tốt",
    expectPlaces: true,
    expectType: "ACCOMMODATION",
    validate: (res) => {
      const places = res.message.places || [];
      const hasAccom = places.some((p: any) => p.placeType === "ACCOMMODATION");
      return {
        pass: places.length > 0 && hasAccom,
        note: `Tìm thấy ${places.length} khách sạn/chỗ ở phù hợp`,
      };
    },
  },
  {
    id: "TC-04",
    name: "Điểm tham quan lấy từ dữ liệu",
    message: "Gợi ý điểm tham quan Cầu Rồng",
    expectPlaces: true,
    expectType: "ATTRACTION",
    validate: (res) => {
      const text = res.message.content.toLowerCase();
      const mentionsWeekend =
        res.message.places?.some((p: any) => p.placeType === "ATTRACTION") ??
        false;
      return {
        pass: mentionsWeekend,
        note: mentionsWeekend
          ? "Trả thẻ tham quan từ dữ liệu, không yêu cầu bịa lịch sự kiện"
          : "Không tìm thấy thẻ tham quan",
      };
    },
  },
  {
    id: "TC-05",
    name: "Bảo vệ phạm vi (Guardrail từ chối ngoài lề)",
    message:
      "Viết cho tôi một hàm Python giải thuật toán Dijkstra tìm đường đi",
    expectPlaces: false,
    validate: (res) => {
      const places = res.message.places || [];
      const text = res.message.content.toLowerCase();
      const refuses =
        text.includes("chỉ hỗ trợ") ||
        text.includes("du lịch") ||
        text.includes("không thể hỗ trợ") ||
        text.includes("đà nẵng");
      const pass = places.length === 0 && refuses;
      return {
        pass,
        note: pass
          ? "Đạt chuẩn: Từ chối lịch sự, không bị lừa viết code"
          : "Lỗi: Không từ chối hoặc trả về thẻ địa điểm",
      };
    },
  },
];

async function runAutomatedTests() {
  console.log(
    `\n${colors.bgTeal}  DANANGGO SMART - KIỂM THỬ TỰ ĐỘNG CHỨC NĂNG AI  ${colors.reset}\n`,
  );
  console.log(
    `${colors.gray}Model đang dùng: ${process.env.GEMINI_MODEL || "gemini-3-flash-preview"}${colors.reset}`,
  );
  console.log(
    `${colors.gray}Database: ${process.env.DB_SERVER || "localhost"} / ${process.env.DB_NAME || "DaNangGo"}${colors.reset}\n`,
  );

  let passed = 0;
  const total = TEST_CASES.length;

  for (const tc of TEST_CASES) {
    // Nghỉ 2.5s giữa các lần gọi để tránh chạm trần rate limit (429) của gói Gemini miễn phí
    await new Promise((r) => setTimeout(r, 2500));

    console.log(
      `${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.log(`${colors.cyan}[${tc.id}] ${tc.name}${colors.reset}`);
    console.log(`${colors.gray}Câu hỏi:${colors.reset} "${tc.message}"`);

    const start = Date.now();
    try {
      const res = await processUserMessage({
        message: tc.message,
        guestId: randomUUID(),
      });
      const duration = Date.now() - start;

      const validation = tc.validate
        ? tc.validate(res)
        : { pass: true, note: "OK" };
      if (validation.pass) {
        passed++;
        console.log(
          `${colors.green}✔ KẾT QUẢ: ĐẠT (${duration}ms)${colors.reset}`,
        );
      } else {
        console.log(
          `${colors.red}✖ KẾT QUẢ: KHÔNG ĐẠT (${duration}ms)${colors.reset}`,
        );
      }
      console.log(`${colors.gray}Đánh giá:${colors.reset} ${validation.note}`);
      console.log(
        `${colors.gray}Nội dung trả lời:${colors.reset} ${res.message.content.slice(0, 160)}...`,
      );

      if (res.message.places && res.message.places.length > 0) {
        console.log(
          `${colors.gray}Địa điểm gợi ý (${res.message.places.length}):${colors.reset}`,
        );
        res.message.places.forEach((p: any, idx: number) => {
          console.log(
            `   ${idx + 1}. [${p.placeType}] ${colors.bold}${p.name}${colors.reset} (${p.districtName || "Đà Nẵng"}) - ${p.priceText || "Giá liên hệ"}`,
          );
          if (p.reason)
            console.log(
              `      ${colors.yellow}💡 Lý do: ${p.reason}${colors.reset}`,
            );
          console.log(
            `      ${colors.gray}Link: ${p.detailUrl}${colors.reset}`,
          );
        });
      }
    } catch (err: any) {
      console.log(`${colors.red}✖ LỖI XỬ LÝ: ${err.message}${colors.reset}`);
    }
  }

  console.log(
    `\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
  );
  if (passed < total) process.exitCode = 1;
  const passRate = Math.round((passed / total) * 100);
  const color =
    passRate === 100
      ? colors.green
      : passRate >= 80
        ? colors.yellow
        : colors.red;
  console.log(
    `${color}${colors.bold}TỔNG KẾT: ${passed}/${total} test cases đạt yêu cầu (${passRate}%)${colors.reset}\n`,
  );
}

async function runInteractiveChat() {
  console.log(
    `\n${colors.bgTeal}  DANANGGO SMART - CHẾ ĐỘ TRÒ CHUYỆN TƯƠNG TÁC VỚI BOT GÔ  ${colors.reset}\n`,
  );
  console.log(
    `${colors.gray}Nhập câu hỏi bất kỳ để test trực tiếp phản hồi của AI.`,
  );
  console.log(`Gõ "exit" hoặc "quit" để thoát.\n${colors.reset}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let sessionId: number | undefined = undefined;
  const guestId = randomUUID();

  const promptUser = () => {
    rl.question(
      `${colors.bold}${colors.cyan}Bạn > ${colors.reset}`,
      async (input) => {
        const q = input.trim();
        if (!q) {
          promptUser();
          return;
        }
        if (q.toLowerCase() === "exit" || q.toLowerCase() === "quit") {
          console.log(
            `\n${colors.yellow}Tạm biệt bạn! Chúc bạn test vui vẻ.${colors.reset}\n`,
          );
          rl.close();
          await closeDB();
          process.exit(0);
        }

        const start = Date.now();
        process.stdout.write(
          `${colors.gray}Gô đang suy nghĩ...${colors.reset}\r`,
        );

        try {
          const res = await processUserMessage({
            sessionId,
            message: q,
            guestId,
          });
          sessionId = res.sessionId;
          const duration = Date.now() - start;

          console.log(
            `\r${colors.bold}${colors.green}Gô (AI) [${duration}ms]:${colors.reset}`,
          );
          console.log(`${res.message.content}\n`);

          if (res.message.places && res.message.places.length > 0) {
            console.log(
              `${colors.yellow}📍 Các địa điểm được gợi ý:${colors.reset}`,
            );
            res.message.places.forEach((p: any, idx: number) => {
              console.log(
                `  ${idx + 1}. ${colors.bold}${p.name}${colors.reset} [${p.placeType}] - ${p.districtName || "Đà Nẵng"}`,
              );
              if (p.priceText) console.log(`     💵 Giá: ${p.priceText}`);
              if (p.reason) console.log(`     💡 Lý do: ${p.reason}`);
              console.log(`     🔗 Đường dẫn: ${p.detailUrl}`);
            });
            console.log("");
          }

          if (res.message.quickReplies && res.message.quickReplies.length > 0) {
            console.log(
              `${colors.gray}👉 Gợi ý câu hỏi tiếp theo:${colors.reset} ${res.message.quickReplies.join(" | ")}\n`,
            );
          }
        } catch (err: any) {
          console.log(`\r${colors.red}❌ Lỗi: ${err.message}${colors.reset}\n`);
        }

        promptUser();
      },
    );
  };

  promptUser();
}

async function main() {
  try {
    await connectDB();
  } catch (err: any) {
    console.error(
      `${colors.red}Lỗi kết nối cơ sở dữ liệu:${colors.reset}`,
      err.message,
    );
    process.exit(1);
  }

  const isInteractive =
    process.argv.includes("--interactive") || process.argv.includes("-i");

  if (isInteractive) {
    await runInteractiveChat();
  } else {
    await runAutomatedTests();
    await closeDB();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
