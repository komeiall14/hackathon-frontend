import React, { useState } from 'react';
import toast from 'react-hot-toast';

// 型定義をエクスポートして App.tsx でも使えるようにする
export interface Post {
  post_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  like_count: number;
  is_liked_by_me: boolean;
  reply_count: number;
}

// 親から受け取るPropsの型を定義
interface PostListProps {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  onUpdate: () => void; // データ更新を親に依頼する関数
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const PostList: React.FC<PostListProps> = ({ posts, isLoading, error, onUpdate }) => {
  const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const [visibleReplies, setVisibleReplies] = useState<Record<string, Post[]>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleLike = async (postId: string, isLiked: boolean) => {
    const method = isLiked ? 'DELETE' : 'POST';
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/posts/like/${postId}`, {
        method: method,
      });
      if (!response.ok) {
        throw new Error('いいねの操作に失敗しました。');
      }
      onUpdate();
    } catch (err: any) {
      toast.error(err.message); 
    }
  };
  
  const handleReplyButtonClick = (postId: string) => {
    setReplyingToPostId(postId === replyingToPostId ? null : postId);
    setReplyContent('');
  };

  const handleReplySubmit = async (e: React.FormEvent, parentPostId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) {
        toast.error("返信内容を入力してください。");
        return;
    };

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/posts/reply/${parentPostId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
        }),
      });
      if (!response.ok) { throw new Error('リプライの投稿に失敗しました。'); }
      
      setReplyingToPostId(null);
      setReplyContent('');
      onUpdate();
      toast.success('リプライを投稿しました！'); 

    } catch (err: any) {
      toast.error(err.message);
    }
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
    setIsGenerating(true);
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/posts/suggest-reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                original_post_content: originalPostContent,
            }),
        });
        if (!response.ok) {
            throw new Error('AIによる返信生成に失敗しました。');
        }
        const data = await response.json();
        if (data.suggestion) {
            setReplyContent(String(data.suggestion)); 
        }
    } catch (err: any) {
      toast.error(err.message); 
    } finally {
        setIsGenerating(false);
    }
  };

  // ★★★ 投稿を削除する関数をここに追加 ★★★
  const handleDeletePost = async (postId: string) => {
    // 誤操作防止のために確認ダイアログを表示
    if (!window.confirm("この投稿を本当に削除しますか？")) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/posts/delete/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // サーバーからエラーメッセージがあれば表示
        const errorData = await response.text();
        throw new Error(errorData || '投稿の削除に失敗しました。');
      }
      
      toast.success('投稿を削除しました。');
      onUpdate(); // 親コンポーネントにリストの更新を依頼

    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    }
  };


  if (isLoading) return <div>投稿を読み込んでいます...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <section style={{ marginTop: '40px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', width: '80%', maxWidth: '600px' }}>
      <h2>投稿一覧</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {posts.map((post) => (
          <li key={post.post_id} style={{ borderBottom: '1px solid #555', padding: '15px 0', textAlign: 'left' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '1.1em' }}>{post.content}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <small style={{ color: '#aaa' }}>
                投稿者: {post.user_name} - {new Date(post.created_at).toLocaleString()}
              </small>
              <div style={{display: 'flex', alignItems: 'center'}}>
                {/* ★★★ 削除ボタンをここに追加 ★★★ */}
                <button 
                  onClick={() => handleDeletePost(post.post_id)} 
                  title="削除"
                  style={{ marginRight: '15px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1em' }}
                >
                  🗑️
                </button>
                <button onClick={() => handleReplyButtonClick(post.post_id)} style={{ marginRight: '5px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1em' }}>
                  💬
                </button>
                <span onClick={() => toggleRepliesView(post.post_id)} style={{ cursor: 'pointer', marginRight: '15px', color: '#888' }}>
                  {post.reply_count}
                </span>
                <button 
                  onClick={() => handleLike(post.post_id, post.is_liked_by_me)}
                  style={{ 
                    backgroundColor: 'transparent', 
                    border: 'none',
                    color: post.is_liked_by_me ? '#f06292' : '#888',
                    cursor: 'pointer',
                    fontSize: '1.2em'
                  }}
                >
                  ♡
                </button>
                <span style={{ color: '#888' }}>{post.like_count}</span>
              </div>
            </div>
            {replyingToPostId === post.post_id && (
              <form onSubmit={(e) => handleReplySubmit(e, post.post_id)} style={{ marginTop: '15px' }}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="返信を入力..."
                  style={{ width: '95%', height: '60px', padding: '8px', display: 'block' }}
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
              <div style={{ marginLeft: '30px', borderLeft: '2px solid #555', paddingLeft: '15px', marginTop: '10px' }}>
                {visibleReplies[post.post_id].length > 0 ? (
                  visibleReplies[post.post_id].map(reply => (
                    <div key={reply.post_id} style={{ borderBottom: '1px dotted #444', padding: '10px 0' }}>
                      <p style={{ margin: '0 0 5px 0' }}>{reply.content}</p>
                      <small style={{ color: '#888' }}>
                        返信者: {reply.user_name} - {new Date(reply.created_at).toLocaleString()}
                      </small>
                    </div>
                  ))
                ) : (
                  <p style={{color: '#888', fontSize: '0.9em'}}>まだ返信はありません。</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};