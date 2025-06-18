// src/ChatWindow.tsx （完成版）

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { Message } from './MessagesPage';
import { ChatMessage } from './ChatMessage';
import toast from 'react-hot-toast';
import './ChatWindow.css';
import { FaPaperPlane } from 'react-icons/fa'; // 送信アイコン

// 親コンポーネントから渡されるcontextの型
interface AppContextType {
  loginUser: FirebaseUser | null;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const ChatWindow: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { loginUser } = useOutletContext<AppContextType>();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // メッセージリストの最下部にスクロールする関数
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // メッセージ履歴を取得する関数
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !loginUser) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    try {
      const token = await loginUser.getIdToken();
      const response = await fetch(`${BACKEND_API_URL}/api/conversations/${conversationId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('メッセージの取得に失敗しました。');
      const data = await response.json();
      setMessages(data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, loginUser]);

  // conversationIdが変わるたびにメッセージを取得
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // メッセージが更新されたら一番下にスクロール
  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading]);
  
  // テキストエリアの高さ自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // 一旦高さをリセット
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessageContent]);

  // 新しいメッセージを送信する関数
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageContent.trim() || !loginUser || !conversationId) return;

    setIsSending(true);
    const contentToSend = newMessageContent;
    setNewMessageContent(''); // UIの反応を良くするため、送信前に即時クリア

    try {
      const token = await loginUser.getIdToken();
      const response = await fetch(`${BACKEND_API_URL}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: contentToSend }),
      });

      if (!response.ok) {
        throw new Error('メッセージの送信に失敗しました。');
      }
      const sentMessage: Message = await response.json();
      
      // UIをリアルタイムで更新
      setMessages(prevMessages => [...prevMessages, sentMessage]);

    } catch (err: any) {
      toast.error(err.message);
      setNewMessageContent(contentToSend); // エラー時は入力内容を復元
    } finally {
      setIsSending(false);
    }
  };

  // 会話が選択されていない場合の表示
  if (!conversationId) {
    return (
        <div className="chat-window-info">
            <p>会話を選択してください</p>
        </div>
    );
  }

  // 読み込み中の表示
  if (isLoading) return <div className="chat-window-info">読み込み中...</div>;

  return (
    <div className="chat-window-container">
      <div className="messages-list">
        {/* メッセージが0件の場合の案内表示 */}
        {messages.length === 0 && !isLoading && (
          <div className="no-messages-info">
            <p>まだメッセージはありません。</p>
            <p>最初のメッセージを送信して会話を始めましょう。</p>
          </div>
        )}
        {/* メッセージリストの表示 */}
        {messages.map(msg => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            isOwnMessage={msg.sender_id === loginUser?.uid} 
          />
        ))}
        {/* 自動スクロール用の終端要素 */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* メッセージ入力フォーム */}
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <textarea
          ref={textareaRef}
          value={newMessageContent}
          onChange={(e) => setNewMessageContent(e.target.value)}
          placeholder="新しいメッセージを送信"
          disabled={isSending}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />
        <button type="submit" disabled={isSending || !newMessageContent.trim()}>
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};