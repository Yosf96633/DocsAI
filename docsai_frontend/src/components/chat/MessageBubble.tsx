"use client";

import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import type { Message } from "@/store/chatStore";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isHuman = message.role === "human";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`flex ${isHuman ? "justify-end" : "justify-start"} mb-4`}
    >
      <div className={`max-w-[80%] sm:max-w-[75%] ${isHuman ? "items-end" : "items-start"} flex flex-col gap-2`}>
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
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              {message.streaming && !message.content && (
                <span className="inline-block w-0.5 h-4 bg-[#2d5a3d] rounded animate-pulse" />
              )}
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