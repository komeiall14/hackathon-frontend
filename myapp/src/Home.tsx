// src/Home.tsx （このファイルを新規作成してください）

import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User as FirebaseUser } from "firebase/auth"; 
import { PostList, Post } from './PostList';
import { PostForm } from './PostForm';
import { useInView } from 'react-intersection-observer'; 

// App.tsxから渡されるcontextの型を定義
interface AppContextType {
  loginUser: FirebaseUser | null;
  triggerRefresh: () => void;
}

const PAGE_SIZE = 20;
const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const Home: React.FC = () => {
  // OutletのcontextからloginUserを取得
  const { loginUser, triggerRefresh } = useOutletContext<AppContextType>();
  
  // Homeコンポーネントで投稿に関する状態を管理
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // データ取得ロジック
  const fetchPosts = useCallback(async (isInitialLoad: boolean, currentUser: FirebaseUser | null) => {
    setIsLoading(true);
    
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) { console.error("IDトークンの取得に失敗:", error); }
    }

    const currentOffset = isInitialLoad ? 0 : offset;

    try {
      const response = await fetch(`${BACKEND_API_URL}/posts?limit=${PAGE_SIZE}&offset=${currentOffset}`, { headers });
      if (!response.ok) throw new Error('データの取得に失敗しました。');
      
      const data: Post[] = await response.json();

      if (isInitialLoad) {
        setPosts(data);
      } else {
        setPosts(prevPosts => [...prevPosts, ...data]);
      }
      
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
      
      setOffset(currentOffset + data.length);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [offset]);

  // loginUserの変更を検知して、最初の投稿データを取得
  useEffect(() => {
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    fetchPosts(true, loginUser);
  }, [loginUser, triggerRefresh]); // triggerRefreshを依存配列に追加

  const { ref } = useInView({
    threshold: 0,
    skip: !hasMore || isLoading,
    onChange: (inView) => {
      if (inView) {
        fetchPosts(false, loginUser);
      }
    },
  });

  const handlePostCreation = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleUpdateSinglePost = (updatedPost: Post) => {
    setPosts(currentPosts => 
      currentPosts.map(p => p.post_id === updatedPost.post_id ? updatedPost : p)
    );
  };

  return (
    <>
      <h1>ホーム</h1>
      {loginUser && (
        <section className="post-form-section">
          <PostForm loginUser={loginUser} onPostSuccess={handlePostCreation} />
        </section>
      )}
      <PostList 
        posts={posts} 
        isLoading={isLoading && posts.length === 0} 
        error={error} 
        onUpdate={() => { setPosts([]); setOffset(0); setHasMore(true); fetchPosts(true, loginUser); }}
        onPostCreated={handlePostCreation}
        loginUser={loginUser}  
        onUpdateSinglePost={handleUpdateSinglePost}
        title="投稿一覧" 
      />
      <div ref={ref} style={{ height: '50px', textAlign: 'center' }}>
        {isLoading && posts.length > 0 && "読み込み中..."}
        {!hasMore && posts.length > 0 && "これ以上投稿はありません"}
      </div>
    </>
  );
};