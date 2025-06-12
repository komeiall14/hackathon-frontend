import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { User as FirebaseUser } from "firebase/auth";
import { Link } from 'react-router-dom';
import { FaRegComment, FaTrashAlt, FaRegHeart, FaHeart } from 'react-icons/fa';

// ★ 変更点1: Postの型定義に firebase_uid を追加
// これにより、投稿データに必ずFirebase UIDが含まれるようになります。
export interface Post {
  post_id: string;
  user_id: string; // これはFirebase UIDです
  user_name: string;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  is_liked_by_me: boolean;
  reply_count: number;
}

interface PostListProps {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  onUpdate: () => void;
  loginUser: FirebaseUser | null;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const PostList: React.FC<PostListProps> = ({ posts, isLoading, error, onUpdate, loginUser }) => {
  const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const [visibleReplies, setVisibleReplies] = useState<Record<string, Post[]>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!loginUser) { toast.error('ログインしてください。'); return; }
    const token = await loginUser.getIdToken();
    const method = isLiked ? 'DELETE' : 'POST';
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/posts/like/${postId}`, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) { throw new Error('いいねの操作に失敗しました。'); }
      onUpdate();
    } catch (err: any) { toast.error(err.message); }
  };
  
  const handleReplyButtonClick = (postId: string) => {
    setReplyingToPostId(postId === replyingToPostId ? null : postId);
    setReplyContent('');
  };

  const handleReplySubmit = async (e: React.FormEvent, parentPostId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) { toast.error("返信内容を入力してください。"); return; }
    if (!loginUser) { toast.error('ログインしてください。'); return; }
    const token = await loginUser.getIdToken();

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/posts/reply/${parentPostId}`, {
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
      onUpdate();
      toast.success('リプライを投稿しました！'); 
    } catch (err: any) { toast.error(err.message); }
  };


  const toggleRepliesView = async (postId: string) => {
    if (visibleReplies[postId]) {
      const newVisibleReplies = { ...visibleReplies };
      delete newVisibleReplies[postId];
      setVisibleReplies(newVisibleReplies);
      return;
    }
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/posts/replies/${postId}`);
      if (!response.ok) {
        throw new Error('リプライの取得に失敗しました。');
      }
      const replies: Post[] = await response.json();
      setVisibleReplies(prev => ({ ...prev, [postId]: replies }));
    } catch (err: any) {
      toast.error(err.message); 
    }
  };

  const handleGenerateReply = async (originalPostContent: string) => {
    if (!loginUser) { toast.error('ログインしてください。'); return; }
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


  if (isLoading) return <div style={{padding: '20px'}}>投稿を読み込んでいます...</div>;
  if (error) return <div style={{padding: '20px', color: 'red'}}>エラー: {error}</div>;

  return (
    <section className="post-list-section">
      <h2>投稿一覧</h2>
      <div>
        {posts.map((post) => (
          <div key={post.post_id} className="post-item" onClick={() => toggleRepliesView(post.post_id)}>
            <div className="post-avatar"></div>
            <div className="post-body">
              <div className="post-header">
                {/* ★ 変更点2: リンク先を post.user_id (Firebase UID) に修正 */}
                <Link to={`/users/${post.user_id}`} onClick={e => e.stopPropagation()} style={{textDecoration: 'none', color: 'inherit'}}>
                  <span className="user-name">{post.user_name}</span>
                </Link>
                <span className="timestamp"> - {new Date(post.created_at).toLocaleString()}</span>
              </div>
              
              <div className="post-main-content">
                {post.content && <p className="post-content">{post.content}</p>}
                {post.image_url && (
                  <img src={post.image_url} alt="投稿画像" style={{maxWidth: '100%', height: 'auto', borderRadius: '15px', marginTop: '10px'}}/>
                )}
              </div>

              <div className="post-actions">
                <button onClick={(e) => { e.stopPropagation(); handleReplyButtonClick(post.post_id); }}>
                  <FaRegComment /> <span>{post.reply_count}</span>
                </button>
                {/* ★ 変更点3: 削除ボタンの表示条件も post.user_id を使用 */}
                {loginUser?.uid === post.user_id && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.post_id); }} title="削除">
                        <FaTrashAlt />
                    </button>
                )}
                <button
                  className={`like-button ${post.is_liked_by_me ? 'liked' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleLike(post.post_id, post.is_liked_by_me); }}
                >
                  {post.is_liked_by_me ? <FaHeart /> : <FaRegHeart />} <span>{post.like_count}</span>
                </button>
              </div>

              {replyingToPostId === post.post_id && (
                <form onSubmit={(e) => { e.stopPropagation(); handleReplySubmit(e, post.post_id); }} onClick={e => e.stopPropagation()} style={{ marginTop: '15px' }}>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="返信を入力..."
                    style={{ width: '95%', height: '60px', padding: '8px', display: 'block', backgroundColor: '#203444', color: 'white', border: '1px solid #38444d' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <button type="button" onClick={() => handleGenerateReply(post.content)} disabled={isGenerating}>
                      {isGenerating ? '生成中...' : '🤖 AIで返信を生成'}
                    </button>
                    <div>
                      <button type="button" onClick={() => setReplyingToPostId(null)} style={{ marginRight: '10px' }}>キャンセル</button>
                      <button type="submit">返信する</button>
                    </div>
                  </div>
                </form>
              )}
               {visibleReplies[post.post_id] && (
                <div className="replies-section" style={{ marginTop: '10px' }}>
                  {visibleReplies[post.post_id].map(reply => (
                     <div key={reply.post_id} className="post-item" style={{paddingLeft: 0, borderTop: '1px solid #38444d'}}>
                       <div className="post-avatar"></div>
                       <div className="post-body">
                         <div className="post-header">
                           <span className="user-name">{reply.user_name}</span>
                           <span className="timestamp"> - {new Date(reply.created_at).toLocaleString()}</span>
                         </div>
                         <p className="post-content">{reply.content}</p>
                       </div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
