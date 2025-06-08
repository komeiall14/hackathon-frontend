import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom'; // URLからパラメータを取得するためのフック
import { Post, PostList } from './PostList'; // PostListコンポーネントとPost型を再利用
import toast from 'react-hot-toast';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; 
import { fireAuth } from './firebase';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>(); // URLから :userId の部分を取得
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginUser, setLoginUser] = useState<FirebaseUser | null>(null);

  // ログイン状態を監視して、投稿の「いいね」状態を正しく表示させる
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      setLoginUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserPosts = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/users/${userId}/posts`);
      if (!response.ok) {
        throw new Error('ユーザーの投稿の取得に失敗しました。');
      }
      const data: Post[] = await response.json();
      setUserPosts(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  // ユーザー名を取得するために、取得した投稿の最初の1件を参照する
  const userName = userPosts.length > 0 ? userPosts[0].user_name : 'ユーザー';

  return (
    <div>
      <h1>{userName}の投稿</h1>
      {/* 既存のPostListコンポーネントを再利用して投稿一覧を表示 */}
      <PostList 
        posts={userPosts}
        isLoading={isLoading}
        error={error}
        onUpdate={fetchUserPosts} // いいねなどをした時にこのページのリストを更新
        loginUser={loginUser} 
      />
    </div>
  );
};