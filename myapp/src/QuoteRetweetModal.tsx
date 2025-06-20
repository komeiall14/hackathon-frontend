// src/QuoteRetweetModal.tsx

import React, { useState } from 'react';
import { Post } from './PostList';
import toast from 'react-hot-toast';
import { User as FirebaseUser } from "firebase/auth";
import './QuoteRetweetModal.css';
// ▼▼▼ 修正箇所 ▼▼▼
import { InitialAvatar } from './InitialAvatar';
// ▲▲▲ 修正ここまで ▲▲▲

interface QuoteRetweetModalProps {
  post: Post;
  loginUser: FirebaseUser | null;
  onClose: () => void;
  onQuoteSuccess: (newQuotePost: Post) => void;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const QuoteRetweetModal: React.FC<QuoteRetweetModalProps> = ({ post, loginUser, onClose, onQuoteSuccess }) => {
  const [comment, setComment] = useState('');
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
      const response = await fetch(`${BACKEND_API_URL}/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: comment,
          original_post_id: post.post_id,
        }),
      });

      if (!response.ok) {
        throw new Error('引用リツイートに失敗しました。');
      }

      const newQuotePost: Post = await response.json();
      toast.success('引用リツイートしました！');
      onQuoteSuccess(newQuotePost);
      onClose();

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
                  {/* ▼▼▼ 修正箇所(1/2) ▼▼▼ */}
                  {loginUser?.photoURL && loginUser.photoURL.startsWith('http') ? (
                    <img src={loginUser.photoURL} alt="your avatar" />
                  ) : (
                    <InitialAvatar name={loginUser?.displayName || ""} size={48} />
                  )}
                  {/* ▲▲▲ 修正ここまで ▲▲▲ */}
                </div>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="コメントを追加..."
                    className="qt-textarea"
                />
            </div>

            <div className="original-post-container-qt">
              <div className="original-post-header-qt">
                {/* ▼▼▼ 修正箇所(2/2) ▼▼▼ */}
                <div style={{ marginRight: '8px' }}>
                  {post.user_profile_image_url && post.user_profile_image_url.startsWith('http') ? (
                    <img 
                      src={post.user_profile_image_url} 
                      alt="original author avatar"
                      style={{width: '20px', height: '20px', borderRadius: '50%'}}
                     />
                  ) : (
                    <InitialAvatar name={post.user_name} size={20} />
                  )}
                </div>
                {/* ▲▲▲ 修正ここまで ▲▲▲ */}
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