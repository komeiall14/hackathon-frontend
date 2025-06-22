import React from 'react';
import { InitialAvatar } from './InitialAvatar';
import './UserAvatar.css'; // ★★★ CSSをインポート

interface UserAvatarProps {
  user: {
    firebase_uid?: string | null;
    name?: string | null;
    profile_image_url?: string | null;
  };
  size: number;
  isHosting: boolean; // ホストかどうかのフラグ
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size, isHosting }) => {
  const avatarClass = isHosting ? 'user-avatar hosting-border' : 'user-avatar';

  return (
    <div className={avatarClass} style={{ width: size, height: size }}>
      {user.profile_image_url && user.profile_image_url.startsWith('http') ? (
        <img
          src={user.profile_image_url}
          alt={user.name || 'avatar'}
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <InitialAvatar name={user.name || ''} size={size} />
      )}
    </div>
  );
};