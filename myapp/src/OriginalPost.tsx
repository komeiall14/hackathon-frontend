import React from 'react';
import { Post } from './PostList'; // Postの型をインポート
import { Link } from 'react-router-dom';

// このコンポーネントが受け取るPropsの型を定義
interface OriginalPostProps {
  post: Post; // 表示する元の投稿データ
}

export const OriginalPost: React.FC<OriginalPostProps> = ({ post }) => {
  return (
    // 枠で囲まれたコンテナ
    <div className="original-post-container">
      {/* 投稿者の情報（アバター、名前、投稿時間） */}
      <div className="post-header">
        <Link to={`/users/${post.user_id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <img 
            src={post.user_profile_image_url || '/default-avatar.png'} 
            alt={`${post.user_name}のアバター`} 
            style={{width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', marginRight: '8px'}}
          />
          <span className="user-name" style={{fontSize: '15px'}}>{post.user_name}</span>
          <span className="timestamp" style={{fontSize: '15px'}}> - {new Date(post.created_at).toLocaleString()}</span>
        </Link>
      </div>
      {/* 投稿の本文と画像 */}
      {post.content && <p className="post-content" style={{fontSize: '15px', marginTop: '5px'}}>{post.content}</p>}
      {post.image_url && (
        <img src={post.image_url} alt="投稿画像" className="post-image"/>
      )}
    </div>
  );
};