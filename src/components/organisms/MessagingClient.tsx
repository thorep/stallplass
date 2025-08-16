"use client";

import Button from "@/components/atoms/Button";
import ConversationList from "@/components/molecules/ConversationList";
import MessageThread from "@/components/molecules/MessageThread";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { ChatBubbleLeftRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useConversations } from "@/hooks/useChat";
import { useRealtimeConversations } from "@/hooks/useRealtimeConversations";

export default function MessagingClient() {
  const { user } = useSupabaseUser();
  const router = useRouter();
  const { data: conversations = [], isLoading: loading, error } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  // Enable realtime updates for conversations
  useRealtimeConversations(user?.id);


  // Auto-select the most recent conversation when conversations load
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversation) {
      // Sort conversations by updatedAt and select the most recent one
      const sortedConversations = [...conversations].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setSelectedConversation(sortedConversations[0].id);
    }
  }, [conversations, selectedConversation]);

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  const handleNewMessage = () => {
    // TanStack Query will automatically refresh conversations
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Laster meldinger...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
            <p className="text-red-600">{error?.message || 'En feil oppstod'}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
              Prøv igjen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-white">
      <div className="h-full flex border-t border-gray-200">
        {/* Mobile: Full-width conversation list when no conversation selected */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex-col`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Samtaler
              </h2>
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen samtaler ennå</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Start en samtale ved å kontakte en stalleier eller rytter.
                </p>
                <Button
                  variant="primary"
                  onClick={() => router.push("/sok")}
                  className="w-full"
                >
                  Finn stallplass
                </Button>
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                selectedConversation={selectedConversation}
                onConversationSelect={handleConversationSelect}
                currentUserId={user.id}
              />
            )}
          </div>
        </div>

        {/* Main Content - Message Thread */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {selectedConversation ? (
            <div className="flex flex-col h-full">
              {/* Mobile back button */}
              <div className="md:hidden p-4 border-b border-gray-200 bg-white">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="flex items-center text-gray-600 hover:text-gray-900 py-2 px-1 -ml-1 touch-manipulation"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">Tilbake til meldinger</span>
                </button>
              </div>
              
              <MessageThread
                conversationId={selectedConversation}
                currentUserId={user.id}
                onNewMessage={handleNewMessage}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Velg en samtale</h3>
                <p className="text-gray-600">Velg en samtale fra listen for å se meldinger.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}