// src/SpaceLobby.tsx (診断ログを追加した最終版)

import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import toast from 'react-hot-toast';
import { PageHeader } from './PageHeader';
import './SpaceLobby.css'; 

interface AppContextType {
  loginUser: FirebaseUser | null;
}

interface SpaceInfo {
  id: string;
  host_name: string;
  topic: string;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const SpaceLobby: React.FC = () => {
  const { loginUser } = useOutletContext<AppContextType>();
  const navigate = useNavigate();
  const [activeSpaces, setActiveSpaces] = useState<SpaceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loginUser) return;
    
    const fetchSpaces = async () => {
      try {
        const token = await loginUser.getIdToken();
        const response = await fetch(`${BACKEND_API_URL}/api/spaces/active`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("アクティブなスペースの取得に失敗");
        const data = await response.json();
        setActiveSpaces(data || []);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSpaces();
  }, [loginUser]);

  const handleCreateSpace = async () => {
    if (!loginUser) return;
    
    const topic = prompt("スペースのトピックを入力してください（任意）:");
    
    try {
      console.log("1. handleCreateSpace: スペース作成APIを呼び出します...");
      const token = await loginUser.getIdToken();
      const response = await fetch(`${BACKEND_API_URL}/api/spaces/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topic: topic || '' }),
      });

      console.log("2. handleCreateSpace: APIレスポンスを受け取りました。ステータス:", response.status);

      if (!response.ok) {
        throw new Error("スペースの作成に失敗しました。ステータス: " + response.status);
      }

      const data = await response.json();
      console.log("3. handleCreateSpace: JSONレスポンスをパースしました。受信データ:", data);

      if (data && data.space_id) {
        
        console.log(`4. handleCreateSpace: 画面遷移を実行します。遷移先: /spaces/${data.space_id}`);
        navigate(`/spaces/${data.space_id}`);
      } else {
        console.error("5. handleCreateSpace: 受信データにspace_idが含まれていません。");
        throw new Error("サーバーから予期せぬ応答がありました。");
      }

    } catch (err: any) {
      console.error("!!! handleCreateSpaceでエラーが発生しました:", err);
      toast.error(err.message);
    }
  };

  const createSpaceButton = (
    <button onClick={handleCreateSpace} style={{fontWeight: 'bold'}}>
      スペースを開始
    </button>
  );

  return (
    <div>
      <PageHeader title="スペースを探す" actionElement={createSpaceButton} />
      <div className="space-lobby-container">
        {isLoading ? <p>読み込み中...</p> : (
          activeSpaces.length > 0 ? activeSpaces.map(space => (
            <div key={space.id} onClick={() => navigate(`/spaces/${space.id}`)} className="space-item">
              <div className="space-item-content">
                {/* ★★★ ここから変更 ★★★ */}
                <div className="space-topic-container">
                  <span className="live-indicator"></span>
                  <h4>{space.topic || 'フリートーク'}</h4>
                </div>
                {/* ★★★ ここまで変更 ★★★ */}
                <p>Host: {space.host_name}</p>
              </div>
            </div>
          )) : <p>現在、アクティブなスペースはありません。</p>
        )}
      </div>
    </div>
  );
};