"use client";

import { Button } from "@/components/ui/button";
import {
  CurrencyEuroIcon,
  HomeIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useRouter } from "next/navigation";
import { formatPrice } from '@/utils/formatting';
import { useMessages, useSendMessage, useCreateConversation, type MessageWithSender } from '@/hooks/useChat';
import { useGetConversation } from '@/hooks/useConversations';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types defined for API response structure - unused in current implementation
// type ConversationWithRelations = conversations & {
//   box?: boxes | null;
//   stable: stables & {
//     owner?: users | null;
//   };
//   rider: users;
//   messages: MessageWithSender[];
//   _count: { messages: number };
// };

interface DraftEntity {
  type: string;
  id: string;
  name: string;
  ownerId?: string;
}

interface MessageThreadProps {
  conversationId?: string;
  currentUserId: string;
  onNewMessage: () => void;
  draftEntity?: DraftEntity;
}

export default function MessageThread({
  conversationId,
  currentUserId,
  onNewMessage,
  draftEntity,
}: MessageThreadProps) {
  const { user } = useSupabaseUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use TanStack Query hooks
  const messagesQuery = useMessages(conversationId);
  const messages: MessageWithSender[] = useMemo(() => messagesQuery.data || [], [messagesQuery.data]);
  const loading = messagesQuery.isLoading;
  const chatError = messagesQuery.error as Error | null;
  
  const { data: conversation } = useGetConversation(conversationId);
  const sendMessageMutation = useSendMessage();
  const createConversationMutation = useCreateConversation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;
    if (sendMessageMutation.isPending || createConversationMutation.isPending) return;

    try {
      if (draftEntity) {
        // We're in draft mode - create conversation with initial message
        const conversationData: {
          stableId?: string;
          boxId?: string;
          serviceId?: string;
          partLoanHorseId?: string;
          horseSaleId?: string;
          initialMessage: string;
        } = {
          initialMessage: newMessage.trim(),
        };

        // Add the appropriate entity ID based on type
        switch (draftEntity.type) {
          case "stable":
            conversationData.stableId = draftEntity.id;
            break;
          case "box":
            conversationData.boxId = draftEntity.id;
            break;
          case "service":
            conversationData.serviceId = draftEntity.id;
            break;
          case "partLoanHorse":
            conversationData.partLoanHorseId = draftEntity.id;
            break;
          case "horseSale":
            conversationData.horseSaleId = draftEntity.id;
            break;
        }

        const newConversation = await createConversationMutation.mutateAsync(conversationData);
        setNewMessage("");
        
        // Invalidate conversations cache to ensure fresh data
        await queryClient.invalidateQueries({ queryKey: ['conversations'] });
        
        // Redirect to the new conversation
        if (newConversation?.id) {
          router.push(`/meldinger?conversation=${newConversation.id}`);
        } else {
          onNewMessage(); // Fallback to normal redirect
        }
        
        toast.success("Samtale opprettet!");
      } else {
        // Normal message sending
        await sendMessageMutation.mutateAsync({
          conversationId: conversationId!,
          senderId: user.id,
          content: newMessage.trim(),
          messageType: 'TEXT'
        });
        setNewMessage("");
        onNewMessage();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error("Kunne ikke sende melding. Prøv igjen.");
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };



  const isStableOwner = conversation && conversation.stable?.ownerId === currentUserId;

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
          <p className="text-red-600 mb-2">Error loading messages: {chatError?.message || 'Unknown error'}</p>
          <Button variant="outline" onClick={() => messagesQuery.refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      {(conversation || draftEntity) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              {draftEntity ? (
                // Draft mode header
                <>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {draftEntity.name}
                  </h2>
                  <div className="flex items-center text-sm text-gray-600">
                    <HomeIcon className="h-4 w-4 mr-1" />
                    <span>
                      {draftEntity.type === "stable" && "Stall"}
                      {draftEntity.type === "box" && "Stallboks"}
                      {draftEntity.type === "service" && "Tjeneste"}
                      {draftEntity.type === "partLoanHorse" && "Fôrhest"}
                      {draftEntity.type === "horseSale" && "Hest til salgs"}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-blue-600 mt-1">
                    <span className="font-medium">Ny samtale</span>
                  </div>
                </>
              ) : (
                // Normal conversation header
                <>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isStableOwner ? (conversation.profile?.nickname || 'Bruker finnes ikke') : conversation.stable?.profiles?.nickname}
                  </h2>
                  <div className="flex items-center text-sm text-gray-600">
                    <HomeIcon className="h-4 w-4 mr-1" />
                    <span>
                      {conversation.stable?.name}
                      {conversation.box && ` • ${conversation.box.name}`}
                    </span>
                  </div>
                  {conversation.box && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <CurrencyEuroIcon className="h-4 w-4 mr-1" />
                      <span>{formatPrice(conversation.box.price)}/måned</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUserId;
          // Detect system messages by content pattern (emoji prefixes for status updates)
          const isSystemMessage: boolean = /^(📦|✅|🏠)/.test(message.content);

          if (isSystemMessage) {
            return (
              <div key={message.id} className="flex justify-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-md text-center">
                  <p className="text-blue-800 text-sm">{message.content}</p>
                  <p className="text-blue-600 text-xs mt-1">
                    {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), {
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
                  {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), {
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
            variant="default"
            onClick={sendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="px-4"
          >
            {sendMessageMutation.isPending ? (
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
