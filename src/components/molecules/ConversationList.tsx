"use client";

import { ConversationWithDetails as Conversation } from "@/services/chat-service";
import { formatPrice } from "@/utils/formatting";
import { BuildingOfficeIcon, HomeIcon, UserIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import Image from "next/image";

interface DraftConversation {
  type: string;
  id: string;
  name: string;
  ownerId?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onConversationSelect: (conversationId: string) => void;
  currentUserId: string;
  draftConversation?: DraftConversation | null;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onConversationSelect,
  currentUserId,
  draftConversation,
}: ConversationListProps) {
  const getLastMessagePreview = (conversation: Conversation) => {
    if (conversation.messages.length === 0) return "Ingen meldinger ennå";

    const lastMessage = conversation.messages[0];
    // Check for system messages by content pattern (emoji prefixes)
    if (/^(📦|✅|🏠)/.test(lastMessage.content)) {
      return "🏠 Systemmelding";
    }

    return lastMessage.content.length > 50
      ? `${lastMessage.content.substring(0, 50)}...`
      : lastMessage.content;
  };

  const isStableOwner = (conversation: Conversation) => {
    return conversation.stable?.ownerId === currentUserId;
  };

  const getConversationPartner = (conversation: Conversation) => {
    if (isStableOwner(conversation)) {
      return {
        name: conversation.profile?.nickname,
        avatar: conversation.profile?.avatar,
        type: "rider" as const,
      };
    } else {
      return {
        name: conversation.stable?.profiles?.nickname || "Stalleier",
        avatar: conversation.stable?.profiles?.avatar || null,
        type: "owner" as const,
      };
    }
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case "stable": return "Stall";
      case "box": return "Stallboks";
      case "service": return "Tjeneste";
      case "partLoanHorse": return "Fôrhest";
      case "horseSale": return "Hest til salgs";
      default: return "";
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {/* Draft conversation if in compose mode */}
      {draftConversation && (
        <div
          key="draft"
          onClick={() => onConversationSelect('draft')}
          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedConversation === 'draft'
              ? "bg-blue-50 border-r-2 border-blue-500"
              : ""
          }`}
        >
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-gray-500" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {draftConversation.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    • {getEntityTypeLabel(draftConversation.type)}
                  </span>
                </div>
              </div>

              {/* Last Message */}
              <p className="text-sm text-gray-500 truncate mb-2 italic">
                Skriv en melding...
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Ny samtale
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Nå
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing conversations */}
      {conversations.map((conversation) => {
        const partner = getConversationPartner(conversation);
        const hasUnreadMessages = (conversation._count?.messages || 0) > 0;
        const lastMessageTime =
          conversation.messages.length > 0
            ? new Date(conversation.messages[0].createdAt || "")
            : new Date(conversation.updatedAt || "");

        return (
          <div
            key={conversation.id}
            onClick={() => onConversationSelect(conversation.id)}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedConversation === conversation.id
                ? "bg-blue-50 border-r-2 border-blue-500"
                : ""
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {partner.avatar ? (
                  <Image
                    src={partner.avatar}
                    alt={partner.name || "User"}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {partner.type === "rider" ? (
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-medium truncate ${
                      hasUnreadMessages ? "text-gray-900" : "text-gray-700"
                    }`}
                  >
                    {partner.name || "Ukjent bruker"}
                  </h4>
                  {hasUnreadMessages && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Stable/Box Info */}
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <HomeIcon className="h-3 w-3 mr-1" />
                  <span className="truncate">
                    {conversation.stable?.name}
                    {conversation.box && ` • ${conversation.box.name}`}
                  </span>
                </div>

                {/* Price if box */}
                {conversation.box && (
                  <div className="text-xs text-gray-600 mb-1">
                    {formatPrice(conversation.box.price)}/måned
                  </div>
                )}

                {/* Last Message */}
                <p
                  className={`text-sm truncate mb-2 ${
                    hasUnreadMessages ? "font-medium text-gray-900" : "text-gray-600"
                  }`}
                >
                  {getLastMessagePreview(conversation)}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* Show archived status only if conversation is archived */}
                    {conversation.status === "ARCHIVED" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Arkivert
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(lastMessageTime, {
                      addSuffix: true,
                      locale: nb,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
