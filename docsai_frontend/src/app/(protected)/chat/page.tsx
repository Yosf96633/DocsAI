"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import Sidebar from "@/components/chat/Sidebar";
import UploadPanel from "@/components/chat/UploadPanel";
import ChatWindow from "@/components/chat/ChatWindow";

interface ActiveDoc {
  docName: string;
  docType: string;
  totalChunks: number;
}

export default function ChatPage() {
  const router = useRouter();
  const { token, hydrate } = useAuthStore();
  const { activeThreadId, setActiveThread, addThread, threads } = useChatStore();

  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<ActiveDoc | null>(null);
  const [view, setView] = useState<"upload" | "chat">("upload");

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (token === null) {
      // give hydrate a tick
      const t = setTimeout(() => {
        const stored = localStorage.getItem("token");
        if (!stored) router.push("/login");
      }, 100);
      return () => clearTimeout(t);
    }
  }, [token, router]);

  const handleNewChat = () => {
    const id = crypto.randomUUID();
    setCurrentThreadId(id);
    setActiveDoc(null);
    setView("upload");
    setActiveThread(id);
  };

  const handleIngestionSuccess = (
    docName: string,
    docType: string,
    totalChunks: number
  ) => {
    if (!currentThreadId) return;
    const thread = {
      thread_id: currentThreadId,
      document_name: docName,
      document_type: docType,
      total_chunks: totalChunks,
      created_at: new Date().toISOString(),
    };
    addThread(thread);
    setActiveDoc({ docName, docType, totalChunks });
    setView("chat");
  };

  // Switch to existing thread
  useEffect(() => {
    if (!activeThreadId) return;
    const t = threads.find((t) => t.thread_id === activeThreadId);
    if (t) {
      setCurrentThreadId(t.thread_id);
      setActiveDoc({
        docName: t.document_name,
        docType: t.document_type,
        totalChunks: t.total_chunks,
      });
      setView("chat");
    }
  }, [activeThreadId]);

  return (
    <div className="flex h-screen bg-[#f7f4ef]">
      <Sidebar onNewChat={handleNewChat} />

      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {view === "upload" && currentThreadId ? (
          <UploadPanel
            threadId={currentThreadId}
            onSuccess={handleIngestionSuccess}
          />
        ) : view === "chat" && currentThreadId && activeDoc ? (
          <ChatWindow
            threadId={currentThreadId}
            docName={activeDoc.docName}
            docType={activeDoc.docType}
            totalChunks={activeDoc.totalChunks}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-[#9a9690]">
            <p className="font-serif text-xl text-[#0f0e0c] mb-2">Welcome to DocsAI</p>
            <p className="text-sm">Click &ldquo;New Chat&rdquo; to upload a document and get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
