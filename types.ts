
export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'video' | 'chart';
  mediaUrl?: string;
  isStreaming?: boolean;
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
