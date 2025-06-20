import React, { useState, useEffect, useCallback } from 'react'; // useCallback をインポート
import { useOutletContext } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { Post, PostList } from './PostList';
import toast from 'react-hot-toast';
import { PageHeader } from './PageHeader'; 

interface AppContextType {
  loginUser: FirebaseUser | null;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const BookmarksPage: React.FC = () => {
  const { loginUser } = useOutletContext<AppContextType>();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    if (!loginUser) {
        setIsLoading(false);
        return;
    };
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
  }, [loginUser]); // 依存配列にloginUserを設定
  
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]); // useEffectからはこの関数を呼び出す

  const handleUpdateSinglePost = (updatedPost: Post) => {
    // ブックマークが外された場合、リストからその投稿を削除する
    if (!updatedPost.is_bookmarked_by_me) {
      setBookmarkedPosts(currentPosts => 
        currentPosts.filter(p => p.post_id !== updatedPost.post_id)
      );
    } else { // それ以外の更新（いいね数など）
      setBookmarkedPosts(currentPosts => 
        currentPosts.map(p => p.post_id === updatedPost.post_id ? updatedPost : p)
      );
    }
  };
  
  return (
    <div>
      <PageHeader title="ブックマーク" />
      <PostList 
        posts={bookmarkedPosts}
        isLoading={isLoading}
        error={null}
        onUpdate={fetchBookmarks} 
        loginUser={loginUser}
        onUpdateSinglePost={handleUpdateSinglePost}
      />
    </div>
  );
};