"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, FileText } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { chatCompletion, readSSEStream } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import MessageBubble from "./MessageBubble";
import type { Source } from "@/store/chatStore";

interface ChatWindowProps {
  threadId: string;
  docName: string;
  docType: string;
  totalChunks: number;
}

export default function ChatWindow({ threadId, docName, totalChunks }: ChatWindowProps) {
  const { toast } = useToast();
  const { messages, isStreaming, addMessage, appendToken, updateLastAiMessage, setStreaming } =
    useChatStore();
  const [input, setInput] = useState("");
  const [statusText, setStatusText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const threadMessages = messages[threadId] ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || isStreaming) return;
    setInput("");
    setStreaming(true);
    setStatusText("");

    // Add human message
    addMessage(threadId, {
      id: crypto.randomUUID(),
      role: "human",
      content: query,
    });

    // Add empty AI message with streaming flag
    addMessage(threadId, {
      id: crypto.randomUUID(),
      role: "ai",
      content: "",
      streaming: true,
    });

    try {
      const res = await chatCompletion(threadId, query);
      await readSSEStream(res, (event) => {
        if (event.type === "status") {
          setStatusText(event.message as string);
        } else if (event.type === "sources") {
          updateLastAiMessage(threadId, { sources: event.sources as Source[] });
        } else if (event.type === "token") {
          appendToken(threadId, event.token as string);
        }
      });
    } catch (err: unknown) {
      const e = err as { detail?: string };
      toast({
        title: "Error",
        description: e?.detail ?? "Something went wrong",
        variant: "destructive",
      });
    } finally {
      updateLastAiMessage(threadId, { streaming: false });
      setStreaming(false);
      setStatusText("");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Doc info bar */}
      <div className="pl-16 md:pl-6 pr-6 py-3.5 border-b border-black/8 bg-white flex items-center gap-3">
        <div className="w-7 h-7 bg-[#2d5a3d]/10 rounded-lg flex items-center justify-center">
          <FileText size={13} className="text-[#2d5a3d]" />
        </div>
        <span className="text-sm font-medium text-[#0f0e0c]">{docName}</span>
        <span className="text-xs text-[#9a9690]">·</span>
        <span className="text-xs text-[#9a9690]">{totalChunks} chunks</span>
        <span className="inline-flex items-center gap-1 bg-[#2d5a3d]/10 text-[#2d5a3d] text-xs px-2 py-0.5 rounded-full font-medium">
          approved
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {threadMessages.length === 0 && (
          <div className="text-center text-[#9a9690] text-sm mt-20">
            <p className="font-serif text-lg text-[#0f0e0c] mb-2">
              Document ready
            </p>
            <p>Ask anything about your document and get cited answers.</p>
          </div>
        )}
        {threadMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Status + Input */}
      <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-black/8 bg-white">
        {statusText && (
          <div className="flex items-center gap-2 text-xs text-[#9a9690] mb-2 px-1">
            <Loader2 size={11} className="animate-spin" />
            {statusText}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isStreaming}
            placeholder="Ask anything about your document..."
            className="flex-1 px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/30 focus:border-[#2d5a3d] transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="px-4 py-3 rounded-xl bg-[#2d5a3d] text-white hover:bg-[#4a8a5f] transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isStreaming ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}