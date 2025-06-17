import React from 'react';
import { Post } from './PostList';
import { Link, useNavigate } from 'react-router-dom'; // ★ useNavigate をインポート

interface OriginalPostProps {
  post: Post;
}

export const OriginalPost: React.FC<OriginalPostProps> = ({ post }) => {
  const navigate = useNavigate(); // ★ useNavigateフックを呼び出す

  const handleNavigate = (e: React.MouseEvent) => {
    // ★ クリックイベントが親要素に伝わるのを防ぐ
    e.stopPropagation(); 
    // ★ 引用元の投稿の詳細ページへ遷移
    navigate(`/status/${post.post_id}`); 
  };
  
  return (
    // ▼▼▼ このdivにonClickイベントを追加 ▼▼▼
    <div className="original-post-container" onClick={handleNavigate}>
      <div className="post-header">
        {/* ユーザーページへのリンクは、クリックしても詳細ページへ遷移しないようにする */}
        <Link to={`/users/${post.user_id}`} onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
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