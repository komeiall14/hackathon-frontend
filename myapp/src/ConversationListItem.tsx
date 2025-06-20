// src/ConversationListItem.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfileData } from './UserProfile';
import { Message } from './MessagesPage';
// ▼▼▼ 修正箇所 ▼▼▼
import { InitialAvatar } from './InitialAvatar';
// ▲▲▲ 修正ここまで ▲▲▲


export interface ConversationSummary {
  conversation_id: string;
  other_user: UserProfileData;
  last_message: Message | null;
  updated_at: string;
}

interface ConversationListItemProps {
  conversation: ConversationSummary;
  isSelected: boolean;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({ conversation, isSelected }) => {
  const navigate = useNavigate();

  return (
    <div 
      className={`conversation-list-item ${isSelected ? 'selected' : ''}`}
      onClick={() => navigate(`/messages/${conversation.conversation_id}`)}
    >
      {/* ▼▼▼ 修正箇所 ▼▼▼ */}
      <div className="conversation-avatar">
        {conversation.other_user.profile_image_url && conversation.other_user.profile_image_url.startsWith('http') ? (
          <img 
            src={conversation.other_user.profile_image_url} 
            alt={conversation.other_user.name}
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
          />
        ) : (
          <InitialAvatar name={conversation.other_user.name} size={48} />
        )}
      </div>
      {/* ▲▲▲ 修正ここまで ▲▲▲ */}
      <div className="conversation-details">
        <div className="conversation-header">
          <span className="conversation-user-name">{conversation.other_user.name}</span>
          <span className="conversation-timestamp">{new Date(conversation.updated_at).toLocaleDateString()}</span>
        </div>
        <p className="conversation-last-message">
          {conversation.last_message ? conversation.last_message.content : 'まだメッセージはありません'}
        </p>
      </div>
    </div>
  );
};