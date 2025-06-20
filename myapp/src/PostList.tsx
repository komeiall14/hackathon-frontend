import React, { useState, useEffect } from 'react'; 
import toast from 'react-hot-toast';
import { User as FirebaseUser } from "firebase/auth";
import { FaRegComment, FaTrashAlt, FaRegHeart, FaHeart, FaRetweet, FaQuoteLeft, FaEye, FaRegBookmark, FaBookmark, FaThumbsDown, FaRegThumbsDown } from 'react-icons/fa';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { QuoteRetweetModal } from './QuoteRetweetModal';
import { OriginalPost } from './OriginalPost';
import { OGPPreview } from './OGPPreview';
import { InitialAvatar } from './InitialAvatar'; 

export interface Post {
  post_id: string;
  user_id: string;
  user_name: string;
  user_profile_image_url: string | null;
  content: string | null;
  image_url: string | null;
  video_url: string | null;   
  media_type: 'image' | 'video' | null; 
  created_at: string;
  like_count: number;
  is_liked_by_me: boolean;
  reply_count: number;
  retweet_count: number;         
  is_retweeted_by_me: boolean;  
  is_bookmarked_by_me: boolean; 
  bad_count: number;        
  is_badded_by_me: boolean; 
  original_post?: Post;
}

interface PostListProps {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  onUpdate: () => void; 
  loginUser: FirebaseUser | null;
  title?: string; 
  onPostCreated?: (newPost: Post) => void; 
  onUpdateSinglePost: (updatedPost: Post) => void; 
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const extractFirstUrl = (text: string | null): string | null => {
  if (!text) return null;
  // URLを検出するための正規表現
  const urlRegex = /(https?:\/\/[^\s"'<>`]+)/g;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
};

export const PostList: React.FC<PostListProps> = ({ posts, isLoading, error, onUpdate, loginUser, title, onPostCreated, onUpdateSinglePost }) => {
  
  const navigate = useNavigate();

  const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const [visibleReplies, setVisibleReplies] = useState<Record<string, Post[]>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [quotingPost, setQuotingPost] = useState<Post | null>(null);
  const [showRetweetMenu, setShowRetweetMenu] = useState<string | null>(null);
  const [likingInProgress, setLikingInProgress] = useState<Set<string>>(new Set());
  const [baddingInProgress, setBaddingInProgress] = useState<Set<string>>(new Set()); 
  

  
  const handleLike = async (postToUpdate: Post) => {
    if (!loginUser) { toast.error('ログインしてください。'); return; }

    if (likingInProgress.has(postToUpdate.post_id)) return;
  
    const isLiked = postToUpdate.is_liked_by_me;
  
    const optimisticallyUpdatedPost = {
      ...postToUpdate,
      is_liked_by_me: !isLiked,
      like_count: isLiked ? postToUpdate.like_count - 1 : postToUpdate.like_count + 1,
    };
    onUpdateSinglePost(optimisticallyUpdatedPost);

    setLikingInProgress(prev => new Set(prev).add(postToUpdate.post_id));
    
    const token = await loginUser.getIdToken();
    const method = isLiked ? 'DELETE' : 'POST';
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/posts/like/${postToUpdate.post_id}`, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) { throw new Error('いいねの操作に失敗しました。'); }
    } catch (err: any) {
      toast.error(err.message);
      onUpdateSinglePost(postToUpdate);
    } finally {
      // 処理が成功しても失敗しても、最後に必ず実行される
      // 処理中の投稿IDをセットから削除し、ボタンの無効化を解除する
      setLikingInProgress(prev => {
        const next = new Set(prev);
        next.delete(postToUpdate.post_id);
        return next;
      });
    }
  };
  

  const handleBad = async (postToUpdate: Post) => {
    if (!loginUser) { toast.error('ログインしてください。'); return; }
    if (baddingInProgress.has(postToUpdate.post_id)) return;

    const isBadded = postToUpdate.is_badded_by_me;

    const optimisticallyUpdatedPost = {
      ...postToUpdate,
      is_badded_by_me: !isBadded,
      bad_count: isBadded ? postToUpdate.bad_count - 1 : postToUpdate.bad_count + 1,
    };
    onUpdateSinglePost(optimisticallyUpdatedPost);

    setBaddingInProgress(prev => new Set(prev).add(postToUpdate.post_id));

    const token = await loginUser.getIdToken();
    const method = isBadded ? 'DELETE' : 'POST';
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/posts/bad/${postToUpdate.post_id}`, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) { throw new Error('操作に失敗しました。'); }
    } catch (err: any) {
      toast.error(err.message);
      onUpdateSinglePost(postToUpdate);
    } finally {
      setBaddingInProgress(prev => {
        const next = new Set(prev);
        next.delete(postToUpdate.post_id);
        return next;
      });
    }
  };
  const handleBookmark = async (postToUpdate: Post) => {
    if (!loginUser) { toast.error('ログインしてください。'); return; }

    const isBookmarked = postToUpdate.is_bookmarked_by_me;
    const optimisticallyUpdatedPost = {
        ...postToUpdate,
        is_bookmarked_by_me: !isBookmarked,
    };
    onUpdateSinglePost(optimisticallyUpdatedPost);

    const token = await loginUser.getIdToken();
    const method = isBookmarked ? 'DELETE' : 'POST';
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/posts/bookmark/${postToUpdate.post_id}`, {
            method,
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) { throw new Error('ブックマーク操作に失敗しました。'); }
    } catch (err: any) {
        toast.error(err.message);
        onUpdateSinglePost(postToUpdate); // エラー時は元に戻す
    }
  };
  const handleReplyButtonClick = (postId: string) => {
    setReplyingToPostId(postId === replyingToPostId ? null : postId);
    setReplyContent('');
  };


  const handleReplySubmit = async (e: React.FormEvent, parentPost: Post) => {
    e.preventDefault();
    if (!replyContent.trim()) { toast.error("返信内容を入力してください。"); return; }
    if (!loginUser) { toast.error('ログインしてください。'); return; }
    
    // parentPostから投稿者IDを取得し、ボットかどうかを判定
    const isReplyingToBot = parentPost.user_id.startsWith('bot_');

    const token = await loginUser.getIdToken();

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/posts/reply/${parentPost.post_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: replyContent.trim(),
          user_name: loginUser.displayName || "名無しさん"
        }),
      });

      if (!response.ok) { throw new Error('リプライの投稿に失敗しました。'); }

      setReplyingToPostId(null);
      setReplyContent('');
      toast.success('リプライを投稿しました！');
      
      // もし返信相手がボットの場合
      if (isReplyingToBot) {
          // ユーザーに、AIが返信を準備中であることを伝える
          toast('🤖 AIが返信を考えています...', {
            duration: 3500, // 3.5秒間表示
            icon: '...',
          });
          // 4秒後にタイムライン全体を更新して、ボットの返信を表示する
          setTimeout(() => {
              onUpdate(); 
          }, 4000); // 4000ミリ秒 = 4秒
      } else {
          // 返信相手が人間の場合、即座にタイムラインを更新してリプライ数の変化などを反映
          onUpdate();
      }

    } catch (err: any) { 
        toast.error(err.message); 
    }
  };

  const handleGenerateReply = async (originalPostContent: string | null) => {
    if (!loginUser) { toast.error('ログインしてください。'); return; }
    
    if (!originalPostContent) {
      toast.error("元の投稿に内容がないため、返信を生成できません。");
      return;
    }

    const token = await loginUser.getIdToken();
    setIsGenerating(true);
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/posts/suggest-reply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ original_post_content: originalPostContent }),
        });
        if (!response.ok) { throw new Error('AIによる返信生成に失敗しました。'); }
        const data = await response.json();
        if (data.suggestion) { setReplyContent(String(data.suggestion)); }
    } catch (err: any) { toast.error(err.message); } finally { setIsGenerating(false); }
  };
  const handleDeletePost = async (postId: string) => {
    if (!loginUser) { toast.error('ログインしてください。'); return; }
    if (!window.confirm("この投稿を本当に削除しますか？")) { return; }
    const token = await loginUser.getIdToken();

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/posts/delete/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || '投稿の削除に失敗しました。');
      }
      toast.success('投稿を削除しました。');
      onUpdate();
    } catch (err: any) { toast.error(`エラー: ${err.message}`); }
  };


const handleRetweet = async (post: Post) => {
  if (!loginUser) { toast.error('ログインしてください。'); return; }
  const method = post.is_retweeted_by_me ? 'DELETE' : 'POST';
  try {
    const token = await loginUser.getIdToken();
    const response = await fetch(`${BACKEND_API_URL}/api/retweet/${post.post_id}`, {
      method, headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) { throw new Error('リツイート操作に失敗しました。'); }
    onUpdate(); // 成功したらリスト全体を更新
    toast.success(post.is_retweeted_by_me ? 'リツイートを取り消しました。' : 'リツイートしました！');
  } catch (err: any) {
    toast.error(err.message);
    // この操作はUIへの影響が大きいため、エラー時は全体更新で元の状態に戻すのが安全
    onUpdate();
  }
};

const renderContentWithLinks = (content: string | null) => {
  if (!content) {
    return null;
  }

  // ハッシュタグを検出するための正規表現
  const hashtagRegex = /(#[\p{L}\p{N}_]+)/gu;
  const parts = content.split(hashtagRegex);

  return (
    <p className="post-content">
      {parts.map((part, index) => {
        if (hashtagRegex.test(part)) {
          // ハッシュタグ部分の場合、Linkコンポーネントを生成
          return (
            <Link
              key={index}
              to={`/search?q=${encodeURIComponent(part)}`}
              className="hashtag-link"
              onClick={(e) => e.stopPropagation()} // 親要素のクリックイベントを抑制
            >
              {part}
            </Link>
          );
        }
        // 通常のテキスト部分
        return part;
      })}
    </p>
  );
};

if (isLoading && posts.length === 0) return <div style={{padding: '20px'}}>投稿を読み込んでいます...</div>;
  if (error) return <div style={{padding: '20px', color: 'red'}}>エラー: {error}</div>;

  return (
    <section className="post-list-section">
      {/* postsの件数が0より大きい場合のみ「投稿一覧」ヘッダーを表示 */}
      {title && <h2>{title}</h2>}
      <div>
        {posts.map((post) => {
          // STEP 1: URLを抽出
          const firstUrl = extractFirstUrl(post.content);
          
          return (
            // ★ 投稿全体をクリックすると詳細ページに遷移するラッパー
            <div key={post.post_id} className="post-item-wrapper" onClick={() => navigate(`/status/${post.post_id}`)}>
              
              {/* 通常のリツイートの場合に「〇〇さんがリツイートしました」ヘッダーを表示 */}
              {post.original_post && !post.content && (
                <div className="retweet-header">
                  <FaRetweet />
                  <span>{post.user_name}さんがリツイートしました</span>
                </div>
              )}

              <div className="post-item">
                <div className="post-avatar">
                  <Link to={`/users/${post.user_id}`} onClick={e => e.stopPropagation()}>
                    {post.user_profile_image_url && post.user_profile_image_url.startsWith('http') ? (
                       <img 
                        src={post.user_profile_image_url} 
                        alt={`${post.user_name}のアバター`} 
                      />
                    ) : (
                      <InitialAvatar name={post.user_name} size={48} />
                    )}
                  </Link>
                </div>
                <div className="post-body">
                  <div className="post-header">
                    <Link to={`/users/${post.user_id}`} onClick={e => e.stopPropagation()} style={{textDecoration: 'none', color: 'inherit'}}>
                      <span className="user-name">{post.user_name}</span>
                    </Link>
                    <span className="timestamp"> - {new Date(post.created_at).toLocaleString()}</span>
                  </div>
                  
                  {/* 引用リツイートの場合、自分のコメントを表示 */}
                  {post.original_post && post.content && (
                    <p className="post-content">{post.content}</p>
                  )}
                  
                  {/* 通常投稿の場合、本文と画像を表示 */}
                  {!post.original_post && (
                    <>
                      {renderContentWithLinks(post.content)}
                      {post.media_type === 'image' && post.image_url && (
                        <img src={post.image_url} alt="投稿画像" className="post-image"/>
                      )}
                      {post.media_type === 'video' && post.video_url && (
                        <video src={post.video_url} controls className="post-video"></video>
                      )}
                      
                      {/* STEP 2: OGPPreviewコンポーネントを呼び出し */}
                      {firstUrl && !post.image_url && !post.video_url && (
                        <OGPPreview url={firstUrl} />
                      )}
                    </>
                  )}

                  {/* リツイートまたは引用リツイートの場合、引用元の投稿を表示 */}
                  {post.original_post && (
                    <OriginalPost post={post.original_post} />
                  )}


                  <div className="post-actions">
                  <button onClick={(e) => { e.stopPropagation(); handleReplyButtonClick(post.post_id); }}>
                    <FaRegComment /> <span>{post.reply_count}</span>
                  </button>

                  {loginUser && (loginUser.uid === post.user_id || post.user_id.startsWith('bot_')) && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.post_id); }} title="削除">
                          <FaTrashAlt />
                      </button>
                  )}
                  
                  <div style={{ position: 'relative' }}>
                    <button 
                      className={`retweet-button ${post.is_retweeted_by_me ? 'retweeted' : ''}`}
                      onClick={(e) => { 
                        e.stopPropagation();
                        setShowRetweetMenu(showRetweetMenu === post.post_id ? null : post.post_id);
                      }} 
                      title="リツイート"
                    >
                      <FaRetweet />
                      <span>{post.retweet_count > 0 ? post.retweet_count : ''}</span>
                    </button>
                    
                    {showRetweetMenu === post.post_id && (
                      <>
                        <div className="menu-overlay-transparent" onClick={(e) => {e.stopPropagation(); setShowRetweetMenu(null);}}></div>
                        <div className="retweet-menu">
                          <button className="retweet-menu-item" onClick={(e) => {e.stopPropagation(); handleRetweet(post); setShowRetweetMenu(null);}}>
                            <FaRetweet />
                            <span style={{ marginLeft: '8px' }}>
                              {post.is_retweeted_by_me ? 'リツイートを取り消す' : 'リツイート'}
                            </span>
                          </button>
                          <button className="retweet-menu-item" onClick={(e) => {e.stopPropagation(); setQuotingPost(post); setShowRetweetMenu(null);}}>
                            <FaQuoteLeft />
                            <span style={{ marginLeft: '8px' }}>引用リツイート</span>
                          </button>
                          <button 
                            className="retweet-menu-item" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/status/${post.post_id}/quotes`);
                              setShowRetweetMenu(null);
                            }}
                          >
                            <FaEye />
                            <span style={{ marginLeft: '8px' }}>引用リツイートを見る</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    className={`like-button ${post.is_liked_by_me ? 'liked' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleLike(post); }} 
                    disabled={likingInProgress.has(post.post_id)}
                  >
                    {post.is_liked_by_me ? <FaHeart /> : <FaRegHeart />} <span>{post.like_count}</span>
                  </button>

                  <button
                    className={`bad-button ${post.is_badded_by_me ? 'badded' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleBad(post); }}
                    disabled={baddingInProgress.has(post.post_id)}
                  >
                    {post.is_badded_by_me ? <FaThumbsDown /> : <FaRegThumbsDown />} <span>{post.bad_count}</span>
                  </button>

                  <button
                      className={`bookmark-button ${post.is_bookmarked_by_me ? 'bookmarked' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleBookmark(post); }}
                  >
                      {post.is_bookmarked_by_me ? <FaBookmark /> : <FaRegBookmark />}
                  </button>
                </div>

                
                {/* インラインのリプライフォーム */}
                {replyingToPostId === post.post_id && (
                  <form onSubmit={(e) => { e.stopPropagation(); handleReplySubmit(e, post); }} onClick={e => e.stopPropagation()} style={{ marginTop: '15px' }}>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="返信を入力..."
                      style={{ width: '95%', height: '60px', padding: '8px', display: 'block', backgroundColor: '#203444', color: 'white', border: '1px solid #38444d' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                      <button type="button" onClick={(e) => {e.stopPropagation(); handleGenerateReply(post.content)}} disabled={isGenerating}>
                        {isGenerating ? '生成中...' : '🤖 AIで返信を生成'}
                      </button>
                      <div>
                        <button type="button" onClick={(e) => {e.stopPropagation(); setReplyingToPostId(null)}} style={{ marginRight: '10px' }}>キャンセル</button>
                        <button type="submit">返信する</button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
      
      {/* 引用リツイート用モーダル */}
      {quotingPost && loginUser && (
        <QuoteRetweetModal 
          post={quotingPost}
          loginUser={loginUser}
          onClose={() => setQuotingPost(null)}
          onQuoteSuccess={(newQuotePost) => {
            onUpdate();
            setQuotingPost(null);
          }}
        />
      )}
    </section>
  );
};