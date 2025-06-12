import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Post, PostList } from './PostList';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { fireAuth } from './firebase';
import toast from 'react-hot-toast';
import { EditProfileModal } from './EditProfileModal';
import './UserProfile.css';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export interface UserProfileData {
  id: string;
  name: string;
  age: number | null;
  firebase_uid: string | null;
  bio: string | null;
  profile_image_url: string | null;
  header_image_url: string | null;
}

export const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginUser, setLoginUser] = useState<FirebaseUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      setLoginUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました。');
      }
      const data: UserProfileData = await response.json();
      setUserProfile(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  }, [userId]);

  const fetchUserPosts = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/users/${userId}/posts`);
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました。');
      }
      const data: Post[] = await response.json();
      setUserPosts(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  }, [userId]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUserProfile(), fetchUserPosts()]);
      setIsLoading(false);
    };
    fetchData();
  }, [fetchUserProfile, fetchUserPosts]);

  const handleProfileUpdate = () => {
    fetchUserProfile();
    fetchUserPosts();
  };

  if (isLoading) return <div className="loading-message">読み込んでいます...</div>;
  if (error) return <div className="error-message">エラー: {error}</div>;
  if (!userProfile) return <div className="error-message">ユーザーが見つかりません。</div>;

  const isOwnProfile = loginUser?.uid === userProfile.firebase_uid;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img src={userProfile.header_image_url || '/default-header.png'} alt="Header" className="header-image" />
        <div className="profile-avatar-container">
          <img src={userProfile.profile_image_url || '/default-avatar.png'} alt="Profile" className="profile-avatar-image" />
        </div>
      </div>
      <div className="profile-info">
        <div className="profile-action">
          {isOwnProfile && (
            <button onClick={() => setIsEditModalOpen(true)} className="edit-profile-btn">
              プロフィールを編集
            </button>
          )}
        </div>
        <h2 className="profile-name">{userProfile.name}</h2>
        <p className="profile-bio">{userProfile.bio || '自己紹介がありません。'}</p>
      </div>
      <div className="profile-posts">
        <h3>投稿一覧</h3>
        <PostList posts={userPosts} isLoading={false} error={null} onUpdate={fetchUserPosts} loginUser={loginUser} />
      </div>
      {isOwnProfile && isEditModalOpen && userProfile && (
        <EditProfileModal user={userProfile} onClose={() => setIsEditModalOpen(false)} onUpdate={handleProfileUpdate} />
      )}
    </div>
  );
};