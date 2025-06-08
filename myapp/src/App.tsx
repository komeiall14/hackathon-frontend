import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { LoginForm } from './LoginForm';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; 
import { fireAuth } from './firebase'; 
import { PostList, Post } from './PostList';
import { PostForm } from './PostForm';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  age: number;
}

function App() {
  const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

  const [users, setUsers] = useState<User[]>([]); 
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [message, setMessage] = useState<string>('');
  const [loginUser, setLoginUser] = useState<FirebaseUser | null>(null); 
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ★★★ モーダル表示用の状態を追加 ★★★
  const [showUserManagement, setShowUserManagement] = useState<boolean>(false);
  
  const fetchPosts = useCallback(async () => {
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

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchAllUsers();
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      setLoginUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllUsers = async () => {
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
  };

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

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Searching user...');
    if (!searchName.trim()) {
      setMessage('Please enter a name to search.');
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(`${BACKEND_API_URL}/user?name=${encodeURIComponent(searchName.trim())}`);
      if (!response.ok) {
        throw new Error(`Failed to search user: ${response.statusText}`);
      }
      const data: User[] = await response.json();
      setSearchResults(data);
      setMessage(`Found ${data.length} user(s) for "${searchName}".`);
    } catch (error) {
      console.error('Error searching user:', error);
      setMessage(`Error fetching user: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <> {/* フラグメントで全体を囲む */}
      <div className="app-container">
        <Toaster position="top-center" />
        
        <aside className="left-sidebar">
          <h2>ナビゲーション</h2>
          <LoginForm />
          {/* ★★★ ユーザー管理モーダルを開くボタン ★★★ */}
          <button className="sidebar-button" onClick={() => setShowUserManagement(true)}>
            ユーザー管理
          </button>
        </aside>
      
        <main className="main-content">
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
        </main>
        
        <aside className="right-sidebar">
          <section style={{padding: '10px'}}>
            <h2>ユーザー検索</h2>
            <form onSubmit={handleSearchUser}>
              <div>
                <input
                  id="searchName"
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="ユーザー名で検索..."
                  style={{width: '90%', padding: '8px', borderRadius: '20px', border: '1px solid #38444d', backgroundColor: '#203444', color: 'white'}}
                />
              </div>
            </form>
            {searchResults.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3>検索結果</h3>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {searchResults.map((user) => (
                    <li key={user.id} style={{ borderBottom: '1px dashed #555', padding: '5px 0', fontSize: '14px' }}>
                      Name: {user.name}, Age: {user.age}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* ★★★ ユーザー管理モーダルの表示ロジック ★★★ */}
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
                      <li key={user.id}>ID: {user.id.substring(0,8)}..., Name: {user.name}, Age: {user.age}</li>
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