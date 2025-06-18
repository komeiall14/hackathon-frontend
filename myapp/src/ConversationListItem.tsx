import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfileData } from './UserProfile';
import { Message } from './MessagesPage'; // 次のステップで作成します

// このコンポーネントが受け取るプロパティの型
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
      <img 
        src={conversation.other_user.profile_image_url || '/default-avatar.png'} 
        alt={conversation.other_user.name} 
        className="conversation-avatar"
      />
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