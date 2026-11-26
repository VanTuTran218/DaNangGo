"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface AiTypewriterTextProps {
  text: string;
  className?: string;
  highlightStats?: boolean;
  highlightClassName?: string;
}

export default function AiTypewriterText({
  text,
  className = "",
  highlightStats = true,
  highlightClassName = "text-orange-500 font-bold",
}: AiTypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const shouldReduceMotion = useReducedMotion();
  
  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedText(text);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [text, shouldReduceMotion]);

  // Function to wrap numbers in accent span
  const renderText = (content: string) => {
    if (!highlightStats) return content;
    
    const parts = content.split(/(\d+(?:[.,]\d+)*(?:đ|%)?)/g);
    
    return parts.map((part, idx) => {
      if (/\d/.test(part)) {
        return (
          <span key={idx} className={highlightClassName}>
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className={className}>
      {renderText(displayedText)}
    </div>
  );
}
