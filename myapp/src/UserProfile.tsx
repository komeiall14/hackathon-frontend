import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import { Post, PostList } from './PostList';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { fireAuth } from './firebase';
import toast from 'react-hot-toast';
import { EditProfileModal } from './EditProfileModal';
import './UserProfile.css';
import { InitialAvatar } from './InitialAvatar';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

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
  const [userReplies, setUserReplies] = useState<Post[]>([]); 
  const [posts, setPosts] = useState<Post[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginUser, setLoginUser] = useState<FirebaseUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);

  const [activeTab, setActiveTab] = useState<'posts' | 'replies'>('posts');

  useEffect(() => {
    // isLoadingがfalseになった（=読み込みが完了した）瞬間にスクロールする
    if (!isLoading) {
      window.scrollTo(0, 0);
    }
  }, [isLoading]); // isLoadingの状態を監視する

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      setLoginUser(user);
      setAuthChecked(true); // 認証チェックが完了したことを記録
    });
    return () => unsubscribe();
  }, []);

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

  const fetchUserReplies = useCallback(async (currentUser: FirebaseUser | null) => {
    if (!userId) return;
    setIsLoadingReplies(true); // 返信の読み込み開始
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      // ユーザーの返信を取得するAPIを呼び出す
      const response = await fetch(`${BACKEND_API_URL}/api/users/${userId}/replies`, { headers });
      if (!response.ok) { throw new Error('返信の取得に失敗しました。'); }
      const data: Post[] = await response.json();
      setUserReplies(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoadingReplies(false); // 返信の読み込み完了
    }
  }, [userId]);

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

  const handleStartConversation = async () => {
    // ログインしていない、またはプロフィールデータがない場合は何もしない
    if (!loginUser || !userProfile || !userProfile.firebase_uid) {
      toast.error("ログインが必要です。");
      return;
    }

    try {
      const token = await loginUser.getIdToken();
      // 既存の「新規会話開始API」を呼び出す
      const response = await fetch(`${BACKEND_API_URL}/api/new-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ recipient_id: userProfile.firebase_uid }),
      });

      if (!response.ok) {
        throw new Error('会話の開始に失敗しました。');
      }
      
      const data = await response.json();
      
      // APIから返された会話IDを使って、メッセージ画面に遷移
      navigate(`/messages/${data.conversation_id}`);

    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    // 認証情報が確認できてから実行
    if (!authChecked) return;

    const fetchData = async () => {
      setIsLoading(true); // ページ全体のローディングを開始
      await fetchUserProfile(loginUser);
      setIsLoading(false); // ページ全体のローディングを完了
    };
    fetchData();
  }, [authChecked, loginUser, userId]); // ユーザーIDが変わった時も再取得

  useEffect(() => {
    // プロフィールが読み込めていない場合は何もしない
    if (!userProfile) return;

    if (activeTab === 'posts') {
      // 投稿タブが選択されたら投稿を取得
      fetchUserPosts(loginUser);
    } else {
      // 返信タブが選択されたら返信を取得
      fetchUserReplies(loginUser);
    }
  }, [userProfile, activeTab, loginUser]);


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
        {userProfile.header_image_url && userProfile.header_image_url.startsWith('http') ? (
          <img src={userProfile.header_image_url} alt="ヘッダー画像" className="header-image" />
        ) : (
          // ヘッダー画像がない場合、背景色付きの空のdivで高さを確保する
          <div className="header-image"></div>
        )}
        <div className="profile-avatar-container">
          {/* profile_image_urlが有効なURLならそれを表示 */}
          {userProfile.profile_image_url && userProfile.profile_image_url.startsWith('http') ? (
            <img 
              src={userProfile.profile_image_url} 
              alt="プロフィール画像" 
              className="profile-avatar-image" 
            />
          ) : (
            // そうでなければ、頭文字アイコンを表示
            <InitialAvatar name={userProfile.name} size={135} />
          )}
        </div>
      </div>

      <div className="profile-info">
        <div className="profile-action">
          {userProfile.is_me ? (
            <button onClick={() => setIsEditModalOpen(true)} className="edit-profile-btn">
              プロフィールを編集
            </button>
          ) : (
            <>
              {/* DMボタン: フォロー中の場合にのみ表示 */}
              {userProfile.is_following && (
                <button onClick={handleStartConversation} className="dm-btn" title="メッセージを送信">
                  <FaEnvelope />
                </button>
              )}
              {/* フォロー/アンフォローボタン */}
              <button onClick={handleFollowToggle} className={userProfile.is_following ? 'following-btn' : 'follow-btn'}>
                {userProfile.is_following ? 'フォロー中' : 'フォローする'}
              </button>
            </>
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

      <div className="profile-tabs-container">
        <div 
          className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          投稿
        </div>
        <div 
          className={`profile-tab ${activeTab === 'replies' ? 'active' : ''}`}
          onClick={() => setActiveTab('replies')}
        >
          返信
        </div>
      </div>
      
      <div className="profile-posts">
        <PostList 
            // activeTabに応じて表示するデータを切り替え
            posts={activeTab === 'posts' ? userPosts : userReplies} 
            // activeTabに応じてローディング状態を切り替え
            isLoading={activeTab === 'posts' ? isLoadingPosts : isLoadingReplies} 
            error={null} 
            onUpdate={handleProfileUpdate} 
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