"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, LogOut, X, Menu, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

interface SidebarProps {
  onNewChat: () => void;
}

export default function Sidebar({ onNewChat }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { threads, setThreads, activeThreadId, setActiveThread, setMessages } =
    useChatStore();

  const [loading, setLoading] = useState(false);
  const [loadingThread, setLoadingThread] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Fetch all threads on mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/v1/threads`, {
          credentials: "include", // sends access token cookie
        });
        if (!res.ok) throw new Error("Failed to fetch threads");
        const data = await res.json();
        console.log("Data : " , data)
        setThreads(data.threads ?? []);
      } catch (err) {
        console.error("Sidebar: could not load threads", err);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [setThreads]);

  // ── Click a thread → fetch its messages ────────────────────────────────
  const handleThreadClick = async (threadId: string) => {
    setMobileOpen(false);
    setActiveThread(threadId);
    setLoadingThread(threadId);
    try {
      const res = await fetch(
        `${API_BASE}/v1/messages?thread_id=${encodeURIComponent(threadId)}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();

      // data.messages: [{ role: "human" | "ai", content: string }]
      const hydrated = (data.messages ?? []).map(
        (m: { role: string; content: string }, i: number) => ({
          id: `${threadId}-${i}`,
          role: m.role as "human" | "ai",
          content: m.content,
          streaming: false,
        })
      );
      setMessages(threadId, hydrated);
    } catch (err) {
      console.error("Sidebar: could not load messages", err);
    } finally {
      setLoadingThread(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // ── Shared sidebar body ─────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="w-full h-full bg-[#0f0e0c] flex flex-col border-r border-white/5">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#2d5a3d] rounded-lg flex items-center justify-center">
            <FileText size={13} className="text-white" />
          </div>
          <span className="font-serif text-[1.1rem] text-white">DocsAI</span>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-white/30 hover:text-white/60 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* New Chat */}
      <div className="px-3 py-3">
        <button
          onClick={() => {
            setMobileOpen(false);
            onNewChat();
          }}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
        >
          <Plus size={15} />
          New Chat
        </button>
      </div>

      {/* Threads list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-white/30" />
          </div>
        ) : (
          <>
            {threads.length > 0 && (
              <p className="text-xs text-white/25 px-2 py-2 uppercase tracking-widest">
                Threads
              </p>
            )}
            {threads.map((t) => (
              <motion.button
                key={t.thread_id}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleThreadClick(t.thread_id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all text-sm ${
                  activeThreadId === t.thread_id
                    ? "bg-[#2d5a3d]/30 text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                {loadingThread === t.thread_id ? (
                  <Loader2
                    size={13}
                    className="flex-shrink-0 animate-spin text-[#2d5a3d]"
                  />
                ) : (
                  <FileText size={13} className="flex-shrink-0" />
                )}
                <span className="truncate">
                  {t.filename ?? t.document_name}
                </span>
              </motion.button>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2d5a3d] flex items-center justify-center text-white text-xs font-medium">
              {user?.username?.[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="text-sm text-white/60 truncate max-w-[130px]">
              {user?.username}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/30 hover:text-white/60 transition-colors"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ md) ────────────────────── */}
      <div className="hidden md:flex w-[260px] flex-shrink-0 h-screen">
        <SidebarContent />
      </div>

      {/* ── Mobile hamburger button ───────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-9 h-9 flex items-center justify-center rounded-xl bg-[#0f0e0c] border border-white/10 text-white/70 hover:text-white transition-colors shadow-lg"
        aria-label="Open sidebar"
      >
        <Menu size={16} />
      </button>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            {/* Drawer panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 z-50 w-[280px] h-screen"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}