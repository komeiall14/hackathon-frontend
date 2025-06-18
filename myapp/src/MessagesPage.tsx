// MessagesPage.tsx をこの内容で更新

import React, { useState } from 'react'; // useStateを追加
import { Outlet, useOutletContext } from 'react-router-dom';
import { User as FirebaseUser } from "firebase/auth";
import { ConversationList } from './ConversationList';
import './Messages.css';
import { NewConversationModal } from './NewConversationModal'; // ★ インポートを追加
import { FaEnvelopeOpenText } from "react-icons/fa"; // ★ アイコンをインポート
import { PageHeader } from './PageHeader'; 

interface AppContextType {
  loginUser: FirebaseUser | null;
}
export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
  }

export const MessagesPage: React.FC = () => {
  const { loginUser } = useOutletContext<AppContextType>();
  const [isModalOpen, setIsModalOpen] = useState(false); // ★ モーダルの表示状態を管理

  const newMessageButton = (
    <button 
      onClick={() => setIsModalOpen(true)} 
      title="新しいメッセージ"
      style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
    >
      <FaEnvelopeOpenText />
    </button>
  );

  return (
    <>
      <div className="messages-page-container">
        <div className="messages-sidebar">
          <PageHeader title="メッセージ" actionElement={newMessageButton} />
          <ConversationList loginUser={loginUser} />
        </div>
        <div className="messages-content">
            <Outlet context={{ loginUser }} />
        </div>
      </div>
      
      {/* ★ ここを追加 */}
      {isModalOpen && loginUser && (
        <NewConversationModal 
          loginUser={loginUser} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
};