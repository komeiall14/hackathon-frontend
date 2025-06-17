import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { LoginForm } from './LoginForm';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; 
import { fireAuth } from './firebase'; 
import { PostList, Post } from './PostList';
import { PostForm } from './PostForm';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
// ★ 修正点1: useNavigate と SearchResults をインポート
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { UserProfile } from './UserProfile';
import { SearchResults } from './SearchResults';
import { FaSearch } from 'react-icons/fa';

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
  // ★ 修正点2: 検索関連のstateを汎用的な名前に変更
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const [message, setMessage] = useState<string>('');
  const [loginUser, setLoginUser] = useState<FirebaseUser | null>(null); 
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserManagement, setShowUserManagement] = useState<boolean>(false);
  
  // ★ 修正点3: ページ移動のためのnavigate関数を準備
  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/posts`);
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
  
  // useEffectの依存配列からfetchAllUsersを削除し、ログイン成功時にのみ呼び出すように変更
  useEffect(() => {
    fetchPosts();
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      setLoginUser(user);
      if (user) {
        // ログイン状態が確認できたらユーザーリストを更新
        fetchAllUsers();
      }
    });
    return () => unsubscribe();
  }, [fetchPosts]); // fetchAllUsersを依存配列から削除

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

  // ★ 修正点4: ユーザー名検索の関数を、新しい検索ページへ移動する関数に置き換え
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    // 検索結果ページに、検索クエリを付けて移動する
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <>
      <div className="app-container">
        <Toaster position="top-center" />
        
        <aside className="left-sidebar">
          <h2>ナビゲーション</h2>
          
          <Link to="/" className="nav-link">
            <FaSearch />
            <span style={{ marginLeft: '16px' }}>ホーム</span>
          </Link>
          
          <LoginForm onLoginSuccess={fetchAllUsers} />
          
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
                    <PostForm loginUser={loginUser} onPostSuccess={fetchPosts} />
                  </section>
                )}
                <PostList 
                  posts={posts} 
                  isLoading={isLoading} 
                  error={error} 
                  onUpdate={fetchPosts}
                  loginUser={loginUser} 
                />
              </>
            } />
            
            <Route path="/users/:userId" element={<UserProfile />} />
            {/* ★ 修正点5: 検索結果ページのルートを追加 */}
            <Route path="/search" element={<SearchResults />} />
          </Routes>
        </main>
        
        <aside className="right-sidebar">
          <section style={{padding: '10px'}}>
            <h2>ユーザー検索</h2>
            {/* ★ 修正点6: フォームとインプットを新しいstateとハンドラに紐付け */}
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
            {/* 検索結果の表示は、SearchResultsコンポーネントに任せるため削除 */}
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