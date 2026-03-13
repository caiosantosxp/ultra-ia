import { create } from 'zustand';

export interface Message {
  id: string;
  conversationId?: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  createdAt: Date;
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  currentConversationId: string | null;
  addMessage: (message: Message) => void;
  appendStreamToken: (token: string) => void;
  finalizeStreamingMessage: () => void;
  setStreaming: (status: boolean) => void;
  setConversation: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  initializeConversation: (conversationId: string, messages: Message[]) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  currentConversationId: null,
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  appendStreamToken: (token) => set((state) => ({
    streamingContent: state.streamingContent + token,
  })),
  finalizeStreamingMessage: () => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: crypto.randomUUID(),
        role: 'ASSISTANT' as const,
        content: state.streamingContent,
        createdAt: new Date(),
      },
    ],
    streamingContent: '',
    isStreaming: false,
  })),
  setStreaming: (status) => set({ isStreaming: status }),
  setConversation: (id) => set({ currentConversationId: id }),
  setMessages: (messages) => set({ messages }),
  initializeConversation: (conversationId, messages) =>
    set({ currentConversationId: conversationId, messages }),
  reset: () => set({ messages: [], isStreaming: false, streamingContent: '', currentConversationId: null }),
}));
