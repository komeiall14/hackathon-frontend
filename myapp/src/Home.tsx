// src/Home.tsx (この内容に全体を置き換える)

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
  // ★ ここから追加
  feedType: 'forYou' | 'following';
  setFeedType: (type: 'forYou' | 'following') => void;
  // ★ ここまで追加
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
    onUpdate,
    feedType,       // ★ 追加
    setFeedType,    // ★ 追加
  } = useOutletContext<HomeContextType>();

  // ★ タブのスタイルを定義
  const tabStyle = {
    width: '50%',
    padding: '16px 0',
    textAlign: 'center' as const,
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    color: '#8899a6',
    transition: 'background-color 0.2s',
  };
  const activeTabStyle = {
    ...tabStyle,
    color: '#ffffff',
    borderBottom: '2px solid #1DA1F2',
  };


  return (
    <>
      {/* ▼▼▼ この div でヘッダーとタブを囲み、stickyを適用します ▼▼▼ */}
      <div className="home-header-sticky">
        <h1>ホーム</h1>
        
        { loginUser && (
          // display:flex と border-bottom のスタイルのみ残します
          <div style={{ display: 'flex', borderBottom: '1px solid #38444d' }}>
              <div 
                style={feedType === 'forYou' ? activeTabStyle : tabStyle}
                onClick={() => setFeedType('forYou')}
              >
                おすすめ
              </div>
              <div 
                style={feedType === 'following' ? activeTabStyle : tabStyle}
                onClick={() => setFeedType('following')}
              >
                フォロー中
              </div>
          </div>
        )}
      </div>
      {/* ▲▲▲ ここまでがヘッダーブロックです ▲▲▲ */}


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
      />
      {/* 無限スクロールの検知用要素 */}
      <div ref={bottomRef} style={{ height: '50px', textAlign: 'center' }}>
        {!isLoading && hasMore && posts.length > 0 && "読み込み中..."}
        {!hasMore && posts.length > 0 && "これ以上投稿はありません"}
      </div>
    </>
  );

};