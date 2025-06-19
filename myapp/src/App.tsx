import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
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
import { FaHome, FaUser, FaEnvelope, FaBell, FaBookmark, FaRobot, FaUsers } from 'react-icons/fa';
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
  const [botTopic, setBotTopic] = useState<string>(''); 
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true); // さらに読み込む投稿があるか
  const [feedType, setFeedType] = useState<'forYou' | 'following'>('forYou'); 
  const [isContinuousBotMode, setIsContinuousBotMode] = useState(false); // 継続モードのON/OFF状態
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // タイマーのIDを保持
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);
 
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
  

  const [isCreatingBot, setIsCreatingBot] = useState(false); // Bot生成中の状態を管理

  // handleCreateBotAndPost関数を以下のように修正
  const handleCreateBotAndPost = async (shouldReload: boolean) => {
    setIsCreatingBot(true);
    if (shouldReload) {
      toast.loading('AIボットを生成しています...');
    }

    try {
      // ★★★ fetchの引数を修正 ★★★
      const response = await fetch(`${BACKEND_API_URL}/api/bot/create-and-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // ★ ヘッダーを追加
        },
        body: JSON.stringify({ topic: botTopic }), // ★ トピックをJSON形式で送信
      });

      if (!response.ok) {
        throw new Error('AIボットの生成に失敗しました。');
      }

      toast.dismiss();
      toast.success('新しいAIボットが投稿しました！');
      
      if (shouldReload) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        triggerRefresh();
      }

    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message);
    } finally {
      setIsCreatingBot(false);
    }
  };

  // handleCreateBotAndPost関数の下あたりに、以下の関数を丸ごと追加

  const toggleContinuousBotMode = () => {
    // もし現在、継続モードがONなら、停止処理を行う
    if (isContinuousBotMode) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // タイマーを停止
        intervalRef.current = null;
      }
      setIsContinuousBotMode(false); // モードをOFFに
      toast.success("AIボットの継続投稿を停止しました。");
    } 
    // もし現在、継続モードがOFFなら、開始処理を行う
    else {
      setIsContinuousBotMode(true); // モードをONに
      toast.success("AIボットの継続投稿を開始しました。5秒ごとに投稿されます。");
      
      // まず一度すぐに実行
      void handleCreateBotAndPost(false);

      // その後、5秒ごとに繰り返し実行
      intervalRef.current = setInterval(() => {
        void handleCreateBotAndPost(false); // ページリロードなしで実行
      }, 5000); // 5秒
    }
  };
  // ▲▲▲【ここまで追加】▲▲▲
  // ▼▼▼ 変更点2: useCallbackの依存配列を修正 ▼▼▼
// App.tsx

  const fetchPosts = useCallback(async (isInitialLoad: boolean, currentUser: FirebaseUser | null) => {
    setIsLoading(true);
    
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) { console.error("IDトークンの取得に失敗:", error); }
    }

    // ★ feedTypeに応じてAPIエンドポイントを動的に変更
    const endpoint = feedType === 'forYou' 
      ? `${BACKEND_API_URL}/posts` 
      : `${BACKEND_API_URL}/api/posts/following`;

    const currentOffset = isInitialLoad ? 0 : offset;

    try {
      // ★ 決定したエンドポイントにリクエスト
      const response = await fetch(`${endpoint}?limit=${PAGE_SIZE}&offset=${currentOffset}`, { headers });
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
    } finally {
      setIsLoading(false);
    }
  // ★ 依存配列に feedType を追加
  }, [BACKEND_API_URL, offset, loginUser, feedType]);

    // ★ タイムラインの種類が変更された時に投稿をリフレッシュする
  useEffect(() => {
    // ログイン状態が確定してから実行
    if (loginUser === undefined) return; 

    // 投稿リストをリセット
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    // 新しいタイムラインのデータを最初から取得
    fetchPosts(true, loginUser);
  }, [feedType, loginUser]); // ★ feedTypeまたはloginUserの変更を監視
    
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

  // ▼▼▼ このuseEffectを丸ごと追加 ▼▼▼
  useLayoutEffect(() => {
    // ページ遷移が完了した後に実行される
    
    // タイムラインページ('/')に戻ってきた場合
    if (location.pathname === '/') {
      // sessionStorageに保存されたスクロール位置を取得
      const savedScrollPos = sessionStorage.getItem('timelineScrollPos');
      if (savedScrollPos) {
        // 保存された位置にスクロールを復元
        window.scrollTo(0, parseInt(savedScrollPos, 10));
      }
    }
  }, [location.pathname]); // location.pathnameが変わるたびに実行

  useEffect(() => {
    // タイムラインページ('/')から離れる時に、現在のスクロール位置を保存する
    const handleScroll = () => {
      if (location.pathname === '/') {
        sessionStorage.setItem('timelineScrollPos', String(window.scrollY));
      }
    };
    
    // スクロールイベントを監視
    window.addEventListener('scroll', handleScroll);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);
  // ▲▲▲ このuseEffectを丸ごと追加 ▲▲▲

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

  useEffect(() => {
    // このコンポーネントがアンマウント（ページから消える）される時に実行される処理
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // タイマーが動いていれば停止する
      }
    };
  }, []); 

  useEffect(() => {
    // 初回レンダリング時は実行しない
    if (refreshKey === 0) {
      return;
    }

    // タイムラインの状態を初期化し、最新の投稿を先頭から取得する
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    fetchPosts(true, loginUser);

  }, [refreshKey]); // refreshKey の変更を監視

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
        <div className="top-right-auth">
          <LoginForm 
            loginUser={loginUser} 
            onLoginSuccess={() => {
              fetchAllUsers();
              triggerRefresh();
            }} 
          />
        </div>
        
        
        <aside className="left-sidebar">
          {/* ★ 前回の修正で追加した sidebar-nav-section と sidebar-action-section の囲いを削除し、シンプルな構造に戻します */}
          <h2>ナビゲーション</h2>

          <Link 
            to="/" 
            className="nav-link" 
            onClick={() => {
              if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                triggerRefresh();
              }
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

          <Link to="/space" className="nav-link">
              <FaUsers />
              <span style={{ marginLeft: '16px' }}>スペース</span>
          </Link>

          {/* ★★★ LoginFormはここから上記(.top-right-auth)へ移動しました ★★★ */}
          
          <div className="bot-topic-input-container">
            <label htmlFor="botTopic">AIボットの投稿トピック (任意)</label>
            <input
                type="text"
                id="botTopic"
                value={botTopic}
                onChange={(e) => setBotTopic(e.target.value)}
                placeholder="例: サッカー, アイドル"
            />
          </div>
          
          <button 
              className="sidebar-button"
              onClick={() => handleCreateBotAndPost(true)}
              disabled={isCreatingBot}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaRobot style={{ marginRight: '8px' }}/>
              <span>{isCreatingBot ? '生成中...' : 'AIボット投稿'}</span>
            </div>
          </button>

          <button
            className="sidebar-button"
            onClick={toggleContinuousBotMode}
            style={{ 
              backgroundColor: isContinuousBotMode ? '#e0245e' : '#1DA1F2',
              marginTop: '10px'
            }}
          >
            {isContinuousBotMode ? 'AIボット継続投稿 停止' : 'AIボット継続投稿 開始'}
          </button>
          
          <button 
              className="sidebar-button" 
              onClick={() => {
                  fetchAllUsers();
                  setShowUserManagement(true);
              }}
              style={{ marginTop: '10px' }}
          >
              ユーザー管理
          </button>
        </aside>
        <main className="main-content">
            {/* ▼▼▼ このOutletのcontextを修正 ▼▼▼ */}
            <Outlet context={{ 
              // 既存のcontext
              loginUser, 
              triggerRefresh,

              // タイムライン用のstateと関数を追加で渡す
              posts,
              isLoading: isLoading && posts.length === 0, // 初回ロード中のみisLoadingをtrueにする
              error,
              hasMore,
              bottomRef: ref, // useInView の ref を渡す
              onPostCreation: handlePostCreation,
              onUpdateSinglePost: handleUpdateSinglePost,
              onUpdate: () => {
                setPosts([]);
                setOffset(0);
                setHasMore(true);
                fetchPosts(true, loginUser);
              },
              feedType,
              setFeedType,
            }} />
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