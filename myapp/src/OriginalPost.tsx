import React from 'react';
import { Post } from './PostList';
import { Link, useNavigate } from 'react-router-dom';
import { InitialAvatar } from './InitialAvatar';

interface OriginalPostProps {
  post: Post;
}

export const OriginalPost: React.FC<OriginalPostProps> = ({ post }) => {
  const navigate = useNavigate();

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    navigate(`/status/${post.post_id}`); 
  };
  
  const formattedDate = () => {
    const date = new Date(post.created_at);
    if (post.created_at && !isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    return '日付情報なし'; 
  };

  return (
    <div className="original-post-container" onClick={handleNavigate}>
      <div className="post-header">
        <Link to={`/users/${post.user_id}`} onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ marginRight: '8px' }}>
            {post.user_profile_image_url && post.user_profile_image_url.startsWith('http') ? (
              <img 
                src={post.user_profile_image_url} 
                alt={`${post.user_name}のアバター`} 
                style={{width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover'}}
              />
            ) : (
              <InitialAvatar name={post.user_name} size={24} />
            )}
          </div>
          <span className="user-name" style={{fontSize: '15px'}}>{post.user_name}</span>
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