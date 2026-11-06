"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  RotateCcw,
  Minus,
  MapPin,
  Star,
  Navigation,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { sendChatMessage, chatRequest } from "@/lib/api/chat";
import { useAuth } from "@/contexts/AuthContext";
import type {
  ChatMessage,
  ChatPlaceCard,
  ChatSessionSummary,
  ChatLocation,
} from "@/types/chat";
import BotLogo from "./BotLogo";
import TravelPlan from "./TravelPlan";
import ResponseDetails, { MenuItems } from "./ResponseDetails";
import ProfileMemory from "./ProfileMemory";
import ComparisonTable from "./ComparisonTable";
import ChatPageView from "./page/ChatPageView";
import StayFacts from "./page/StayFacts";
import { chatStorageKeys } from "@/lib/chat-storage";
import { ChatRequestError } from "@/lib/chat-stream";

const BOT_NAME = "Gô";
const GREETED_KEY = "dananggo_chat_greeted";

const QUICK_STARTS = [
  "🍜 Quán Mì Quảng ngon",
  "🏖️ Khách sạn gần biển Mỹ Khê",
  "🦞 Hải sản Sơn Trà dưới 300k",
  "🌉 Điểm tham quan miễn phí",
  "✨ Lên lịch 3 ngày ở Đà Nẵng",
  "🥗 Gợi ý món ăn thanh đạm ở Đà Nẵng",
  "🌶️ Quán ăn có món cay ở Đà Nẵng",
];

/** Lời chào theo buổi trong ngày */
function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** Lấy tên gọi thân mật (tên cuối trong họ tên tiếng Việt) */
function firstName(fullName?: string | null): string | null {
  if (!fullName) return null;
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || null;
}

function buildWelcome(name: string | null): ChatMessage {
  return {
    id: `welcome_${Date.now()}`,
    sender: "AI",
    content:
      `👋 Xin chào${name ? ` **${name}**` : " bạn"}! Mình là **${BOT_NAME}** – trợ lý AI du lịch của DanangGo.\n\n` +
      `Mình có thể tư vấn điểm check-in, quán ăn, chỗ ở và lên lịch từng ngày theo buổi ngay trong cuộc trò chuyện. Bạn cho mình biết số ngày, số khách và ngân sách nhé. Hôm nay ${name ?? "bạn"} muốn khám phá gì?`,
    quickReplies: QUICK_STARTS,
    createdAt: new Date().toISOString(),
  };
}

/** Đường dẫn trang chi tiết đúng của địa điểm */
function placeHref(place: ChatPlaceCard): string {
  if (place.detailUrl?.startsWith("/places/")) return place.detailUrl;
  return `/places/${place.placeId}`;
}

const TYPE_LABEL: Record<
  ChatPlaceCard["placeType"],
  { text: string; cls: string }
> = {
  RESTAURANT: { text: "Ẩm thực", cls: "bg-orange-50 text-orange-600" },
  ACCOMMODATION: { text: "Lưu trú", cls: "bg-sky-50 text-sky-600" },
  ATTRACTION: { text: "Tham quan", cls: "bg-emerald-50 text-emerald-600" },
};

export default function ChatBox({
  variant = "widget",
}: {
  variant?: "widget" | "page";
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  if (loading) return null;
  if (
    variant === "widget" &&
    (pathname === "/chat" ||
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/partner"))
  )
    return null;
  return (
    <ChatExperience
      key={`${variant}:${user?.id ?? "guest"}`}
      variant={variant}
    />
  );
}

function ChatExperience({ variant }: { variant: "widget" | "page" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { historyKey: HISTORY_KEY, sessionKey: SESSION_KEY } = chatStorageKeys(
    user?.id,
  );
  const name = useMemo(() => firstName(user?.name), [user?.name]);

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(variant === "page");
  const [isMinimized, setIsMinimized] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Gô đang tìm hiểu yêu cầu…");
  const [candidates, setCandidates] = useState<ChatPlaceCard[]>([]);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [location, setLocation] = useState<ChatLocation>();
  const [locationStatus, setLocationStatus] = useState("");
  const [locating, setLocating] = useState(false);
  const locationRequest = useRef(0);
  const refreshSessions = async () => {
    try {
      const rows = await chatRequest<ChatSessionSummary[]>("/sessions");
      setSessions(rows);
      setHistoryError("");
    } catch (e) {
      setHistoryError(
        e instanceof Error ? e.message : "Chưa tải được lịch sử.",
      );
    }
  };
  useEffect(() => {
    if (!authLoading) void refreshSessions();
  }, [authLoading]);
  const openSession = async (id: number) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoading(true);
    setCandidates([]);
    setStatus("Đang mở hội thoại…");
    try {
      const rows = await chatRequest<ChatMessage[]>(`/sessions/${id}`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setMessages(rows);
      setSessionId(id);
      setHistoryError("");
    } catch (e) {
      if (!controller.signal.aborted)
        setHistoryError(
          e instanceof Error ? e.message : "Chưa mở được hội thoại.",
        );
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };
  const locate = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Trình duyệt chưa hỗ trợ định vị.");
      return;
    }
    const request = ++locationRequest.current;
    setLocating(true);
    setLocationStatus("Đang lấy vị trí…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (request !== locationRequest.current) return;
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radiusKm: 5,
        });
        setLocating(false);
        setLocationStatus(
          "Đã lấy vị trí. Chọn bán kính rồi hỏi địa điểm hoặc quán ăn quanh đây.",
        );
        setInput("Gợi ý địa điểm tham quan quanh vị trí tôi");
        inputRef.current?.focus();
      },
      (error) => {
        if (request !== locationRequest.current) return;
        setLocating(false);
        setLocationStatus(
          error.code === 1
            ? "Bạn chưa cho phép định vị. Có thể nhập tên quận để Gô tìm giúp."
            : "Chưa lấy được vị trí. Bạn thử lại hoặc nhập tên quận nhé.",
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestAnswerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => setMounted(true), []);

  // Mở chat từ nơi khác (Navbar dispatch "open-dananggo-chat")
  useEffect(() => {
    const open = () => {
      setIsOpen(true);
      setIsMinimized(false);
      setShowGreeting(false);
    };
    window.addEventListener("open-dananggo-chat", open);
    return () => window.removeEventListener("open-dananggo-chat", open);
  }, []);

  // Khôi phục lịch sử chat
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
      const s = localStorage.getItem(SESSION_KEY);
      if (
        s &&
        Number.isSafeInteger(Number(s)) &&
        Number(s) > 0 &&
        Number(s) <= 2147483647
      )
        setSessionId(Number(s));
    } catch {
      /* bỏ qua lịch sử hỏng */
    }
  }, []);

  // Khi biết user (sau khi auth load xong): tạo lời chào cá nhân hóa nếu chưa có hội thoại
  useEffect(() => {
    if (authLoading) return;
    setMessages((prev) => {
      const onlyWelcome =
        prev.length === 0 ||
        (prev.length === 1 && prev[0].id.startsWith("welcome"));
      return onlyWelcome ? [buildWelcome(name)] : prev;
    });
  }, [authLoading, name]);

  // Lời chào bật lên khi user vừa vào website (1 lần mỗi phiên trình duyệt)
  // Không tự tắt – chỉ tắt khi user bấm X hoặc mở chat
  useEffect(() => {
    if (authLoading) return;
    if (variant === "page" || sessionStorage.getItem(GREETED_KEY)) return;
    const t = setTimeout(() => setShowGreeting(true), 2000);
    return () => clearTimeout(t);
  }, [authLoading, variant]);

  // Lưu lịch sử
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
      } catch {
        /* quota */
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      if (messages[messages.length - 1]?.travelPlan)
        latestAnswerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      else messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized)
      setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen, isMinimized]);

  if (
    !mounted ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/partner")
  )
    return null;

  const dismissGreeting = () => {
    setShowGreeting(false);
    sessionStorage.setItem(GREETED_KEY, "1");
  };

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    dismissGreeting();
  };

  const resetChat = () => {
    requestRef.current?.abort();
    setIsLoading(false);
    setCandidates([]);
    setMessages([buildWelcome(name)]);
    setSessionId(null);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(SESSION_KEY);
  };

  const send = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isLoading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        sender: "USER",
        content: query,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput("");
    setIsLoading(true);
    setCandidates([]);
    setStatus("Gô đang tìm hiểu yêu cầu…");
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const res = await sendChatMessage(query, sessionId, {
        signal: controller.signal,
        location: /quanh|gần đây|gần tôi|gần vị trí|lân cận/i.test(query)
          ? location
          : undefined,
        onProgress: (event) => {
          if (controller.signal.aborted) return;
          if (event.type === "status") setStatus(event.text);
          else setCandidates(event.places);
        },
      });
      if (controller.signal.aborted) return;
      if (res?.sessionId && res.sessionId !== sessionId) {
        setSessionId(res.sessionId);
        localStorage.setItem(SESSION_KEY, String(res.sessionId));
      }
      if (res?.message) setMessages((prev) => [...prev, res.message]);
      void refreshSessions();
    } catch (error) {
      if (controller.signal.aborted) return;
      if (
        error instanceof ChatRequestError &&
        error.code === "CHAT_SESSION_NOT_FOUND"
      ) {
        setSessionId(null);
        localStorage.removeItem(SESSION_KEY);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "AI",
          content:
            error instanceof ChatRequestError
              ? error.message
              : "Xin lỗi, kết nối đang gián đoạn. Bạn thử lại sau giây lát nhé!",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setCandidates([]);
      }
    }
  };

  /** Chuyển tới trang chi tiết; thu nhỏ chat trên màn hình nhỏ để không che nội dung */
  const goToPlace = (place: ChatPlaceCard) => {
    if (window.innerWidth < 640) setIsMinimized(true);
    router.push(placeHref(place));
  };

  const renderContent = (content: string) =>
    content.split("\n").map((line, idx) => {
      const bullet = /^\s*[•\-*]\s/.test(line);
      const parts = (bullet ? line.replace(/^\s*[•\-*]\s+/, "") : line).split(/(\*\*.*?\*\*)/g).map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          p
        ),
      );
      if (line.trim() === "") return <div key={idx} className="h-1.5" />;
      if (bullet)
        return (
          <div key={idx} className="flex gap-1.5 pl-0.5">
            <span className="text-teal-500">•</span>
            <span>{parts.slice(0)}</span>
          </div>
        );
      return <p key={idx}>{parts}</p>;
    });

  const lastMsg = messages[messages.length - 1];

  const showPageView: boolean = variant === "page";
  if (showPageView) {
    return (
      <ChatPageView
        sessions={sessions}
        sessionId={sessionId}
        historyError={historyError}
        onOpenSession={openSession}
        location={location}
        locationStatus={locationStatus}
        locating={locating}
        onLocate={locate}
        onRadius={(radiusKm) =>
          setLocation((prev) => (prev ? { ...prev, radiusKm } : prev))
        }
        onClearLocation={() => {
          locationRequest.current++;
          setLocation(undefined);
          setLocating(false);
          setLocationStatus("");
        }}
        onUpdateMessage={(updated) =>
          setMessages((previous) =>
            previous.map((message) =>
              message.id === updated.id ? updated : message,
            ),
          )
        }
        messages={messages}
        input={input}
        isLoading={isLoading}
        status={status}
        candidates={candidates}
        quickStarts={QUICK_STARTS}
        onInputChange={setInput}
        onSend={send}
        onReset={resetChat}
        onGoToPlace={goToPlace}
        inputRef={inputRef}
        messagesEndRef={messagesEndRef}
        latestAnswerRef={latestAnswerRef}
        renderMessage={(message) => (
          <ChatText
            content={message.content}
            animate={
              message.sender === "AI" &&
              message === lastMsg &&
              !message.id.startsWith("welcome")
            }
            render={renderContent}
          />
        )}
      />
    );
  }

  return (
    <div
      className={
        variant === "page"
          ? "w-full"
          : "fixed bottom-5 right-5 z-[999] flex flex-col items-end gap-3 pointer-events-none"
      }
    >
      {/* ── Lời chào khi vừa vào website ── */}
      <AnimatePresence>
        {showGreeting && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            className="pointer-events-auto relative w-[300px] rounded-2xl bg-white p-4 shadow-2xl shadow-teal-900/15 ring-1 ring-gray-100"
          >
            <button
              onClick={dismissGreeting}
              aria-label="Đóng lời chào"
              className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={14} />
            </button>
            <div className="flex gap-3">
              <BotLogo size={44} className="shrink-0" />
              <div className="pr-4">
                <p className="text-[11px] font-medium text-teal-600">
                  {timeGreeting()} ☀️
                </p>
                <p className="text-sm font-bold text-gray-900">
                  Xin chào{name ? ` ${name}` : " bạn"}! 👋
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  Mình là <b>{BOT_NAME}</b>, trợ lý AI của DanangGo. Cần tìm
                  quán ngon, chỗ ở hay điểm đi chơi? Hỏi mình nhé!
                </p>
              </div>
            </div>
            <button
              onClick={openChat}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 py-2 text-xs font-semibold text-white transition hover:brightness-110"
            >
              Trò chuyện với {BOT_NAME} <ArrowRight size={13} />
            </button>
            <span className="absolute -bottom-1.5 right-7 h-3 w-3 rotate-45 bg-white ring-1 ring-gray-100 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cửa sổ chat ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height:
                variant === "page"
                  ? "min(760px, calc(100dvh - 190px))"
                  : isMinimized
                    ? 72
                    : "min(640px, calc(100dvh - 120px))",
            }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className={`pointer-events-auto flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-teal-900/20 ring-1 ring-gray-100 ${variant === "page" ? "w-full min-h-[400px]" : "w-[calc(100vw-2.5rem)] max-w-[400px]"}`}
          >
            {/* Header */}
            <div className="relative flex shrink-0 items-center gap-3 overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 px-4 py-3.5 text-white">
              <div className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-12 right-16 h-20 w-20 rounded-full bg-orange-300/20" />
              <div className="relative rounded-2xl bg-white/95 p-1 shadow-md">
                <BotLogo size={36} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-400" />
              </div>
              <div className="relative min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[15px] font-bold leading-tight">
                  {BOT_NAME}{" "}
                  <span className="rounded-md bg-white/20 px-1.5 py-px text-[10px] font-semibold">
                    AI BOT
                  </span>
                </p>
                <p className="truncate text-[11px] text-teal-50">
                  {isLoading ? status : "Trợ lý du lịch Đà Nẵng · Trực tuyến"}
                </p>
              </div>
              <div className="relative flex items-center gap-0.5">
                <ProfileMemory />
                <button
                  onClick={resetChat}
                  title="Cuộc trò chuyện mới"
                  className="rounded-lg p-1.5 hover:bg-white/15"
                >
                  <RotateCcw size={15} />
                </button>
                {variant === "widget" && (
                  <>
                    <button
                      onClick={() => setIsMinimized((v) => !v)}
                      title="Thu nhỏ"
                      className="rounded-lg p-1.5 hover:bg-white/15"
                    >
                      <Minus size={16} />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      title="Đóng"
                      className="rounded-lg p-1.5 hover:bg-white/15"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Tin nhắn */}
                <div
                  role="log"
                  aria-label="Hội thoại với Gô"
                  aria-live="polite"
                  aria-relevant="additions"
                  className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-teal-50/40 to-gray-50 px-4 py-4"
                  data-lenis-prevent
                >
                  {messages.map((msg) => {
                    const isUser = msg.sender === "USER";
                    return (
                      <motion.div
                        key={msg.id}
                        ref={
                          !isUser && msg === lastMsg
                            ? latestAnswerRef
                            : undefined
                        }
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <BotLogo
                            size={30}
                            animated={false}
                            className="mt-0.5 shrink-0"
                          />
                        )}
                        <div
                          className={`flex min-w-0 ${msg.travelPlan ? "w-full max-w-[92%]" : "max-w-[85%]"} flex-col ${isUser ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`space-y-0.5 px-3.5 py-2.5 text-[13px] leading-relaxed ${
                              isUser
                                ? "rounded-2xl rounded-br-md bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-md shadow-teal-600/20"
                                : "rounded-2xl rounded-bl-md bg-white text-gray-700 shadow-sm ring-1 ring-gray-100"
                            }`}
                          >
                            <ChatText
                              content={msg.content}
                              animate={
                                msg.sender === "AI" &&
                                msg === lastMsg &&
                                !msg.id.startsWith("welcome")
                              }
                              render={renderContent}
                            />
                          </div>

                          {msg.travelPlan && (
                            <TravelPlan plan={msg.travelPlan} />
                          )}
                          {msg.comparison && (
                            <ComparisonTable comparison={msg.comparison} />
                          )}

                          {/* Thẻ địa điểm – bấm để tới trang chi tiết */}
                          {msg.sender === "AI" && <ResponseDetails message={msg} />}
                          {msg.places && msg.places.length > 0 && (
                            <div className="mt-2 w-full space-y-2">
                              {msg.places.map((place) => {
                                const t =
                                  TYPE_LABEL[place.placeType] ??
                                  TYPE_LABEL.ATTRACTION;
                                return (
                                  <React.Fragment key={place.placeId}>
                                    <div
                                      role="link"
                                      tabIndex={0}
                                      onClick={() => goToPlace(place)}
                                      onKeyDown={(e) =>
                                        e.key === "Enter" && goToPlace(place)
                                      }
                                      className="group flex cursor-pointer gap-2.5 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-teal-200"
                                    >
                                      {place.imageUrl ? (
                                        <img
                                          src={place.imageUrl}
                                          alt={place.name}
                                          loading="lazy"
                                          className="h-[70px] w-[70px] shrink-0 rounded-xl bg-gray-100 object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
                                          <MapPin size={20} />
                                        </div>
                                      )}
                                      <div className="flex min-w-0 flex-1 flex-col">
                                        <div className="flex items-start justify-between gap-1">
                                          <h4 className="line-clamp-2 text-[13px] font-semibold text-gray-900 group-hover:text-teal-700">
                                            {place.name}
                                          </h4>
                                          <span
                                            className={`shrink-0 rounded-md px-1.5 py-px text-[10px] font-semibold ${t.cls}`}
                                          >
                                            {t.text}
                                          </span>
                                        </div>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                                          <span className="flex items-center gap-0.5 font-semibold text-amber-500">
                                            <Star
                                              size={11}
                                              fill="currentColor"
                                            />{" "}
                                            {place.reviewCount > 0
                                              ? place.rating
                                              : "Chưa có đánh giá"}
                                          </span>
                                          <span>·</span>
                                          <span className="truncate">
                                            {place.districtName || "Đà Nẵng"}
                                          </span>
                                          {place.priceText && (
                                            <>
                                              <span>·</span>
                                              <span className="truncate font-medium text-teal-700">
                                                {place.priceText}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        {place.reason && (
                                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-600">
                                            💡 {place.reason}
                                          </p>
                                        )}
                                        <div className="mt-auto flex items-center justify-end gap-2 pt-1 text-[11px] font-semibold">
                                          <Link
                                            href={`/bando?search=${encodeURIComponent(place.name)}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-0.5 text-gray-500 hover:text-teal-600"
                                          >
                                            <Navigation size={11} /> Chỉ đường
                                          </Link>
                                          <span className="flex items-center text-teal-600">
                                            Xem chi tiết{" "}
                                            <ChevronRight
                                              size={13}
                                              className="transition group-hover:translate-x-0.5"
                                            />
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <MenuItems place={place} />
                                    <StayFacts place={place} />
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          )}

                          {msg.actionLink && (
                            <Link
                              href={msg.actionLink.url}
                              className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-100 hover:bg-teal-100"
                            >
                              {msg.actionLink.text} <ArrowRight size={12} />
                            </Link>
                          )}

                          <span className="mt-1 px-1 text-[10px] text-gray-400">
                            {new Date(msg.createdAt).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}

                  {isLoading && (
                    <div className="flex items-end gap-2">
                      <BotLogo size={30} className="shrink-0" />
                      <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="h-2 w-2 rounded-full bg-teal-400"
                            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 0.9,
                              repeat: Infinity,
                              delay: i * 0.15,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {isLoading && (
                    <div
                      role="status"
                      className="space-y-2 text-xs text-teal-700"
                    >
                      <p>{status}</p>
                      {candidates.length > 0 && (
                        <div className="rounded-2xl border border-teal-100 bg-white p-3">
                          <p className="mb-2 font-semibold">
                            Địa điểm từ dữ liệu DaNangGo
                          </p>
                          {candidates.map((place) => (
                            <Link
                              key={place.placeId}
                              href={`/places/${place.placeId}`}
                              className="mb-2 block rounded-lg bg-teal-50 p-2 hover:bg-teal-100"
                            >
                              <span className="font-semibold">
                                {place.name}
                              </span>
                              <span className="block text-gray-600">
                                {place.priceText || "Chưa cập nhật giá"}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Gợi ý nhanh từ tin nhắn cuối */}
                {!isLoading &&
                  lastMsg?.sender === "AI" &&
                  lastMsg.quickReplies &&
                  lastMsg.quickReplies.length > 0 && (
                    <div className="flex shrink-0 gap-1.5 overflow-x-auto border-t border-gray-100 bg-white px-3 py-2 [scrollbar-width:none]">
                      {lastMsg.quickReplies.map((q) => (
                        <button
                          key={q}
                          onClick={() => send(q)}
                          className="shrink-0 rounded-full border border-teal-100 bg-teal-50/60 px-3 py-1 text-[11px] font-medium text-teal-700 transition hover:border-teal-300 hover:bg-teal-100"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                {/* Ô nhập */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  className="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-white px-3 py-3"
                >
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement | null>}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={500}
                    placeholder={`Nhắn cho ${BOT_NAME}…`}
                    className="flex-1 rounded-2xl bg-gray-100 px-4 py-2.5 text-[13px] text-gray-800 outline-none ring-teal-300 transition placeholder:text-gray-400 focus:bg-white focus:ring-2"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    aria-label="Gửi"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-md shadow-teal-600/25 transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
                  >
                    <Send size={16} />
                  </button>
                </form>
                <p className="shrink-0 bg-white pb-2 text-center text-[10px] text-gray-400">
                  {BOT_NAME} có thể sai sót · Hãy kiểm tra lại giờ mở cửa trước
                  khi đến
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nút bot nổi ── */}
      {variant === "widget" && (
        <motion.button
          onClick={() => (isOpen ? setIsOpen(false) : openChat())}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label={isOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
          className="pointer-events-auto relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl shadow-teal-900/25 ring-4 ring-teal-500/90"
        >
          {!isOpen && (
            <span className="absolute inset-0 animate-ping rounded-full bg-teal-400/30" />
          )}
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="x"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X size={26} className="text-teal-600" />
              </motion.span>
            ) : (
              <motion.span
                key="bot"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
              >
                <BotLogo size={46} />
              </motion.span>
            )}
          </AnimatePresence>
          {!isOpen && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              AI
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}

function ChatText({
  content,
  animate,
  render,
}: {
  content: string;
  animate: boolean;
  render: (text: string) => React.ReactNode;
}) {
  const [length, setLength] = useState(animate ? 0 : content.length);
  useEffect(() => {
    if (
      !animate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setLength(content.length);
      return;
    }
    setLength(0);
    const timer = setInterval(
      () =>
        setLength((value) => {
          const next = Math.min(content.length, value + 12);
          if (next === content.length) clearInterval(timer);
          return next;
        }),
      20,
    );
    return () => clearInterval(timer);
  }, [content, animate]);
  return <div aria-label={content}>{render(content.slice(0, length))}</div>;
}
