import React from 'react';
import { Message } from './MessagesPage';
import './ChatMessage.css';

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  return (
    <div className={`message-container ${isOwnMessage ? 'own' : 'other'}`}>
      <div className="message-bubble">
        {message.content}
      </div>
    </div>
  );
};