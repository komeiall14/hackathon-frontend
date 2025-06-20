import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { fireAuth } from './firebase';
import { UserList } from './UserList';
import { UserProfileData } from './UserProfile';
import toast from 'react-hot-toast';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const FollowingPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loginUser, setLoginUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // このページの初回表示時のみ実行

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, setLoginUser);
    return () => unsubscribe();
  }, []);

  const fetchData = useCallback(async (currentUser: FirebaseUser | null) => {
    if (!userId) return;
    setIsLoading(true);
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/users/${userId}/following`, { headers });
      if (!response.ok) throw new Error('フォロー中のユーザー取得に失敗しました。');
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData(loginUser);
  }, [loginUser, fetchData]);

  const handleFollowToggle = (userToToggle: UserProfileData) => {
    setUsers(currentUsers =>
      currentUsers.map(u => {
        if (u.id === userToToggle.id) {
          return {
            ...u,
            is_following: !u.is_following,
          };
        }
        return u;
      })
    );
  };

  if (isLoading) return <div className="loading-message">読み込んでいます...</div>;
  
  return (
    <div>
      <div style={{ padding: '10px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #38444d' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', marginRight: '20px' }}>
          ←
        </button>
        <h2 style={{ margin: 0, padding: 0, border: 'none' }}>フォロー中</h2>
      </div>
      <UserList users={users} onFollowToggle={handleFollowToggle} />
    </div>
  );
};