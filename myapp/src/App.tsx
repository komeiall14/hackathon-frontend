import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { LoginForm } from './LoginForm';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; 
import { fireAuth } from './firebase'; 
import { PostList, Post } from './PostList'; // Post 型をインポート
import { PostForm } from './PostForm';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// APIレスポンスの型定義
interface User {
  id: string;
  name: string;
  age: number;
}

function App() {
  // 環境変数からバックエンドのURLを取得
  const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

  const [users, setUsers] = useState<User[]>([]); // ユーザー一覧を保持するState
  const [name, setName] = useState<string>('');   // ユーザー名入力用State
  const [age, setAge] = useState<string>('');     // 年齢入力用State (文字列として受け取り、後に数値に変換)
  const [searchName, setSearchName] = useState<string>(''); // 検索用ユーザー名State
  const [searchResults, setSearchResults] = useState<User[]>([]); // 検索結果を保持するState
  const [message, setMessage] = useState<string>(''); // ユーザーへのメッセージ表示用State
  const [loginUser, setLoginUser] = useState<FirebaseUser | null>(null); 

  // --- PostListから移動してきた状態とロジック ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchPosts = useCallback(async () => {
    // データ取得中の状態にしたい場合はここでsetIsLoading(true)を呼ぶ
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
  }, [BACKEND_API_URL]); // BACKEND_API_URL を依存配列に追加

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  // --- ここまでが移動してきた部分 ---

  // アプリケーション起動時に全ユーザーを取得し、認証状態を監視
  useEffect(() => {
    fetchAllUsers();
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      if (user) {
        setLoginUser(user);
        console.log("ログイン状態: ログイン中", user);
      } else {
        setLoginUser(null);
        console.log("ログイン状態: 未ログイン");
      }
    });
    return () => unsubscribe();
  }, []); // 空の依存配列でマウント時に一度だけ実行

  // 全ユーザー取得関数
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

  // ユーザー作成（POST）関数
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  // 特定ユーザー検索（GET with query parameter）関数
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
      setMessage(`Error searching user: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="App">
      <Toaster position="top-center" />
      <header className="App-header">
        <h1>User Management App</h1>

        <LoginForm />
        {/* メッセージ表示エリア */}
        {message && <p style={{ color: 'yellow' }}>{message}</p>}

        {/* ユーザー登録フォーム */}
        <section style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h2>Create New User</h2>
          <form onSubmit={handleCreateUser}>
            <div>
              <label htmlFor="name">Name:</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter user name"
                required
                maxLength={50}
              />
            </div>
            <div style={{ marginTop: '10px' }}>
              <label htmlFor="age">Age:</label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter age"
                required
                min="0"
                max="150"
              />
            </div>
            <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
              Add User
            </button>
          </form>
        </section>

        {/* ユーザー検索フォーム */}
        <section style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h2>Search User by Name</h2>
          <form onSubmit={handleSearchUser}>
            <div>
              <label htmlFor="searchName">Name:</label>
              <input
                id="searchName"
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter name to search"
              />
            </div>
            <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
              Search
            </button>
          </form>
          {searchResults.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>Search Results:</h3>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {searchResults.map((user) => (
                  <li key={user.id} style={{ borderBottom: '1px dashed #555', padding: '5px 0' }}>
                    ID: {user.id}, Name: {user.name}, Age: {user.age}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {searchResults.length === 0 && searchName.trim() !== '' && message.includes('Found 0 user(s)') && (
              <p style={{marginTop: '10px'}}>No users found with that name.</p>
          )}
        </section>


        {/* 全ユーザー一覧表示 */}
        <section style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h2>All Registered Users</h2>
          {users.length === 0 ? (
            <p>No users found. Try adding one!</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {users.map((user) => (
                <li key={user.id} style={{ borderBottom: '1px dashed #555', padding: '5px 0' }}>
                  ID: {user.id}, Name: {user.name}, Age: {user.age}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* PostFormに投稿成功時のコールバックとして fetchPosts を渡す */}
        {loginUser && <PostForm loginUser={loginUser} onPostSuccess={fetchPosts} />}

        {/* PostListに投稿データと更新用関数を渡す. */}
        <PostList 
          posts={posts} 
          isLoading={isLoading} 
          error={error} 
          onUpdate={fetchPosts}
        />

      </header>
    </div>
  );
}

export default App;