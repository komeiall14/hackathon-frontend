import React, { useState } from 'react';
import { Post } from './PostList';
import toast from 'react-hot-toast';
import { User as FirebaseUser } from "firebase/auth";
import './QuoteRetweetModal.css'; // ★ 新しく作成するCSSファイルをインポート

// このモーダルが受け取るPropsの型を定義
interface QuoteRetweetModalProps {
  post: Post; // 引用する元の投稿
  loginUser: FirebaseUser | null;
  onClose: () => void;
  onUpdate: () => void;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const QuoteRetweetModal: React.FC<QuoteRetweetModalProps> = ({ post, loginUser, onClose, onUpdate }) => {
  const [comment, setComment] = useState(''); // 引用コメント用のstate
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('コメントを入力してください。');
      return;
    }
    if (!loginUser) {
      toast.error('ログインしてください。');
      return;
    }
    setIsSubmitting(true);
    
    try {
      const token = await loginUser.getIdToken();
      // 引用リツイートとして、既存の投稿作成エンドポイントにリクエストを送信
      const response = await fetch(`${BACKEND_API_URL}/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: comment,
          original_post_id: post.post_id, // ★ 引用元の投稿IDを渡すのが重要
        }),
      });

      if (!response.ok) {
        throw new Error('引用リツイートに失敗しました。');
      }

      toast.success('引用リツイートしました！');
      onUpdate(); // タイムラインを更新
      onClose(); // モーダルを閉じる
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-qt" onClick={e => e.stopPropagation()}>
        <div className="modal-header-qt">
           <button onClick={onClose} className="close-button-qt">&times;</button>
        </div>
        
        <div className="modal-body-qt">
          <form onSubmit={handleSubmit}>
            <div className="qt-form-body">
                <div className="post-avatar">
                    <img src={loginUser?.photoURL || '/default-avatar.png'} alt="your avatar" />
                </div>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="コメントを追加..."
                    className="qt-textarea"
                />
            </div>

            {/* 引用元の投稿を枠で囲んで表示 */}
            <div className="original-post-container-qt">
              <div className="original-post-header-qt">
                <img src={post.user_profile_image_url || '/default-avatar.png'} alt="original author avatar" />
                <strong>{post.user_name}</strong>
                <span className="timestamp"> - {new Date(post.created_at).toLocaleString()}</span>
              </div>
              <p>{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="original post" className="original-post-image-qt" />}
            </div>

            <div className="modal-footer-qt">
              <button type="submit" className="submit-button-qt" disabled={isSubmitting || !comment.trim()}>
                {isSubmitting ? '投稿中...' : 'ポストする'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};