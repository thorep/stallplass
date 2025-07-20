"use client";

import Button from "@/components/atoms/Button";
import {
  CheckCircleIcon,
  CurrencyEuroIcon,
  HomeIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/supabase-auth-context";
import { formatPrice } from '@/utils/formatting';
import { useRealTimeChat } from '@/hooks/useRealTimeChat';
import { Tables } from '@/types/supabase';

// Use Supabase types as foundation and extend for relations
type ConversationWithRelations = Tables<'conversations'> & {
  box?: Tables<'boxes'>;
  stable: Tables<'stables'>;
  rider: Tables<'users'>;
  rental?: Tables<'rentals'>;
  messages: Tables<'messages'>[];
  _count: { messages: number };
};

interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
  onNewMessage: () => void;
  onRentalConfirmation: () => void;
}

export default function MessageThread({
  conversationId,
  currentUserId,
  onNewMessage,
  onRentalConfirmation,
}: MessageThreadProps) {
  const { user, getIdToken } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [showRentalConfirm, setShowRentalConfirm] = useState(false);
  const [conversation, setConversation] = useState<ConversationWithRelations | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use real-time chat hook
  const {
    messages,
    isLoading: loading,
    error: chatError,
    isSending: sending,
    sendMessage: sendRealTimeMessage,
    clearError
  } = useRealTimeChat({
    conversationId,
    currentUserId,
    autoMarkAsRead: true
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversationDetails = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = await getIdToken();
      const response = await fetch(`/api/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const conversations = await response.json();
        const conv = conversations.find((c: { id: string }) => c.id === conversationId);
        setConversation(conv);
      }
    } catch (error) {
      console.error("Error fetching conversation details:", error);
    }
  }, [conversationId, user, getIdToken]);

  useEffect(() => {
    if (conversationId) {
      fetchConversationDetails();
    }
  }, [conversationId, fetchConversationDetails]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      await sendRealTimeMessage(newMessage.trim());
      setNewMessage("");
      onNewMessage();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const confirmRental = async () => {
    if (!conversation?.box || !user) return;

    try {
      const token = await getIdToken();
      const response = await fetch(`/api/conversations/${conversationId}/confirm-rental`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: new Date().toISOString(),
          monthlyPrice: conversation.box.price,
        }),
      });

      if (response.ok) {
        setShowRentalConfirm(false);
        fetchConversationDetails();
        onRentalConfirmation();
      } else {
        const error = await response.json();
        alert(error.error || "Kunne ikke bekrefte leieforhold");
      }
    } catch (error) {
      console.error("Error confirming rental:", error);
      alert("Feil ved bekreftelse av leieforhold");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };


  const isStableOwner = conversation && conversation.stable.owner_id === currentUserId;
  const canConfirmRental =
    conversation && conversation.box && conversation.status === "ACTIVE" && !conversation.rental;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (chatError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600 mb-2">Error loading messages: {chatError}</p>
          <Button variant="outline" onClick={clearError}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      {conversation && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isStableOwner ? conversation.rider.name : conversation.stable.owner_name}
              </h2>
              <div className="flex items-center text-sm text-gray-600">
                <HomeIcon className="h-4 w-4 mr-1" />
                <span>
                  {conversation.stable.name}
                  {conversation.box && ` • ${conversation.box.name}`}
                </span>
              </div>
              {conversation.box && (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <CurrencyEuroIcon className="h-4 w-4 mr-1" />
                  <span>{formatPrice(conversation.box.price)}/måned</span>
                </div>
              )}
            </div>

            {/* Rental Status */}
            {conversation.rental && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✅ Utleid
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId;
          const isSystemMessage =
            message.message_type === "SYSTEM" || message.message_type === "RENTAL_CONFIRMATION";

          if (isSystemMessage) {
            return (
              <div key={message.id} className="flex justify-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-md text-center">
                  <p className="text-blue-800 text-sm">{message.content}</p>
                  <p className="text-blue-600 text-xs mt-1">
                    {message.created_at ? formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: nb,
                    }) : 'Ukjent tid'}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                  {message.created_at ? formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                    locale: nb,
                  }) : 'Ukjent tid'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Rental Confirmation Section */}
      {canConfirmRental && (
        <div className="px-6 py-4 bg-amber-50 border-t border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-amber-900">
                {isStableOwner ? "Bekreft utleie" : "Bekreft leieforhold"}
              </h4>
              <p className="text-sm text-amber-700">
                {isStableOwner
                  ? "Marker boksen som utleid til denne rytteren"
                  : "Bekreft at du har leid denne boksen"}
              </p>
            </div>
            {!showRentalConfirm ? (
              <Button variant="primary" size="sm" onClick={() => setShowRentalConfirm(true)}>
                {isStableOwner ? "Jeg har leid ut boksen" : "Jeg har leid boksen"}
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setShowRentalConfirm(false)}>
                  <XMarkIcon className="h-4 w-4" />
                </Button>
                <Button variant="primary" size="sm" onClick={confirmRental}>
                  <CheckCircleIcon className="h-4 w-4" />
                  Bekreft
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Skriv en melding..."
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>
          <Button
            variant="primary"
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <PaperAirplaneIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
