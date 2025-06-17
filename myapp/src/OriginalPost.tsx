import React from 'react';
import { Post } from './PostList';
import { Link, useNavigate } from 'react-router-dom';

interface OriginalPostProps {
  post: Post;
}

export const OriginalPost: React.FC<OriginalPostProps> = ({ post }) => {
  const navigate = useNavigate();

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    navigate(`/status/${post.post_id}`); 
  };
  
  // ▼▼▼ 日付を安全にフォーマットする処理を追加 ▼▼▼
  const formattedDate = () => {
    // post.created_at が存在し、有効な日付かどうかをチェック
    const date = new Date(post.created_at);
    if (post.created_at && !isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    // 無効な場合は代替テキストを返す
    return '日付情報なし'; 
  };

  return (
    <div className="original-post-container" onClick={handleNavigate}>
      <div className="post-header">
        <Link to={`/users/${post.user_id}`} onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <img 
            src={post.user_profile_image_url || '/default-avatar.png'} 
            alt={`${post.user_name}のアバター`} 
            style={{width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', marginRight: '8px'}}
          />
          <span className="user-name" style={{fontSize: '15px'}}>{post.user_name}</span>
          
          {/* ▼▼▼ 安全にフォーマットした日付を表示 ▼▼▼ */}
          <span className="timestamp" style={{fontSize: '15px'}}> - {formattedDate()}</span>
        </Link>
      </div>
      
      {post.content && <p className="post-content" style={{fontSize: '15px', marginTop: '5px'}}>{post.content}</p>}
      {post.image_url && (
        <img src={post.image_url} alt="投稿画像" className="post-image"/>
      )}
    </div>
  );
};