import { conversations, messages, $Enums } from '@/generated/prisma';

// Base Prisma types
export type Conversation = conversations;
export type Message = messages;

// Message with sender information
export type MessageWithSender = Message & {
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
};

// Extended types for API responses with relations
export type ConversationWithRelations = Conversation & {
  rider: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  stable: {
    id: string;
    name: string;
    ownerId: string;
    owner: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  box?: {
    id: string;
    name: string;
    price: number;
    isAvailable: boolean | null;
  };
  messages: Array<{
    id: string;
    content: string;
    messageType: $Enums.MessageType | null;
    createdAt: string | null;
    isRead: boolean | null;
  }>;
  _count?: {
    messages: number;
  };
};