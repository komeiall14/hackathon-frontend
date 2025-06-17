import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { LoginForm } from './LoginForm';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; 
import { fireAuth } from './firebase'; 
import { PostList, Post } from './PostList';
import { PostForm } from './PostForm';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { UserProfile } from './UserProfile';
import { SearchResults } from './SearchResults';
import { FaHome, FaUser } from 'react-icons/fa'; // ★ アイコンを変更・追加
import { PostDetailPage } from './PostDetailPage'; 

interface User {
  id: string;
  name: string;
  age: number | null;
  firebase_uid: string | null;
}

function App() {
  const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

  const [users, setUsers] = useState<User[]>([]); 
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const [message, setMessage] = useState<string>('');
  const [loginUser, setLoginUser] = useState<FirebaseUser | null>(null); 
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserManagement, setShowUserManagement] = useState<boolean>(false);
  const navigate = useNavigate();

  // ★ 変更点1: fetchPostsが引数(currentUser)を取り、認証情報をヘッダーに含めるように修正
  const fetchPosts = useCallback(async (currentUser: FirebaseUser | null) => {
    setIsLoading(true);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error("IDトークンの取得に失敗:", error);
      }
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/posts`, { headers });

      if (!response.ok) {
        throw new Error('データの取得に失敗しました。');
      }
      const data: Post[] = await response.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message); 
    } finally {
      setIsLoading(false);
    }
  }, [BACKEND_API_URL]);
  
  const fetchAllUsers = useCallback(async () => {
    setMessage('Loading users...');
    try {
      const response = await fetch(`${BACKEND_API_URL}/user`);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      const data: User[] = await response.json();
      setUsers(data);
      setMessage('Users loaded successfully.');
    } catch (error) {
      console.error('Error fetching all users:', error);
      setMessage(`Error fetching users: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [BACKEND_API_URL]);

  // ★ 変更点2: ログイン状態が変化した際に、そのユーザー情報(user)をfetchPostsに渡すように修正
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      setLoginUser(user);
      fetchPosts(user); // ログイン状態を元に投稿を取得
      if (user) {
        fetchAllUsers();
      }
    });
    return () => unsubscribe();
  }, [fetchPosts, fetchAllUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage('Name cannot be empty.');
      return;
    }
    if (name.trim().length > 50) {
      setMessage('Name must be 50 characters or less.');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      setMessage('Age must be a valid number between 0 and 150.');
      return;
    }
    setMessage('Creating user...');
    try {
      const response = await fetch(`${BACKEND_API_URL}/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), age: ageNum }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create user: ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      console.log('User created successfully:', data);
      setMessage(`User created with ID: ${data.id}`);
      setName('');
      setAge('');
      fetchAllUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage(`Error creating user: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <>
      <div className="app-container">
        <Toaster position="top-center" />
        
        <aside className="left-sidebar">
          <h2>ナビゲーション</h2>
          
          <Link to="/" className="nav-link">
            <FaHome /> {/* アイコンをホームに変更 */}
            <span style={{ marginLeft: '16px' }}>ホーム</span>
          </Link>

          {/* ★ 変更点3: ログイン時のみプロフィールへのリンクを表示 */}
          {loginUser && (
            <Link to={`/users/${loginUser.uid}`} className="nav-link">
              <FaUser />
              <span style={{ marginLeft: '16px' }}>プロフィール</span>
            </Link>
          )}
          
          <LoginForm onLoginSuccess={() => {
              fetchAllUsers();
              // ★ 変更点4: ログイン成功後も、現在のログインユーザー情報で投稿を再取得
              fetchPosts(fireAuth.currentUser); 
            }} 
          />
          
          <button className="sidebar-button" onClick={() => setShowUserManagement(true)}>
            ユーザー管理
          </button>
        </aside>
      
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <>
                <h1>ホーム</h1>
                {loginUser && (
                  <section className="post-form-section">
                    {/* ★ 変更点5: onPostSuccessで現在のログインユーザーを渡す */}
                    <PostForm loginUser={loginUser} onPostSuccess={() => fetchPosts(loginUser)} />
                  </section>
                )}
                <PostList 
                  posts={posts} 
                  isLoading={isLoading} 
                  error={error} 
                  // ★ 変更点6: onUpdateで現在のログインユーザーを渡す
                  onUpdate={() => fetchPosts(loginUser)}
                  loginUser={loginUser} 
                  title="投稿一覧" 
                />
              </>
            } />
            
            <Route path="/users/:userId" element={<UserProfile />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/status/:postId" element={<PostDetailPage />} />
          </Routes>
        </main>
        
        <aside className="right-sidebar">
          <section style={{padding: '10px'}}>
            <h2>ユーザー検索</h2>
            <form onSubmit={handleSearchSubmit}>
              <div>
                <input
                  id="searchQuery"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="キーワードで検索..."
                  style={{width: '90%', padding: '8px', borderRadius: '20px', border: '1px solid #38444d', backgroundColor: '#203444', color: 'white'}}
                />
              </div>
            </form>
          </section>
        </aside>
      </div>

      {showUserManagement && (
        <div className="modal-overlay" onClick={() => setShowUserManagement(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-button" onClick={() => setShowUserManagement(false)}>×</button>
            <h2>ユーザー管理</h2>
            {message && <p style={{ color: 'yellow', padding: '0 15px' }}>{message}</p>}
            
            <section className="modal-section">
              <h3>Create New User</h3>
              <form onSubmit={handleCreateUser}>
                <div>
                  <label htmlFor="name-modal">Name:</label>
                  <input id="name-modal" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div style={{ marginTop: '10px' }}>
                  <label htmlFor="age-modal">Age:</label>
                  <input id="age-modal" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
                </div>
                <button type="submit">Add User</button>
              </form>
            </section>

            <section className="modal-section">
              <h3>All Registered Users</h3>
              <div className="user-list">
                {users.length === 0 ? <p>No users found.</p> : (
                  <ul>{users.map((user) => (
                      <li key={user.id}>
                        Name: {user.name} | Age: {user.age || 'N/A'} | Firebase UID: {user.firebase_uid || 'N/A'}
                      </li>
                  ))}</ul>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}

export default App;