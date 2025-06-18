import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Post, PostList } from './PostList';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { fireAuth } from './firebase';
import toast from 'react-hot-toast';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const SearchResults: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loginUser, setLoginUser] = useState<FirebaseUser | null>(null);
    
    const navigate = useNavigate(); // 戻るボタン用にuseNavigateフックを準備
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('q');

    // ページ表示時に一番上にスクロールさせる
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fetchSearchResults = useCallback(async () => {
        if (!query) {
            setPosts([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // 検索APIにも認証情報を渡すように修正
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (loginUser) {
                const token = await loginUser.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${BACKEND_API_URL}/api/search?q=${encodeURIComponent(query)}`, { headers });
            if (!response.ok) {
                throw new Error('検索結果の取得に失敗しました。');
            }
            const data: Post[] = await response.json();
            setPosts(data);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [query, loginUser]);

    useEffect(() => {
        fetchSearchResults();
    }, [fetchSearchResults]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
            setLoginUser(user);
        });
        return () => unsubscribe();
    }, []);

    // 検索結果ページでも「いいね」などが即時反映されるようにハンドラを追加
    const handleUpdateSinglePostInSearch = (updatedPost: Post) => {
        setPosts(currentPosts =>
          currentPosts.map(p => p.post_id === updatedPost.post_id ? updatedPost : p)
        );
    };

    if (isLoading) return <div className="loading-message">読み込んでいます...</div>;
    if (error) return <div className="error-message">エラー: {error}</div>;

    return (
        <div>
            {/* 他のページと共通のヘッダーを追加 */}
            <div style={{ padding: '10px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #38444d' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', marginRight: '20px' }}>
                    ←
                </button>
                <div>
                    <h2 style={{ margin: 0, padding: 0, border: 'none', fontSize: '18px' }}>検索結果</h2>
                    <span style={{color: '#8899a6', fontSize: '13px'}}>「{query}」</span>
                </div>
            </div>

            <p style={{padding: '15px', margin: 0, borderBottom: '1px solid #38444d'}}>
                「<strong>{query}</strong>」の検索結果: {posts.length}件
            </p>
            
            <PostList
                posts={posts}
                isLoading={isLoading}
                error={error}
                onUpdate={fetchSearchResults}
                loginUser={loginUser}
                onUpdateSinglePost={handleUpdateSinglePostInSearch}
            />
        </div>
    );
};