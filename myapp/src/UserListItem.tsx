import React from 'react';
import { Link } from 'react-router-dom';
import { UserProfileData } from './UserProfile';
import { InitialAvatar } from './InitialAvatar';

interface UserListItemProps {
  user: UserProfileData;
  onFollowToggle: (userToToggle: UserProfileData) => void;
}

export const UserListItem: React.FC<UserListItemProps> = ({ user, onFollowToggle }) => {
  return (
    <div className="user-list-item">
      <Link to={`/users/${user.firebase_uid}`} className="user-list-item-link">
        <div className="user-list-item-avatar">
          {user.profile_image_url && user.profile_image_url.startsWith('http') ? (
            <img 
              src={user.profile_image_url} 
              alt={`${user.name}のアバター`}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
            />
          ) : (
            <InitialAvatar name={user.name} size={48} />
          )}
        </div>
        <div className="user-list-item-body">
          <span className="user-list-item-name">{user.name}</span>
          <p className="user-list-item-bio">{user.bio || ''}</p>
        </div>
      </Link>
      
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