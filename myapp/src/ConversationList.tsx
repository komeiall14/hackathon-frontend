import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from "firebase/auth";
import toast from 'react-hot-toast';
import { ConversationListItem, ConversationSummary } from './ConversationListItem';
import './ConversationList.css'; // 次に作成するCSS

interface ConversationListProps {
  loginUser: FirebaseUser | null;
  selectedConversationId?: string;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const ConversationList: React.FC<ConversationListProps> = ({ loginUser, selectedConversationId }) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loginUser) return;

    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const token = await loginUser.getIdToken();
        const response = await fetch(`${BACKEND_API_URL}/api/conversations`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('会話一覧の取得に失敗しました。');
        const data = await response.json();
        setConversations(data || []);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversations();
  }, [loginUser]);

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <div className="conversation-list-container">
      {conversations.length > 0 ? (
        conversations.map(conv => (
          <ConversationListItem 
            key={conv.conversation_id} 
            conversation={conv}
            isSelected={conv.conversation_id === selectedConversationId}
          />
        ))
      ) : (
        <div style={{padding: '20px', textAlign: 'center'}}>会話がありません。</div>
      )}
    </div>
  );
};