// src/NotificationsPage.tsx （新規作成）

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import toast from 'react-hot-toast';
import { UserProfileData } from './UserProfile';
import { NotificationItem } from './NotificationItem';
import './NotificationsPage.css';
import { PageHeader } from './PageHeader'; // ★ インポートを追加

// NotificationResponseの型定義
export interface NotificationResponse {
  id: string;
  type: 'like' | 'reply' | 'follow';
  actor: UserProfileData;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface AppContextType {
  loginUser: FirebaseUser | null;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const NotificationsPage: React.FC = () => {
  const { loginUser } = useOutletContext<AppContextType>();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loginUser) {
        setIsLoading(false);
        return;
    };

    const fetchAndReadNotifications = async () => {
      setIsLoading(true);
      try {
        const token = await loginUser.getIdToken();
        const response = await fetch(`${BACKEND_API_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('通知の取得に失敗');
        const data = await response.json();
        setNotifications(data || []);

        // 取得後、既読にするAPIを叩く
        await fetch(`${BACKEND_API_URL}/api/notifications/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });

      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAndReadNotifications();
  }, [loginUser]);

  return (
    <div>
      <PageHeader title="通知" />
      <div className="notifications-container">
        {isLoading ? (
          <p>読み込み中...</p>
        ) : notifications.length > 0 ? (
          notifications.map(n => <NotificationItem key={n.id} notification={n} />)
        ) : (
          <p>新しい通知はありません。</p>
        )}
      </div>
    </div>
  );
};