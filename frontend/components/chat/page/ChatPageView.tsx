"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  // Keep right blueprint collapsed by default so chat breathes cleanly; auto-opens when a real travel plan is generated
  const [panelVisible, setPanelVisible] = useState(false);
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

  // Auto-open the Executive Trip Panel when Gô builds an itinerary
  useEffect(() => {
    if (latestPlanMessage?.travelPlan) {
      setPanelVisible(true);
    }
  }, [latestPlanMessage?.id, latestPlanMessage?.travelPlan]);

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
    setPanelVisible(false);
    requestAnimationFrame(() => props.inputRef.current?.focus());
  };

  // Wire Cmd/Ctrl + K global shortcut to start a fresh conversation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!props.isLoading) reset();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isLoading]);

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
        loading={props.isLoading}
      >
        <ChatHeader
          loading={props.isLoading}
          status={props.status}
          hasPlan={Boolean(latestPlanMessage?.travelPlan)}
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

        <ChatComposer
          value={props.input}
          onChange={props.onInputChange}
          onSend={props.onSend}
          loading={props.isLoading}
          inputRef={props.inputRef}
          suggestions={last?.sender === "AI" ? (last.quickReplies ?? []) : []}
          showSuggestions={!empty}
          location={props.location}
          locationStatus={props.locationStatus}
          locating={props.locating}
          onLocate={props.onLocate}
          onRadius={props.onRadius}
          onClearLocation={props.onClearLocation}
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
