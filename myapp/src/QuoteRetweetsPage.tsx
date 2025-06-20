import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PostList, Post } from './PostList'; 
import toast from 'react-hot-toast';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; 
import { fireAuth } from './firebase'; 

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const QuoteRetweetsPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [quoteRetweets, setQuoteRetweets] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginUser, setLoginUser] = useState<FirebaseUser | null>(null);

  // ログイン状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      setLoginUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 引用リツイートを読み込む関数
  const fetchData = useCallback(async (currentUser: FirebaseUser | null) => {
    if (!postId) return;
    setIsLoading(true);
    
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/posts/quote_retweets/${postId}`, { headers });

      if (!response.ok) {
        throw new Error('引用リツイートの取得に失敗しました。');
      }

      const data = await response.json();
      setQuoteRetweets(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // ログイン状態が変わるか、ページが最初に読み込まれた時にデータを取得
  useEffect(() => {
    fetchData(loginUser);
  }, [loginUser, fetchData]);

  const handleUpdateSinglePostInQuotes = (updatedPost: Post) => {
    setQuoteRetweets(currentQuotes =>
      currentQuotes.map(p => p.post_id === updatedPost.post_id ? updatedPost : p)
    );
  };

  if (isLoading) return <div style={{padding: '20px'}}>読み込んでいます...</div>;
  if (error) return <div style={{padding: '20px', color: 'red'}}>エラー: {error}</div>;

  return (
    <div>
      <div style={{ padding: '10px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #38444d' }}>
        <button onClick={() => navigate(-1)} style={{background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', marginRight: '20px'}}>
          ←
        </button>
        <h2 style={{margin: 0, padding: 0, border: 'none'}}>引用リツイート</h2>
      </div>
      
      {/* 取得した引用リツイート一覧をPostListコンポーネントで表示 */}
      <PostList 
        posts={quoteRetweets}
        isLoading={isLoading}
        error={error}
        onUpdate={() => fetchData(loginUser)} // データを再取得
        loginUser={loginUser}
        onUpdateSinglePost={handleUpdateSinglePostInQuotes} 
      />
    </div>
  );
};