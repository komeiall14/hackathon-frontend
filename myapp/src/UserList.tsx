import React from 'react';
import { UserProfileData } from './UserProfile';
import { UserListItem } from './UserListItem';
import './UserList.css'; 

interface UserListProps {
  users: UserProfileData[];
  onFollowToggle: (userToToggle: UserProfileData) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, onFollowToggle }) => {
  if (users.length === 0) {
    return <div style={{padding: '20px', textAlign: 'center'}}>ユーザーが見つかりません。</div>;
  }
  
  return (
    <div className="user-list-container">
      {users.map(user => (
        <UserListItem 
          key={user.id} 
          user={user}
          onFollowToggle={onFollowToggle}
        />
      ))}
    </div>
  );
};