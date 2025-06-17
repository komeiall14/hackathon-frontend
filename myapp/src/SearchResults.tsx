// src/SearchResults.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
    
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('q');

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
            const response = await fetch(`${BACKEND_API_URL}/api/search?q=${encodeURIComponent(query)}`);
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
    }, [query]);

    useEffect(() => {
        fetchSearchResults();
    }, [fetchSearchResults]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
            setLoginUser(user);
        });
        return () => unsubscribe();
    }, []);

    const handleUpdateSinglePostInSearch = (updatedPost: Post) => {
        setPosts(currentPosts =>
          currentPosts.map(p => p.post_id === updatedPost.post_id ? updatedPost : p)
        );
      };

    return (
        <div>
            <h1>検索結果</h1>
            <p style={{padding: '0 15px'}}>「<strong>{query}</strong>」の検索結果: {posts.length}件</p>
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