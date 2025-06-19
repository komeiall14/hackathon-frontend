import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { PageHeader } from './PageHeader';
import './SpacePage.css'; // 次に作成します

// App.tsxから渡されるcontextの型
interface AppContextType {
  loginUser: FirebaseUser | null;
}

// サーバーから送られてくるメッセージの型
interface ServerMessage {
  type: 'message' | 'user_join' | 'user_leave';
  content: string;
  user_name: string;
  user_id: string;
}

const getWebSocketURL = (token: string) => {
  const url = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
  // http -> ws, https -> wss
  const wsUrl = url.replace(/^http/, 'ws');
  return `${wsUrl}/api/space/ws?token=${token}`;
};

export const SpacePage: React.FC = () => {
  const { loginUser } = useOutletContext<AppContextType>();
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const webSocket = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

// 既存のuseEffectをこの内容に置き換えてください

useEffect(() => {
    // ログインしていない場合は何もしない
    if (!loginUser) {
      setIsConnected(false);
      return;
    }

    // ▼▼▼ この行を追加 ▼▼▼
    let ws: WebSocket | null = null; // このeffectスコープ専用の変数として宣言

    // 認証トークンを取得してWebSocketに接続
    loginUser.getIdToken().then(token => {
      // ▼▼▼ このeffectスコープ内のws変数に代入 ▼▼▼
      ws = new WebSocket(getWebSocketURL(token));
      webSocket.current = ws; // 送信処理などで使うためにrefにも保持する

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const message: ServerMessage = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    });

    // ▼▼▼ クリーンアップ関数を修正 ▼▼▼
    // コンポーネントがアンマウントされるときに接続を閉じる
    return () => {
      // このeffectスコープで作成されたwsインスタンスがあれば閉じる
      if (ws) {
        ws.close();
        console.log('WebSocket connection closed by cleanup.');
      }
    };
  }, [loginUser]);

  // メッセージが追加されるたびに一番下にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'message',
        content: input.trim(),
      };
      webSocket.current.send(JSON.stringify(message));
      setInput('');
    }
  };

  return (
    <div className="space-page-container">
      <PageHeader title="スペース" />
      <div className="space-chat-window">
        <div className="space-messages-list">
          {messages.map((msg, index) => (
            <div key={index} className={`space-message ${msg.user_id === loginUser?.uid ? 'own' : 'other'}`}>
              <div className="space-message-sender">{msg.user_name}</div>
              <div className="space-message-bubble">{msg.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="space-message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isConnected ? "メッセージを入力..." : "接続中..."}
            disabled={!isConnected}
          />
          <button type="submit" disabled={!isConnected || !input.trim()}>送信</button>
        </form>
      </div>
    </div>
  );
};