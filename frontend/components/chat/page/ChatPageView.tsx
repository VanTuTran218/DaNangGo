"use client";

import { useState, type ReactNode, type RefObject } from "react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import type {
  ChatMessage,
  ChatPlaceCard,
  ChatSessionSummary,
  ChatLocation,
} from "@/types/chat";
import ChatShell from "./ChatShell";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import EmptyState from "./EmptyState";
import MessageBubble, { TypingIndicator } from "./MessageBubble";
import ChatComposer from "./ChatComposer";
import TripSummaryPanel from "./TripSummaryPanel";
import ChatDrawer from "./ChatDrawer";
import { dayAnchor } from "./ItineraryCard";
import styles from "./ChatPage.module.css";

interface ChatPageViewProps {
  sessions: ChatSessionSummary[];
  sessionId: number | null;
  historyError: string;
  onOpenSession: (id: number) => void;
  onUpdateMessage: (message: ChatMessage) => void;
  location?: ChatLocation;
  locationStatus: string;
  locating: boolean;
  onLocate: () => void;
  onRadius: (radius: 2 | 5 | 10) => void;
  onClearLocation: () => void;
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  status: string;
  candidates: ChatPlaceCard[];
  quickStarts: string[];
  onInputChange: (text: string) => void;
  onSend: (text?: string) => void;
  onReset: () => void;
  onGoToPlace: (place: ChatPlaceCard) => void;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  latestAnswerRef: RefObject<HTMLDivElement | null>;
  renderMessage: (message: ChatMessage) => ReactNode;
}

/** Presentation adapter. Conversation state and all requests stay in ChatExperience. */
export default function ChatPageView(props: ChatPageViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false),
    [summaryOpen, setSummaryOpen] = useState(false),
    [panelVisible, setPanelVisible] = useState(true);
  const [daySelections, setDaySelections] = useState<Record<string, number>>(
    {},
  );
  const reduced = useReducedMotion();
  const last = props.messages[props.messages.length - 1];
  const latestPlanMessage = [...props.messages]
    .reverse()
    .find((message) => message.travelPlan);
  const empty = !props.messages.some((message) => message.sender === "USER");
  const welcome = props.messages.find((message) =>
    message.id.startsWith("welcome"),
  );
  const selectPrompt = (text: string) => {
    props.onInputChange(text);
    setSidebarOpen(false);
    setSummaryOpen(false);
    requestAnimationFrame(() => props.inputRef.current?.focus());
  };
  const reset = () => {
    props.onReset();
    setDaySelections({});
    setSidebarOpen(false);
    setSummaryOpen(false);
  };
  const selectDay = (id: string, day: number) =>
    setDaySelections((previous) => ({ ...previous, [id]: day }));
  const jumpDay = (day: number) => {
    if (!latestPlanMessage) return;
    selectDay(latestPlanMessage.id, day);
    setSummaryOpen(false);
    requestAnimationFrame(() => {
      document
        .getElementById(dayAnchor(latestPlanMessage.id, day))
        ?.scrollIntoView({
          behavior: reduced ? "instant" : "smooth",
          block: "nearest",
        });
    });
  };
  const sidebar = (
    <ChatSidebar
      sessions={props.sessions}
      sessionId={props.sessionId}
      historyError={props.historyError}
      onOpenSession={(id) => {
        props.onOpenSession(id);
        setSidebarOpen(false);
      }}
      prompts={props.quickStarts}
      onSelect={selectPrompt}
      onReset={reset}
      loading={props.isLoading}
    />
  );
  const planningPrompt = props.quickStarts.find((text) =>
    text.includes("lịch"),
  );
  const summary = (
    <TripSummaryPanel
      plan={latestPlanMessage?.travelPlan}
      onJumpDay={jumpDay}
      loading={props.isLoading}
      onStartPlanning={
        planningPrompt ? () => selectPrompt(planningPrompt) : undefined
      }
      onSelectPrompt={selectPrompt}
    />
  );
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <ChatShell
        sidebar={sidebar}
        summary={summary}
        panelVisible={panelVisible}
      >
        <ChatHeader
          loading={props.isLoading}
          status={props.status}
          onReset={reset}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenSummary={() => setSummaryOpen(true)}
          onTogglePanel={() => setPanelVisible((value) => !value)}
          panelVisible={panelVisible}
        />
        <div
          className={styles.messageLog}
          role="log"
          aria-label="Hội thoại với Gô"
          aria-live="polite"
          aria-relevant="additions"
          data-lenis-prevent
        >
          {empty && !props.isLoading ? (
            <>
              <div ref={props.messagesEndRef} />
              <EmptyState
                welcome={welcome ? props.renderMessage(welcome) : null}
                prompts={props.quickStarts}
                onSelect={selectPrompt}
                loading={props.isLoading}
              />
            </>
          ) : (
            <div className={styles.messageList}>
              {props.messages.map((message) => (
                <motion.div
                  key={message.id}
                  ref={
                    message.sender === "AI" && message === last
                      ? props.latestAnswerRef
                      : undefined
                  }
                  initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <MessageBubble
                    sessionId={props.sessionId}
                    onUpdate={props.onUpdateMessage}
                    onAdjust={(text) => {
                      selectPrompt(text);
                    }}
                    message={message}
                    onGoToPlace={props.onGoToPlace}
                    selectedDay={daySelections[message.id]}
                    onSelectDay={(day) => selectDay(message.id, day)}
                  >
                    {props.renderMessage(message)}
                  </MessageBubble>
                </motion.div>
              ))}
            </div>
          )}
          {props.isLoading && (
            <TypingIndicator
              status={props.status}
              candidates={props.candidates}
            />
          )}
          {!(empty && !props.isLoading) && <div ref={props.messagesEndRef} />}
        </div>
        <div className={styles.locationTools}>
          <button
            type="button"
            className={styles.locationButton}
            disabled={props.locating || props.isLoading}
            onClick={props.onLocate}
          >
            <span className={styles.radarIcon}>⌖</span>
            <span>{props.locating ? "Đang định vị GPS…" : "Tìm quanh vị trí tôi"}</span>
          </button>
          {props.location && (
            <>
              <label className={styles.locationRadiusLabel}>
                Bán kính{" "}
                <select
                  aria-label="Bán kính tìm quanh đây"
                  value={props.location.radiusKm}
                  onChange={(e) =>
                    props.onRadius(Number(e.target.value) as 2 | 5 | 10)
                  }
                >
                  {[2, 5, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} km
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className={styles.locationClearBtn} onClick={props.onClearLocation}>
                Tắt vị trí
              </button>
            </>
          )}
          {props.locationStatus && (
            <small className={styles.locationStatusBadge} role="status">{props.locationStatus}</small>
          )}
        </div>
        <ChatComposer
          value={props.input}
          onChange={props.onInputChange}
          onSend={props.onSend}
          loading={props.isLoading}
          inputRef={props.inputRef}
          suggestions={last?.sender === "AI" ? (last.quickReplies ?? []) : []}
        />
      </ChatShell>
      <ChatDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Bắt đầu cùng Gô"
        side="left"
      >
        {sidebar}
      </ChatDrawer>
      <ChatDrawer
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="Chuyến đi của bạn"
        side="right"
      >
        {summary}
      </ChatDrawer>
    </MotionConfig>
  );
}
