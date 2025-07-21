'use client';

import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  BuildingOfficeIcon,
  UserIcon,
  CheckCircleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { ConversationWithRelations as Conversation } from '@/types/conversations';
import { formatPrice } from '@/utils/formatting';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onConversationSelect: (conversationId: string) => void;
  currentUserId: string;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onConversationSelect,
  currentUserId
}: ConversationListProps) {

  const getLastMessagePreview = (conversation: Conversation) => {
    if (conversation.messages.length === 0) return 'Ingen meldinger ennå';
    
    const lastMessage = conversation.messages[0];
    if (lastMessage.message_type === 'RENTAL_CONFIRMATION') {
      return '✅ Leieforhold bekreftet';
    }
    if (lastMessage.message_type === 'SYSTEM') {
      return '🏠 Systemmelding';
    }
    
    return lastMessage.content.length > 50 
      ? `${lastMessage.content.substring(0, 50)}...` 
      : lastMessage.content;
  };

  const isStableOwner = (conversation: Conversation) => {
    return conversation.stable.eier_id === currentUserId;
  };

  const getConversationPartner = (conversation: Conversation) => {
    if (isStableOwner(conversation)) {
      return {
        name: conversation.rider.name,
        email: conversation.rider.email,
        avatar: conversation.rider.avatar,
        type: 'rider' as const
      };
    } else {
      return {
        name: conversation.stable.eier_navn,
        email: conversation.stable.owner_email,
        avatar: null,
        type: 'owner' as const
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RENTAL_CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RENTAL_CONFIRMED':
        return 'Utleid';
      case 'ARCHIVED':
        return 'Arkivert';
      default:
        return 'Aktiv';
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        const partner = getConversationPartner(conversation);
        const hasUnreadMessages = (conversation._count?.messages || 0) > 0;
        const lastMessageTime = conversation.messages.length > 0 
          ? new Date(conversation.messages[0].opprettet_dato || '')
          : new Date(conversation.oppdatert_dato || '');

        return (
          <div
            key={conversation.id}
            onClick={() => onConversationSelect(conversation.id)}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedConversation === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {partner.avatar ? (
                  <Image
                    src={partner.avatar}
                    alt={partner.name || 'User'}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {partner.type === 'rider' ? (
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
                  <h4 className={`text-sm font-medium truncate ${
                    hasUnreadMessages ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {partner.name || 'Ukjent bruker'}
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
                    {conversation.stable.name}
                    {conversation.box && ` • ${conversation.box.name}`}
                  </span>
                </div>

                {/* Price if box */}
                {conversation.box && (
                  <div className="text-xs text-gray-600 mb-1">
                    {formatPrice(conversation.box.maanedlig_pris)}/måned
                  </div>
                )}

                {/* Last Message */}
                <p className={`text-sm truncate mb-2 ${
                  hasUnreadMessages ? 'font-medium text-gray-900' : 'text-gray-600'
                }`}>
                  {getLastMessagePreview(conversation)}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status || 'ACTIVE')}`}>
                      {conversation.status === 'RENTAL_CONFIRMED' && (
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                      )}
                      {getStatusText(conversation.status || 'ACTIVE')}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(lastMessageTime, { 
                      addSuffix: true, 
                      locale: nb 
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