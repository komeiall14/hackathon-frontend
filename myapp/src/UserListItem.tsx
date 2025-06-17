import React from 'react';
import { Link } from 'react-router-dom';
import { UserProfileData } from './UserProfile'; // UserProfileの型定義を再利用

// このコンポーネントが受け取るプロパティの型を定義
interface UserListItemProps {
  user: UserProfileData;
  onFollowToggle: (userToToggle: UserProfileData) => void;
}

export const UserListItem: React.FC<UserListItemProps> = ({ user, onFollowToggle }) => {
  return (
    <div className="user-list-item">
      <Link to={`/users/${user.firebase_uid}`} className="user-list-item-link">
        <img 
          src={user.profile_image_url || '/default-avatar.png'} 
          alt={`${user.name}のアバター`} 
          className="user-list-item-avatar"
        />
        <div className="user-list-item-body">
          <span className="user-list-item-name">{user.name}</span>
          <p className="user-list-item-bio">{user.bio || ''}</p>
        </div>
      </Link>
      
      {/* 自分のプロフィールでなければフォローボタンを表示 */}
      {!user.is_me && (
        <button 
          onClick={() => onFollowToggle(user)} 
          className={user.is_following ? 'following-btn' : 'follow-btn'}
        >
          {user.is_following ? 'フォロー中' : 'フォローする'}
        </button>
      )}
    </div>
  );
};