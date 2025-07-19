export interface Conversation {
  id: string;
  riderId: string;
  stableId: string;
  boxId?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'RENTAL_CONFIRMED';
  createdAt: string;
  updatedAt: string;
  rider: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  stable: {
    id: string;
    name: string;
    ownerName: string;
    ownerEmail: string;
    ownerId: string;
  };
  box?: {
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
  };
  messages: Array<{
    id: string;
    content: string;
    messageType: string;
    createdAt: string;
    isRead: boolean;
  }>;
  rental?: {
    id: string;
    status: string;
    startDate: string;
    endDate?: string;
  };
  _count: {
    messages: number;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'SYSTEM' | 'RENTAL_REQUEST' | 'RENTAL_CONFIRMED';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Rental {
  id: string;
  conversationId: string;
  riderId: string;
  stableId: string;
  boxId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  monthlyRate: number;
  createdAt: string;
  updatedAt: string;
}