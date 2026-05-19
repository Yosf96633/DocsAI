import { create } from "zustand";

export interface Source {
  document: string;
  page: number;
  position: string;
  chunk_index: number;
}

export interface Thread {
  thread_id: string;
  document_name: string;
  document_type: string;
  total_chunks: number;
  created_at: string;
}

export interface Message {
  id: string;
  role: "human" | "ai";
  content: string;
  sources?: Source[];
  streaming?: boolean;
}

interface ChatStore {
  threads: Thread[];
  activeThreadId: string | null;
  messages: Record<string, Message[]>;
  ingestionStatus: string[];
  isStreaming: boolean;

  setActiveThread: (id: string) => void;
  setThreads: (threads: Thread[]) => void;
  addThread: (thread: Thread) => void;
  setMessages: (threadId: string, messages: Message[]) => void;
  addMessage: (threadId: string, message: Message) => void;
  updateLastAiMessage: (threadId: string, update: Partial<Message>) => void;
  appendToken: (threadId: string, token: string) => void;
  addIngestionStatus: (message: string) => void;
  clearIngestionStatus: () => void;
  setStreaming: (v: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  threads: [],
  activeThreadId: null,
  messages: {},
  ingestionStatus: [],
  isStreaming: false,

  setActiveThread: (id) => set({ activeThreadId: id }),

  setThreads: (threads) => set({ threads }),

  addThread: (thread) =>
    set((s) => ({ threads: [thread, ...s.threads] })),

  setMessages: (threadId, messages) =>
    set((s) => ({
      messages: { ...s.messages, [threadId]: messages },
    })),

  addMessage: (threadId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [threadId]: [...(s.messages[threadId] ?? []), message],
      },
    })),

  updateLastAiMessage: (threadId, update) =>
    set((s) => {
      const msgs = [...(s.messages[threadId] ?? [])];
      const idx = msgs.map((m) => m.role).lastIndexOf("ai");
      if (idx === -1) return s;
      msgs[idx] = { ...msgs[idx], ...update };
      return { messages: { ...s.messages, [threadId]: msgs } };
    }),

  appendToken: (threadId, token) =>
    set((s) => {
      const msgs = [...(s.messages[threadId] ?? [])];
      const idx = msgs.map((m) => m.role).lastIndexOf("ai");
      if (idx === -1) return s;
      msgs[idx] = { ...msgs[idx], content: msgs[idx].content + token };
      return { messages: { ...s.messages, [threadId]: msgs } };
    }),

  addIngestionStatus: (message) =>
    set((s) => ({ ingestionStatus: [...s.ingestionStatus, message] })),

  clearIngestionStatus: () => set({ ingestionStatus: [] }),

  setStreaming: (v) => set({ isStreaming: v }),
}));