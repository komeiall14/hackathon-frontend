// src/SpacePage.tsx (完全版)

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { PageHeader } from './PageHeader';
import './SpacePage.css';
import toast from 'react-hot-toast';
import { UserAvatar } from './UserAvatar';

// --- 型定義 ---
interface AppContextType {
    loginUser: FirebaseUser | null;
    activeHostIds: Set<string>; // activeHostIdsをcontextから受け取る
  }
  

type UserRole = 'host' | 'speaker' | 'listener';

interface Participant {
  user_id: string;
  user_name: string;
  role: UserRole;
  profile_image_url?: string; // アイコン表示用に追加
}

interface SpaceDetails {
    id: string;
    host_id: string;
    host_name: string;
    topic: string;
    // ★★★ 変更点: バックエンドから初期参加者リストを受け取る ★★★
    participants: Participant[]; 
}

interface ServerMessage {
  type: 'message' | 'user_joined' | 'user_left' | 'role_updated' | 'space_end';
  content: any;
  user_name?: string;
  user_id?: string;
}

const getWebSocketURL = (spaceId: string, token: string) => {
  const url = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
  const wsUrl = url.replace(/^http/, 'ws');
  return `${wsUrl}/api/spaces/ws/${spaceId}?token=${token}`;
};

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const SpacePage: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { loginUser, activeHostIds } = useOutletContext<AppContextType>();
  const navigate = useNavigate();

  const [spaceDetails, setSpaceDetails] = useState<SpaceDetails | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const webSocket = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ★★★ 変更点: 重複接続防止フラグ ★★★
  const didConnect = useRef(false);

  // ログインユーザーの役割と発言権限をメモ化
  const currentUserRole = useMemo(() => 
    participants.find(p => p.user_id === loginUser?.uid)?.role
  , [participants, loginUser]);

  const canSpeak = currentUserRole === 'host' || currentUserRole === 'speaker';

  useEffect(() => {
    if (!loginUser || !spaceId) return;
    
    // ★★★ 変更点: 重複接続防止ロジック ★★★
    if (didConnect.current) return;
    didConnect.current = true;

    const setupConnection = async () => {
      try {
        const token = await loginUser.getIdToken();
        const detailsResponse = await fetch(`${BACKEND_API_URL}/api/spaces/${spaceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!detailsResponse.ok) throw new Error("スペース情報が見つかりません。");
        
        const detailsData: SpaceDetails = await detailsResponse.json();
        setSpaceDetails(detailsData);
        setParticipants(detailsData.participants || []); // ★★★ バックエンドから取得した初期参加者リストを設定

        // 自分が参加者リストにいない場合のみ参加APIを叩く
        if (!detailsData.participants.some(p => p.user_id === loginUser.uid)) {
            const joinResponse = await fetch(`${BACKEND_API_URL}/api/spaces/join/${spaceId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!joinResponse.ok) throw new Error("スペースへの参加に失敗しました。");
        }

        const ws = new WebSocket(getWebSocketURL(spaceId, token));
        webSocket.current = ws;

        ws.onopen = () => { setIsConnected(true); };
        ws.onmessage = (event) => {
            const msg: ServerMessage = JSON.parse(event.data);
            
            // ★★★ 変更点: バックエンドからのメッセージに応じて状態を更新 ★★★
            switch (msg.type) {
                case 'user_joined':
                    const newParticipant = msg.content as Participant;
                    setParticipants(prev => {
                        // 既にリストに同じユーザーIDが存在する場合は、ステートを更新しない
                        if (prev.some(p => p.user_id === newParticipant.user_id)) {
                            return prev;
                        }
                        // 存在しない場合のみ、新しい参加者を追加する
                        return [...prev, newParticipant];
                    });
                    setMessages(prev => [...prev, { type: 'user_joined', content: `${newParticipant.user_name}が参加しました` }]);
                    break;
                case 'user_left':
                    setParticipants(prev => prev.filter(p => p.user_id !== msg.content.user_id));
                    setMessages(prev => [...prev, { type: 'user_left', content: `${msg.content.user_name}が退出しました` }]);
                    break;
                case 'role_updated':
                    toast.success(`${msg.content.user_name}が${msg.content.role}になりました。`);
                    setParticipants(prev => prev.map(p => p.user_id === msg.content.user_id ? { ...p, role: msg.content.role } : p));
                    break;
                case 'message':
                    setMessages(prev => [...prev, msg]);
                    break;
                case 'space_end':
                    toast.error("ホストがスペースを終了しました。");
                    setTimeout(() => navigate('/spaces'), 2000);
                    break;
            }
        };
        ws.onclose = () => setIsConnected(false);
        ws.onerror = () => {
            toast.error("接続エラーが発生しました。");
            navigate('/spaces');
        };

      } catch (err: any) {
        toast.error(err.message);
        navigate('/spaces');
      }
    };
    
    setupConnection();

    return () => {
      if (webSocket.current) {
        webSocket.current.close();
      }
    };
  }, [loginUser, spaceId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && canSpeak && webSocket.current?.readyState === WebSocket.OPEN) {
      const message = { type: 'message', content: input.trim() };
      webSocket.current.send(JSON.stringify(message));
      setInput('');
    }
  };

  const handleEndSpace = async () => {
    console.log("「スペースを終了」ボタンがクリックされました。");
    console.log("loginUser?.uid:", loginUser?.uid);
    console.log("spaceDetails?.host_id:", spaceDetails?.host_id);
    console.log("spaceId:", spaceId);

    if (!loginUser || !spaceId) {
      console.error("デバッグ: loginUserまたはspaceIdが存在しません。");
      return;
    }
    if (loginUser.uid !== spaceDetails?.host_id) {
      console.error("デバッグ: あなたはホストではありません。処理を中断します。");
      toast.error("ホストのみがスペースを終了できます。");
      return;
    }

    if (!window.confirm("本当にこのスペースを終了しますか？")) {
        console.log("デバッグ: ユーザーがキャンセルしました。");
        return;
    }
      
    try {
      console.log("デバッグ: APIリクエストを送信します...");
      const token = await loginUser.getIdToken();
      const response = await fetch(`${BACKEND_API_URL}/api/spaces/end/${spaceId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log("デバッグ: APIレスポンスステータス:", response.status);

      // APIからのレスポンスがOKでない場合のエラーハンドリングを強化
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`スペースの終了に失敗しました: ${errorText}`);
      }
      
      // 成功した場合、バックエンドからのWebSocketメッセージ('space_end')を待つ
      console.log("デバッグ: 終了リクエスト成功。バックエンドからの通知を待ちます。");

    } catch (err: any) {
      console.error("handleEndSpaceでエラーが発生しました:", err);
      toast.error(err.message);
    }
  };

  // ★★★ 追加: 役割変更をリクエストする関数 ★★★
  const handleChangeRole = (targetUserId: string, newRole: UserRole) => {
    if (webSocket.current?.readyState === WebSocket.OPEN) {
      webSocket.current.send(JSON.stringify({
        type: 'role_change',
        content: {
          target_user_id: targetUserId,
          new_role: newRole
        }
      }));
    }
  };

  const endSpaceButton = (spaceDetails && loginUser?.uid === spaceDetails.host_id) ? (
      <button onClick={handleEndSpace} className="space-end-button">
          スペースを終了
      </button>
  ) : undefined;

  return (
    <div className="space-page-container">
      <PageHeader title={spaceDetails?.topic || 'スペース'} actionElement={endSpaceButton} />
      
      <div className="space-main-content">
        {/* ★★★ 変更点: 参加者リストを表示するUI ★★★ */}
        <div className="space-participants-list">
            <h4>参加者 ({participants.length})</h4>
            <ul>
                {participants.map(p => (
                    <li key={p.user_id}>
                        <Link to={`/users/${p.user_id}`} className="participant-link">
                            <UserAvatar 
                                user={{
                                    firebase_uid: p.user_id,
                                    name: p.user_name,
                                    profile_image_url: p.profile_image_url
                                }} 
                                size={40} 
                                isHosting={activeHostIds.has(p.user_id)} 
                            />
                            <div className="participant-details">
                                <span className="participant-name">{p.user_name}</span>
                                <small className="participant-role">({p.role})</small>
                            </div>
                        </Link>
                        
                        {loginUser?.uid === spaceDetails?.host_id && p.user_id !== loginUser?.uid && (
                            <div className="participant-actions">
                                {p.role === 'listener' ? (
                                    <button onClick={(e) => { e.preventDefault(); handleChangeRole(p.user_id, 'speaker'); }} className="role-button promote">
                                        スピーカーにする
                                    </button>
                                ) : (
                                    <button onClick={(e) => { e.preventDefault(); handleChangeRole(p.user_id, 'listener'); }} className="role-button demote">
                                        リスナーにする
                                    </button>
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>

        <div className="space-chat-area">
            <div className="space-messages-list">
            {messages.map((msg, index) => {
                if (msg.type === 'message') {
                return (
                    <div key={index} className={`space-message ${msg.user_id === loginUser?.uid ? 'own' : 'other'}`}>
                    <div className="space-message-sender">{msg.user_name}</div>
                    <div className="space-message-bubble">{msg.content as string}</div>
                    </div>
                );
                }
                // user_joined / user_left などのシステムメッセージ
                return (
                <div key={index} className="system-message">
                    --- {msg.content as string} ---
                </div>
                );
            })}
            <div ref={messagesEndRef} />
            </div>
            
            {canSpeak && (
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
            )}
        </div>
      </div>
    </div>
  );
};