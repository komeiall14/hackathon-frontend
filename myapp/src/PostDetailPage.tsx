import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PostList, Post } from './PostList'; 
import toast from 'react-hot-toast';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; 
import { fireAuth } from './firebase'; 

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>(); // URLから投稿IDを取得
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
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

  useEffect(() => {
    if (!isLoading) {
      window.scrollTo(0, 0);
    }
  }, [isLoading]);

  // 投稿とリプライを読み込む関数
  const fetchData = useCallback(async (currentUser: FirebaseUser | null) => {
    if (!postId) return;
    setIsLoading(true);
    
    // 認証ヘッダーを準備
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // 2つのAPIを並行して呼び出す
      const [postRes, repliesRes] = await Promise.all([
        fetch(`${BACKEND_API_URL}/api/post/${postId}`, { headers }),
        fetch(`${BACKEND_API_URL}/api/posts/replies/${postId}`, { headers })
      ]);

      if (!postRes.ok) throw new Error('投稿の取得に失敗しました。');
      if (!repliesRes.ok) throw new Error('リプライの取得に失敗しました。');

      const postData = await postRes.json();
      const repliesData = await repliesRes.json();

      setPost(postData);
      setReplies(repliesData);
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

  const handleUpdateSinglePostInDetail = (updatedPost: Post) => {
    // メイン投稿が更新された場合
    if (post && post.post_id === updatedPost.post_id) {
      setPost(updatedPost);
    }
    // 返信リスト内の投稿が更新された場合
    setReplies(currentReplies =>
      currentReplies.map(p => p.post_id === updatedPost.post_id ? updatedPost : p)
    );
  };



  if (isLoading) return <div style={{padding: '20px'}}>読み込んでいます...</div>;
  if (error) return <div style={{padding: '20px', color: 'red'}}>エラー: {error}</div>;
  if (!post) return <div style={{padding: '20px'}}>投稿が見つかりません。</div>;
  
  return (
    <div>
      <div style={{ padding: '10px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #38444d' }}>
        <button onClick={() => navigate(-1)} style={{background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', marginRight: '20px'}}>
          ←
        </button>
        <h2 style={{margin: 0, padding: 0, border: 'none'}}>投稿</h2>
      </div>

      {/* 注目している投稿をPostListコンポーネントで表示 */}
      <PostList 
        posts={[post]} 
        isLoading={false} 
        error={null}
        onUpdate={() => fetchData(loginUser)} // このページのデータを再取得
        loginUser={loginUser}
        onUpdateSinglePost={handleUpdateSinglePostInDetail} 
      />
      
      {/* 返信一覧をPostListコンポーネントで表示 */}
      <div style={{borderTop: '10px solid #38444d'}}>
        <PostList 
          posts={replies}
          isLoading={false}
          error={null}
          onUpdate={() => fetchData(loginUser)} // このページのデータを再取得
          loginUser={loginUser}
          title={replies.length > 0 ? "返信一覧" : undefined}
          onUpdateSinglePost={handleUpdateSinglePostInDetail}
        />
      </div>
    </div>
  );
};