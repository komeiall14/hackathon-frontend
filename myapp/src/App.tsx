import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import './App.css';
import './ExperienceControl.css'; 
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
import { FollowingPage } from './FollowingPage'; 
import { FollowersPage } from './FollowersPage';
import { MessagesPage } from './MessagesPage';
import { Trends } from './Trends'; 
import { RecommendedUsers } from './RecommendedUsers'; 
import { ExplanationModal } from './ExplanationModal'; 
import { EvaluationResultModal } from './EvaluationResultModal'; 
import { InitialAvatar } from './InitialAvatar';
import { UserProfileData } from './UserProfile'; 
import { FlameEffect } from './FlameEffect';
import { NotificationResponse } from './NotificationsPage';
import { UserAvatar } from './UserAvatar';


interface User {
  id: string;
  name: string;
  age: number | null;
  firebase_uid: string | null;
  profile_image_url: string | null; 
}

interface ActiveSpace {
  id: string;
  host_id: string;
  host_name: string;
  topic: string;
}

const PAGE_SIZE = 20; // 1ページあたりの投稿数

function App() {
  const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

  const [users, setUsers] = useState<User[]>([]); 
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
  const [newSpaceCount, setNewSpaceCount] = useState(0);
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

  const [loginUserProfile, setLoginUserProfile] = useState<UserProfileData | null>(null);

  useEffect(() => {
    const fetchLoginUserProfile = async () => {
      if (!loginUser) return;
      const token = await loginUser.getIdToken();
      const res = await fetch(`${BACKEND_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLoginUserProfile(data);
      }
    };
    fetchLoginUserProfile();
  }, [loginUser]);
  

  const [isCreatingBot, setIsCreatingBot] = useState(false); // Bot生成中の状態を管理
  const [showExplanationButton, setShowExplanationButton] = useState(false);

  const [experienceMode, setExperienceMode] = useState<'none' | 'buzz' | 'flame'>('none');
  const [experienceTargetPost, setExperienceTargetPost] = useState<Post | null>(null);
  const experienceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{score: number, review: string} | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastExplanationAttempt, setLastExplanationAttempt] = useState('');
  const [showStopButton, setShowStopButton] = useState(false);

  useEffect(() => {
    // showExplanationButton の値が変化するたびに、その値をコンソールに出力します
    console.log("showExplanationButton の現在の値:", showExplanationButton);
  }, [showExplanationButton]); // showExplanationButtonが変わるたびに実行

  const handleCreateBotAndPost = async (shouldReload: boolean) => {
    setIsCreatingBot(true);
    if (shouldReload) {
      toast.loading('AIボットを生成しています...');
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/bot/create-and-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',  
        },
        body: JSON.stringify({ topic: botTopic }), // ★ トピックをJSON形式で送信
      });

      if (!response.ok) {
        throw new Error('AIボットの生成に失敗しました。');
      }

      toast.dismiss();
      toast.success('新しいAIボットが投稿しました!');
      
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

    // 体験モード中は1.5秒ごと、通常時は30秒ごとに未読件数をポーリング
    const interval = experienceMode !== 'none' ? 1500 : 30000;
    
    const intervalId = setInterval(fetchUnreadCount, interval); 

    // コンポーネントがアンマウントされる時、または依存配列の値が変わる時にインターバルをクリア
    return () => clearInterval(intervalId);

  }, [loginUser, experienceMode]); // loginUserが変わった時（ログイン/ログアウト時）に実行
  
  // 通知ページにいる場合は、カウントを0にする
  useEffect(() => {
    if (location.pathname === '/notifications') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // 体験モードを停止する共通関数
  const stopExperience = useCallback(() => {
    if (experienceIntervalRef.current) {
        clearInterval(experienceIntervalRef.current);
        experienceIntervalRef.current = null;
    }
    const currentMode = experienceMode;
    setExperienceMode('none');
    setExperienceTargetPost(null);
    setShowExplanationButton(false); 
    setShowStopButton(false);    

    if (currentMode === 'buzz') toast.success("バズり体験が終了しました。");
    if (currentMode === 'flame') toast.success("炎上が鎮火しました。");
  }, [experienceMode]);

  // バズり体験を開始する関数
  const startBuzzExperience = (post: Post) => {
    if (!loginUser) return;
    setShowStopButton(false);
    setExperienceMode('buzz');
    setExperienceTargetPost(post);
    onPostSuccess(post);

    setTimeout(() => {
      setShowStopButton(true);
    }, 3000);

    toast.success("投稿がシェアされ始めました！", { duration: 3000 });

    // 5秒後にバズりを開始
    setTimeout(() => {
        toast.success("バズり体験スタート！20秒間、通知が鳴り止みません！", { duration: 4000 });

        // 20秒後に体験を終了させるタイマー
        const experienceTimeoutId = setTimeout(() => {
            stopExperience();
        }, 20000);

        // ボットアクションを開始
        experienceIntervalRef.current = setInterval(async () => {
          const currentUser = fireAuth.currentUser;
          if (!currentUser) {
              stopExperience();
              return;
          }
          try {
              const response = await fetch(`${BACKEND_API_URL}/api/bot/experience-action`, { 
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await currentUser.getIdToken()}` },
                  body: JSON.stringify({ targetPostId: post.post_id, type: "positive" }),
              });

              const result = await response.json(); // APIからの応答をパース
              // リプライ、リツイート、引用の場合のみタイムラインをリフレッシュする
              if (result.action === "positive_reply" || result.action === "retweet" || result.action === "positive_quote") {
                  triggerRefresh();
              }
          } catch (err) {
              console.error("Bot action failed:", err);
          }
      }, 1000); 

    }, 2500);
  };

  // 炎上体験を開始する関数
  const startFlameExperience = (post: Post) => {
    if (!loginUser) return;
    setShowStopButton(false);
    setExperienceMode('flame');
    setExperienceTargetPost(post);
    onPostSuccess(post);

  // ★ 5秒後にボタンを表示する
    setTimeout(() => {
        setShowStopButton(true);
    }, 6000);

    toast.error("投稿が多くの人の目に留まり、様々な意見が寄せられ始めています...", { duration: 2500 });

    // 5秒後に炎上(ボットのアクション)を開始
    setTimeout(() => {
        toast.error("炎上体験スタート！的確な弁明で鎮火させましょう！", { duration: 4000 });

        experienceIntervalRef.current = setInterval(async () => {
          const currentUser = fireAuth.currentUser;
          if (!currentUser) {
              stopExperience();
              return;
          }
          try {
              const response = await fetch(`${BACKEND_API_URL}/api/bot/experience-action`, { 
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await currentUser.getIdToken()}` },
                  body: JSON.stringify({ targetPostId: post.post_id, type: "negative" }),
              });

              const result = await response.json(); // APIからの応答をパース
              // リプライ、リツイート、引用の場合のみタイムラインをリフレッシュする
              if (result.action === "negative_reply" || result.action === "retweet" || result.action === "negative_quote") {
                  triggerRefresh();
              }
            } catch (err) {
                console.error("Bot action failed:", err);
            }
        }, 1000);
    }, 2500);

    setLastExplanationAttempt('');

    //8秒後に「弁明する」ボタンを表示させるタイマー
    setTimeout(() => {
        setShowExplanationButton(true);
    }, 6000); // 8000ミリ秒 = 8秒
  };

  // 弁明をバックエンドに送って評価してもらう関数

  const handleExplanationSubmit = async (explanationText: string) => {
    if (!experienceTargetPost || !loginUser) return;

    setLastExplanationAttempt(explanationText);
    
    setIsEvaluating(true);
    setIsExplanationModalOpen(false);
    toast.loading("Geminiがあなたの弁明を評価しています...");

    try {
      const token = await loginUser.getIdToken();

      const postResponse = await fetch(`${BACKEND_API_URL}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          content: `【弁明】\n${explanationText}`,
          original_post_id: experienceTargetPost.post_id
        }),
      });
      if (!postResponse.ok) throw new Error("弁明の投稿に失敗しました。");
      const explanationPost = await postResponse.json();
      triggerRefresh();

      // 評価APIを呼び出す際のヘッダーを修正しました
      const evalResponse = await fetch(`${BACKEND_API_URL}/api/gemini/evaluate-explanation`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // 'Authorization'の値に "Bearer " という接頭辞を追加
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          originalPostId: experienceTargetPost.post_id,
          explanationPostId: explanationPost.post_id,
          originalContent: experienceTargetPost.content,
          explanationContent: explanationText
        })
      });

      if (!evalResponse.ok) {
          // 401エラーの場合は、より具体的なメッセージを出す
          if (evalResponse.status === 401) {
              throw new Error("評価APIの認証に失敗しました。再度ログインしてお試しください。");
          }
          throw new Error("弁明の評価に失敗しました。");
      }
      
      const result = await evalResponse.json();
      setEvaluationResult(result);
      setIsEvaluationModalOpen(true);
      
      if (result.score >= 70) {
        stopExperience();
        setLastExplanationAttempt('');
      } else {
        toast.error("残念ながら、弁明は受け入れられませんでした。");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsEvaluating(false);
      toast.dismiss();
    }
  };

  useEffect(() => {
    return () => {
      // コンポーネントが消える時に、実行中のタイマーをすべてクリアする
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (experienceIntervalRef.current) clearInterval(experienceIntervalRef.current);
    };
  }, []); 

  // 投稿成功時の共通処理
  const onPostSuccess = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    window.scrollTo(0, 0);
  };

  // 通知ポーリング用のuseEffectを修正
  useEffect(() => {
    if (!loginUser) {
        setUnreadCount(0);
        setNewSpaceCount(0); // ログアウト時にスペース通知もリセット
        return;
    }

    const fetchNotifications = async () => {
      try {
        const token = await loginUser.getIdToken();
        const response = await fetch(`${BACKEND_API_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) return;

        const data: NotificationResponse[] = await response.json();
        
        // --- 従来の通知(いいね、返信など)の未読件数を更新 ---
        const generalNotifications = data.filter(n => n.type !== 'space_started');
        const newUnreadCount = generalNotifications.filter(n => !n.is_read).length;
        setUnreadCount(newUnreadCount);

        // --- 新しいスペース通知の件数を計算 ---
        const spaceNotifications = data.filter(n => n.type === 'space_started');
        // 最後にスペース一覧を見た時刻をlocalStorageから取得
        const lastViewTime = localStorage.getItem('lastSpacesViewTime');
        
        let unseenSpaces = 0;
        if (lastViewTime) {
          // 最後に見てから後に作成されたスペース通知をカウント
          unseenSpaces = spaceNotifications.filter(n => new Date(n.created_at) > new Date(lastViewTime)).length;
        } else {
          // まだ一度も見ていない場合は、全てのスペース通知をカウント
          unseenSpaces = spaceNotifications.length;
        }
        setNewSpaceCount(unseenSpaces);

      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications(); 
    
    // ポーリング間隔
    const interval = experienceMode !== 'none' ? 5000 : 30000;
    const intervalId = setInterval(fetchNotifications, interval); 

    return () => clearInterval(intervalId);


  }, [loginUser, experienceMode]); 

    const handleSpacesLinkClick = () => {
    // バッジのカウントをリセット
    setNewSpaceCount(0);
    // 現在時刻を「最終閲覧時刻」としてlocalStorageに保存
    localStorage.setItem('lastSpacesViewTime', new Date().toISOString());
  };

  const [activeHostIds, setActiveHostIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchActiveHosts = async () => {
      // ログインしていない場合は、そもそもリクエストを送らない
      if (!loginUser) {
        setActiveHostIds(new Set()); // ホストリストをクリア
        return;
      }

      try {
        // 認証に必要なIDトークンを取得
        const token = await loginUser.getIdToken();

        // fetchリクエストにAuthorizationヘッダーを追加
        const response = await fetch(`${BACKEND_API_URL}/api/spaces/active`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          // 401エラーの場合はコンソールにエラーを出す
          if (response.status === 401) {
            console.error("Failed to fetch active hosts: Unauthorized (401). Check if token is valid.");
          }
          return;
        }
        
        const activeSpaces: ActiveSpace[] = await response.json();
        const hostIds = new Set(activeSpaces.map(space => space.host_id));
        setActiveHostIds(hostIds);

      } catch (error) {
        console.error("Failed to fetch active hosts:", error);
      }
    };

    fetchActiveHosts();
    const intervalId = setInterval(fetchActiveHosts, 20000);

    return () => clearInterval(intervalId);
  }, [loginUser]); // ★★★ 依存配列にloginUserを追加 ★★★

  return (
    <>
      {experienceMode === 'flame' && <FlameEffect />}
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
              <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loginUser.photoURL && loginUser.photoURL.startsWith('http') ? (
                  <img
                    src={loginUser.photoURL}
                    alt="your avatar"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <InitialAvatar name={loginUser.displayName || ''} size={28} />
                )}
              </div>
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

          <Link to="/spaces" className="nav-link" onClick={handleSpacesLinkClick}>
            <div className="nav-link-icon-wrapper">
              <FaUsers />
              {newSpaceCount > 0 && (
                <span className="notification-badge">{newSpaceCount > 99 ? '99+' : newSpaceCount}</span>
              )}
            </div>
            <span style={{ marginLeft: '16px' }}>スペース</span>
          </Link>

          
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
            <Outlet context={{ 
              // 既存のcontext
              loginUser, 
              posts,
              isLoading: isLoading && posts.length === 0,
              error,
              hasMore,
              activeHostIds,
              bottomRef: ref,
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

              // 体験モード用のprops
              experienceMode,
              experienceTargetPost,
              showExplanationButton, 
              openExplanationModal: (post: Post) => {
                setExperienceTargetPost(post);
                setIsExplanationModalOpen(true);
              },
              onBuzzStart: startBuzzExperience,
              onFlameStart: startFlameExperience,
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
          <RecommendedUsers loginUser={loginUser} />
        </aside>
      </div>

      {experienceMode !== 'none' && showStopButton && (
        <div className={`experience-control-container ${experienceMode === 'flame' ? 'flame' : ''}`}>
            <span className="experience-control-label">
                {experienceMode === 'buzz' ? '🎉 バズり体験中 🎉' : '🔥 炎上体験中 🔥'}
            </span>
            <button onClick={stopExperience} className="experience-control-button">
                強制終了
            </button>
        </div>
      )}

      {isExplanationModalOpen && experienceTargetPost && (
        <ExplanationModal
            originalPost={experienceTargetPost}
            initialText={lastExplanationAttempt}
            onClose={() => setIsExplanationModalOpen(false)}
            onSubmit={handleExplanationSubmit}
            isSubmitting={isEvaluating}
        />
      )}

      {isEvaluationModalOpen && evaluationResult && (
        <EvaluationResultModal
            score={evaluationResult.score}
            review={evaluationResult.review}
            onClose={() => {
              setIsEvaluationModalOpen(false);
              // 不合格だった場合、弁明モーダルを再度開く
              if (evaluationResult.score < 70) {
                setTimeout(() => {
                  setIsExplanationModalOpen(true);
                }, 200); // モーダルが閉じるアニメーションを待つ
              }
            }}
        />
      )}

      {showUserManagement && (
        <div className="modal-overlay" onClick={() => setShowUserManagement(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-button" onClick={() => setShowUserManagement(false)}>×</button>
            <h2>ユーザー管理</h2>
            {message && <p style={{ color: 'yellow', padding: '0 15px' }}>{message}</p>}           

            <section className="modal-section">
              <h3>All Registered Users</h3>
              <div className="user-list">
                {users.length === 0 ? <p>No users found.</p> : (
                  <div>
                    {users.filter(user => user.firebase_uid && !user.firebase_uid.startsWith('bot_')).map((user) => (
                      // 1. 各ユーザーがプロフィールページへの<Link>になる
                      <Link 
                        to={`/users/${user.firebase_uid}`} 
                        key={user.id} 
                        className="user-management-item"
                        onClick={() => setShowUserManagement(false)}
                      >
                        <div className="user-management-avatar">
                          {user.profile_image_url && user.profile_image_url.startsWith('http') ? (
                            <img 
                              src={user.profile_image_url} 
                              alt={user.name}
                              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                            />
                          ) : (
                            <InitialAvatar name={user.name} size={40} />
                          )}
                        </div>
                        <span className="user-management-name">{user.name}</span>
                      </Link>
                  ))}
                  </div>
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