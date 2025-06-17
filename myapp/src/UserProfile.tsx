import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Post, PostList } from './PostList';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { fireAuth } from './firebase';
import toast from 'react-hot-toast';
import { EditProfileModal } from './EditProfileModal';
import './UserProfile.css';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

// main.goの構造体に合わせて修正
export interface UserProfileData {
  id: string;
  name: string;
  age: number | null;
  firebase_uid: string | null;
  bio: string | null;
  profile_image_url: string | null;
  header_image_url: string | null;
  following_count: number;
  follower_count: number;
  is_following: boolean;
  is_me: boolean;
}

export const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginUser, setLoginUser] = useState<FirebaseUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      setLoginUser(user);
      setAuthChecked(true); // 認証チェックが完了したことを記録
    });
    return () => unsubscribe();
  }, []);

  // ログインユーザーの情報をヘッダーに含めるように修正
  const fetchUserProfile = useCallback(async (currentUser: FirebaseUser | null) => {
    if (!userId) return;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/users/${userId}`, { headers });
      if (!response.ok) { throw new Error('ユーザー情報の取得に失敗しました。'); }
      const data: UserProfileData = await response.json();
      setUserProfile(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  }, [userId]);
  
  const fetchUserPosts = useCallback(async (currentUser: FirebaseUser | null) => {
    if (!userId) return;
     const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/users/${userId}/posts`, { headers });
      if (!response.ok) { throw new Error('投稿の取得に失敗しました。'); }
      const data: Post[] = await response.json();
      setUserPosts(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  }, [userId]);
  // handleFollowToggle関数を追加
  const handleFollowToggle = async () => {
    if (!loginUser || !userProfile) { toast.error("ログインが必要です。"); return; }
    
    const currentFollowStatus = userProfile.is_following;

    // UIを即時更新（楽観的更新）
    setUserProfile({
      ...userProfile,
      is_following: !currentFollowStatus,
      follower_count: currentFollowStatus 
        ? userProfile.follower_count - 1 
        : userProfile.follower_count + 1,
    });

    try {
      const token = await loginUser.getIdToken();
      const method = currentFollowStatus ? 'DELETE' : 'POST';
      const response = await fetch(`${BACKEND_API_URL}/api/users/${userId}/follow`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) { throw new Error('操作に失敗しました。'); }
    } catch (err: any) {
      toast.error(err.message);
      // エラー時はUIを元の状態に戻す
      setUserProfile({
        ...userProfile,
        is_following: currentFollowStatus,
        follower_count: userProfile.follower_count,
      });
    }
  };

  // ログイン状態が変化したらデータを再取得するように修正
  useEffect(() => {
    // 認証チェックが完了していなければ、データ取得を開始しない
    if (!authChecked) {
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUserProfile(loginUser), fetchUserPosts(loginUser)]);
      setIsLoading(false);
    };
    fetchData();
  }, [authChecked, loginUser, fetchUserProfile, fetchUserPosts]); // authCheckedを依存配列に追加


  const handleProfileUpdate = () => {
    fetchUserProfile(loginUser);
    fetchUserPosts(loginUser);
  };

  const handleUpdateSinglePostInProfile = (updatedPost: Post) => {
    setUserPosts(currentUserPosts =>
      currentUserPosts.map(p => p.post_id === updatedPost.post_id ? updatedPost : p)
    );
  };

  if (isLoading) return <div className="loading-message">読み込んでいます...</div>;
  if (error) return <div className="error-message">エラー: {error}</div>;
  if (!userProfile) return <div className="error-message">ユーザーが見つかりません。</div>;
  
  return (
    <div className="profile-container">
      {/* ▼▼▼ このヘッダーブロックを追加 ▼▼▼ */}
      <div style={{ padding: '10px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #38444d', position: 'sticky', top: 0, backgroundColor: 'rgba(21, 32, 43, 0.85)', backdropFilter: 'blur(4px)', zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', marginRight: '20px' }}>
          ←
        </button>
        <div>
          <h2 style={{ margin: 0, padding: 0, border: 'none', fontSize: '18px' }}>{userProfile.name}</h2>
          <span style={{color: '#8899a6', fontSize: '13px'}}>{userPosts.length} posts</span>
        </div>
      </div>
      <div className="profile-header">
        <img src={userProfile.header_image_url || '/default-header.png'} alt="ヘッダー画像" className="header-image" />
        <div className="profile-avatar-container">
          <img src={userProfile.profile_image_url || '/default-avatar.png'} alt="プロフィール画像" className="profile-avatar-image" />
        </div>
      </div>

      <div className="profile-info">
        <div className="profile-action">
          {/* is_meフラグでボタンを出し分ける */}
          {userProfile.is_me ? (
            <button onClick={() => setIsEditModalOpen(true)} className="edit-profile-btn">
              プロフィールを編集
            </button>
          ) : (
            // フォロー/アンフォローボタン
            <button onClick={handleFollowToggle} className={userProfile.is_following ? 'following-btn' : 'follow-btn'}>
              {userProfile.is_following ? 'フォロー中' : 'フォローする'}
            </button>
          )}
        </div>
        <h2 className="profile-name">{userProfile.name}</h2>
        <p className="profile-bio">{userProfile.bio || '自己紹介がありません。'}</p>
        
        {/* フォロー・フォロワー数を表示 */}
        <div className="profile-stats">
          <Link to={`/users/${userId}/following`} className="profile-stat-link">
            <span><strong>{userProfile.following_count}</strong> フォロー</span>
          </Link>
          <Link to={`/users/${userId}/followers`} className="profile-stat-link">
            <span><strong>{userProfile.follower_count}</strong> フォロワー</span>
          </Link>
        </div>
      </div>

      <div className="profile-posts">
        <h3>投稿一覧</h3>
        <PostList 
            posts={userPosts} 
            isLoading={false} 
            error={null} 
            onUpdate={() => fetchUserPosts(loginUser)} 
            loginUser={loginUser} 
            onUpdateSinglePost={handleUpdateSinglePostInProfile}
        />
      </div>
      
      {userProfile.is_me && isEditModalOpen && (
        <EditProfileModal user={userProfile} onClose={() => setIsEditModalOpen(false)} onUpdate={handleProfileUpdate} />
      )}
    </div>
  );
};