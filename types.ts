
export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  isStreaming?: boolean;
  groundingChunks?: any[];
  thinking?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  isPro: boolean;
  avatar: string;
}

export enum AppMode {
  Standard = 'standard',
  Pro = 'pro'
}

export interface GenerationOptions {
  aspectRatio?: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
  imageSize?: "1K" | "2K" | "4K";
  useSearch?: boolean;
  useMaps?: boolean;
  useThinking?: boolean;
  thinkingBudget?: number;
  customSystemInstruction?: string;
  fileData?: {
    data: string;
    mimeType: string;
  };
}
