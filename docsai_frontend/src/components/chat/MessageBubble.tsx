"use client";

import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { Message } from "@/store/chatStore";

interface MessageBubbleProps {
  message: Message;
  statusText?: string;
}

export default function MessageBubble({ message, statusText }: MessageBubbleProps) {
  const isHuman = message.role === "human";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`flex ${isHuman ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] sm:max-w-[75%] ${
          isHuman ? "items-end" : "items-start"
        } flex flex-col gap-2`}
      >
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isHuman
              ? "bg-[#2d5a3d] text-white rounded-tr-sm"
              : "bg-white border border-black/10 text-[#0f0e0c] rounded-tl-sm"
          }`}
        >
          {isHuman ? (
            message.content
          ) : (
            <>
              {/* Status inside bubble — shown before tokens arrive */}
              {statusText && !message.content && (
                <span className="flex items-center gap-1.5 text-xs text-[#9a9690]">
                  <Loader2 size={11} className="animate-spin flex-shrink-0" />
                  {statusText}
                </span>
              )}

              {/* Blinking cursor — no status, no content yet */}
              {!statusText && !message.content && message.streaming && (
                <span className="inline-block w-0.5 h-4 bg-[#2d5a3d] rounded animate-pulse" />
              )}

              {/* Actual streamed content */}
              {message.content && (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}

              {/* Blinking cursor at end while still streaming */}
              {message.streaming && message.content && (
                <span className="inline-block w-0.5 h-3.5 bg-[#2d5a3d] rounded animate-pulse ml-0.5 align-middle" />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}