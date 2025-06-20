// src/Home.tsx

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { User as FirebaseUser } from "firebase/auth";
import { PostList, Post } from './PostList';
import { PostForm } from './PostForm';

// HomeContextTypeの型定義（App.tsxから渡される型）
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
  feedType: 'forYou' | 'following';
  setFeedType: (type: 'forYou' | 'following') => void;
  // 新機能用のpropsを追加
  onBuzzStart: (postToBuzz: Post) => void;
  onFlameStart: (postToFlame: Post) => void;
  experienceMode: 'none' | 'buzz' | 'flame';
  experienceTargetPost: Post | null;
  openExplanationModal: (post: Post) => void;
  showExplanationButton: boolean; 
}

export const Home: React.FC = () => {
  // Outletのcontextから新しい値を受け取る
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
    feedType,
    setFeedType,
    onBuzzStart,
    onFlameStart,
    experienceMode,
    experienceTargetPost,
    openExplanationModal,
    showExplanationButton, 
  } = useOutletContext<HomeContextType>();
  console.log("Home component re-rendered. showExplanationButton is:", showExplanationButton);

  // タブのスタイル定義（変更なし）
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
      <div className="home-header-sticky">
        <h1>ホーム</h1>
        
        { loginUser && (
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

      {loginUser && (
        <section className="post-form-section">
          <PostForm 
            loginUser={loginUser} 
            onPostSuccess={onPostCreation}
            onBuzzStart={onBuzzStart}
            onFlameStart={onFlameStart}
          />
        </section>
      )}

      {/* ▼▼▼ ここに「弁明する」ボタンを表示するUIブロックを追加 ▼▼▼ */}
      {experienceMode === 'flame' && experienceTargetPost && showExplanationButton && (
        <div style={{
          position: 'sticky',
          top: '115px', 
          zIndex: 15,
          padding: '15px 20px',
          backgroundColor: 'rgba(21, 32, 43, 0.9)',
          backdropFilter: 'blur(4px)',
          borderBottom: '1px solid #e0245e'
        }}>
          <p style={{margin: 0, marginBottom: '10px', color: '#ffadad', fontWeight: 'bold'}}>
            投稿が炎上中です。的確な弁明を行ってください。
          </p>
          <button
            onClick={() => openExplanationModal(experienceTargetPost)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#e0245e',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            弁明を行う
          </button>
        </div>
      )}
      {/* ▲▲▲ 追加ここまで ▲▲▲ */}

      <PostList 
        posts={posts} 
        isLoading={isLoading} 
        error={error} 
        onUpdate={onUpdate}
        loginUser={loginUser}  
        onUpdateSinglePost={onUpdateSinglePost}
      />
      
      <div ref={bottomRef} style={{ height: '50px', textAlign: 'center' }}>
        {!isLoading && hasMore && posts.length > 0 && "読み込み中..."}
        {!hasMore && posts.length > 0 && "これ以上投稿はありません"}
      </div>
    </>
  );
};