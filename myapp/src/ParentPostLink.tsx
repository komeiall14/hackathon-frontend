import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from './PostList';
import './ParentPostLink.css';

interface ParentPostLinkProps {
  post: Post;
}

export const ParentPostLink: React.FC<ParentPostLinkProps> = ({ post }) => {
  return (
    <Link to={`/status/${post.post_id}`} className="parent-post-link-wrapper">
      <div className="parent-post-link-container">
        <div className="reply-line"></div>
        <p className="replying-to-text">
          返信先: 
          <Link 
            to={`/users/${post.user_id}`} 
            className="user-link"
            onClick={(e) => e.stopPropagation()}
          >
            @{post.user_name}
          </Link>
          さん
        </p>
      </div>
    </Link>
  );
};