import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { LoginForm } from './LoginForm';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; 
import { fireAuth } from './firebase'; 
import { PostList, Post } from './PostList';
import { PostForm } from './PostForm';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Routes, Route, Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { UserProfile } from './UserProfile';
import { SearchResults } from './SearchResults';
import { FaHome, FaUser, FaEnvelope, FaBell, FaBookmark } from 'react-icons/fa'; // ★ アイコンを変更・追加
import { PostDetailPage } from './PostDetailPage'; 
import { QuoteRetweetsPage } from './QuoteRetweetsPage'; 
import { useInView } from 'react-intersection-observer'; 
import { FollowingPage } from './FollowingPage'; // ▼▼▼ 追加
import { FollowersPage } from './FollowersPage'; // ▼▼▼ 追加
import { MessagesPage } from './MessagesPage';
import { Trends } from './Trends'; 


interface User {
  id: string;
  name: string;
  age: number | null;
  firebase_uid: string | null;
}

const PAGE_SIZE = 20; // 1ページあたりの投稿数

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
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true); // さらに読み込む投稿があるか
  const { ref } = useInView({
    threshold: 0,
    skip: posts.length === 0,
    // `onChange`を使い、監視対象の表示状態が「変化した瞬間」にのみ処理を実行する
    onChange: (inView, entry) => {
      // 画面内に入り(inView=true)、さらに読み込むデータがあり(hasMore=true)、
      // 現在ロード中でない(!isLoading)場合にのみ、次のページを取得する
      if (inView && hasMore && !isLoading) {
        void fetchPosts(false, loginUser);
      }
    },
  });


  // ▼▼▼ 変更点2: useCallbackの依存配列を修正 ▼▼▼
  const fetchPosts = useCallback(async (isInitialLoad: boolean, currentUser: FirebaseUser | null) => {
    // 呼び出し元のuseEffectでisLoadingをチェックするため、ここでのチェックは不要
    // if (isLoading && !isInitialLoad) return;

    setIsLoading(true);
    
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) { console.error("IDトークンの取得に失敗:", error); }
    }

    const currentOffset = isInitialLoad ? 0 : offset;

    try {
      const response = await fetch(`${BACKEND_API_URL}/posts?limit=${PAGE_SIZE}&offset=${currentOffset}`, { headers });
      if (!response.ok) throw new Error('データの取得に失敗しました。');
      
      const data: Post[] = await response.json();

      if (isInitialLoad) {
        setPosts(data);
      } else {
        setPosts(prevPosts => [...prevPosts, ...data]);
      }
      
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
      
      setOffset(currentOffset + data.length);

    } catch (err: any) {
      setError(err.message);
      // toast.errorはuseEffect側でハンドリングした方が良い場合もある
    } finally {
      setIsLoading(false);
    }
  // ▼▼▼ 依存配列から `isLoading` を削除する ▼▼▼
  }, [BACKEND_API_URL, offset, setPosts, setHasMore, setOffset, setIsLoading, setError]);
  
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

  useEffect(() => {
    // ログインしていない場合は何もしない
    if (!loginUser) {
        setUnreadCount(0); // ログアウトしたらカウントをリセット
        return;
    }

    const fetchUnreadCount = async () => {
      try {
        const token = await loginUser.getIdToken();
        const response = await fetch(`${BACKEND_API_URL}/api/notifications/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        setUnreadCount(data.count);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    // 最初に一度取得
    fetchUnreadCount(); 

    // 30秒ごとに未読件数をポーリング（定期取得）
    const intervalId = setInterval(fetchUnreadCount, 30000); 

    // コンポーネントがアンマウントされる時にインターバルをクリア
    return () => clearInterval(intervalId);

  }, [loginUser]); // loginUserが変わった時（ログイン/ログアウト時）に実行
  
  // 通知ページにいる場合は、カウントを0にする
  useEffect(() => {
    if (location.pathname === '/notifications') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  // ★ 変更点2: ログイン状態が変化した際に、そのユーザー情報(user)をfetchPostsに渡すように修正
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      setLoginUser(user);
      setPosts([]);
      setOffset(0);
      setHasMore(true);
      fetchPosts(true, user); // 引数を2つ渡す
    });
    return () => unsubscribe();
  }, []); // このuseEffectは初回のみ実行するため、依存配列は空

  const handlePostCreation = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleUpdateSinglePost = (updatedPost: Post) => {
    setPosts(currentPosts => 
      currentPosts.map(p => p.post_id === updatedPost.post_id ? updatedPost : p)
    );
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

          {/* ▼▼▼ このLinkコンポーネントを修正 ▼▼▼ */}
          <Link 
            to="/" 
            className="nav-link" 
            onClick={() => {
              // もし既にホーム('/')にいる場合
              if (location.pathname === '/') {
                // ページの一番上にスムーズにスクロール
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
                // さらに、最新の投稿を取得するためにデータを再読み込み
                void fetchPosts(true, loginUser);
              }
              // 他のページにいる場合は、Linkのデフォルトの挙動（ホームへの画面遷移）に任せる
            }}
          >
            <FaHome />
            <span style={{ marginLeft: '16px' }}>ホーム</span>
          </Link>

          {loginUser && (
            <Link to={`/users/${loginUser.uid}`} className="nav-link">
              <FaUser />
              <span style={{ marginLeft: '16px' }}>プロフィール</span>
            </Link>
          )}

          <Link to="/messages" className="nav-link">
            <FaEnvelope />
            <span style={{ marginLeft: '16px' }}>メッセージ</span>
          </Link>

          <Link to="/notifications" className="nav-link">
            <div className="nav-link-icon-wrapper">
              <FaBell />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </div>
            <span style={{ marginLeft: '16px' }}>通知</span>
          </Link>

          <Link to="/bookmarks" className="nav-link">
              <FaBookmark />
              <span style={{ marginLeft: '16px' }}>ブックマーク</span>
          </Link>

          <LoginForm 
            onLoginSuccess={() => {
              fetchAllUsers();
              void fetchPosts(true, fireAuth.currentUser); 
            }} 
          />

          <button className="sidebar-button" onClick={() => setShowUserManagement(true)}>
            ユーザー管理
          </button>
        </aside>      
        <main className="main-content">
            <Outlet context={{ loginUser }} />
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
          <Trends />
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