// src/BookmarksPage.tsx （新規作成）

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { Post, PostList } from './PostList';
import toast from 'react-hot-toast';

interface AppContextType {
  loginUser: FirebaseUser | null;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const BookmarksPage: React.FC = () => {
  const { loginUser } = useOutletContext<AppContextType>();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loginUser) {
        setIsLoading(false);
        return;
    };

    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        const token = await loginUser.getIdToken();
        const response = await fetch(`${BACKEND_API_URL}/api/bookmarks`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('ブックマークの取得に失敗しました。');
        const data = await response.json();
        setBookmarkedPosts(data || []);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookmarks();
  }, [loginUser]);

  const handleUpdateSinglePost = (updatedPost: Post) => {
    setBookmarkedPosts(currentPosts => 
      currentPosts.map(p => p.post_id === updatedPost.post_id ? updatedPost : p)
    );
  };
  
  return (
    <div>
      <h1>ブックマーク</h1>
      <PostList 
        posts={bookmarkedPosts}
        isLoading={isLoading}
        error={null}
        onUpdate={() => { /* 必要なら再取得ロジックを実装 */ }}
        loginUser={loginUser}
        onUpdateSinglePost={handleUpdateSinglePost}
      />
    </div>
  );
};