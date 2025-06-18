// NewConversationModal.tsx (新規作成)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfileData } from './UserProfile';
import toast from 'react-hot-toast';
import './NewConversationModal.css'; // 次に作成するCSS

interface NewConversationModalProps {
  loginUser: FirebaseUser;
  onClose: () => void;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const NewConversationModal: React.FC<NewConversationModalProps> = ({ loginUser, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfileData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // 既存のユーザー検索APIを利用
      const response = await fetch(`${BACKEND_API_URL}/user?name=${encodeURIComponent(searchQuery.trim())}`);
      if (!response.ok) throw new Error('ユーザーの検索に失敗しました。');
      const data: UserProfileData[] = await response.json();
      setSearchResults(data.filter(user => user.firebase_uid !== loginUser.uid)); // 自分自身は除外
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = async (recipientId: string | null) => {
    if (!recipientId) return;

    try {
      const token = await loginUser.getIdToken();
      const response = await fetch(`${BACKEND_API_URL}/api/new-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ recipient_id: recipientId }),
      });
      if (!response.ok) throw new Error('会話の開始に失敗しました。');
      const data = await response.json();
      
      onClose(); // モーダルを閉じる
      navigate(`/messages/${data.conversation_id}`); // チャット画面に遷移
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>新しいメッセージ</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="ユーザーを検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" disabled={isSearching}>
              {isSearching ? '検索中...' : '検索'}
            </button>
          </form>
          <div className="search-results">
            {searchResults.map(user => (
              <div key={user.id} className="user-result-item" onClick={() => handleUserSelect(user.firebase_uid)}>
                <img src={user.profile_image_url || '/default-avatar.png'} alt={user.name} />
                <span>{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};