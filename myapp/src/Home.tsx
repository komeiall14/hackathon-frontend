// src/Home.tsx （この内容に全体を置き換える）

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { User as FirebaseUser } from "firebase/auth";
import { PostList, Post } from './PostList';
import { PostForm } from './PostForm';

// App.tsxから渡されるcontextの型を定義
interface HomeContextType {
  loginUser: FirebaseUser | null;
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  bottomRef: (node?: Element | null | undefined) => void;
  onPostCreation: (newPost: Post) => void;
  onUpdateSinglePost: (updatedPost: Post) => void;
  onUpdate: () => void;
}

export const Home: React.FC = () => {
  // Outletのcontextから状態と関数をすべて受け取る
  const { 
    loginUser, 
    posts, 
    isLoading, 
    error, 
    hasMore,
    bottomRef,
    onPostCreation,
    onUpdateSinglePost,
    onUpdate
  } = useOutletContext<HomeContextType>();

  return (
    <>
      <h1>ホーム</h1>
      {loginUser && (
        <section className="post-form-section">
          <PostForm loginUser={loginUser} onPostSuccess={onPostCreation} />
        </section>
      )}
      <PostList 
        posts={posts} 
        isLoading={isLoading} 
        error={error} 
        onUpdate={onUpdate}
        loginUser={loginUser}  
        onUpdateSinglePost={onUpdateSinglePost}
        title="投稿一覧" 
      />
      {/* 無限スクロールの検知用要素 */}
      <div ref={bottomRef} style={{ height: '50px', textAlign: 'center' }}>
        {!isLoading && hasMore && posts.length > 0 && "読み込み中..."}
        {!hasMore && posts.length > 0 && "これ以上投稿はありません"}
      </div>
    </>
  );
};