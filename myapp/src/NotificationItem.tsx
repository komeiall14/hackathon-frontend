// src/NotificationItem.tsx （新規作成）

import React from 'react';
import { Link } from 'react-router-dom';
import { NotificationResponse } from './NotificationsPage'; // 次に作成
import { FaHeart, FaRegComment, FaUserPlus } from 'react-icons/fa';
import './NotificationsPage.css'; // 次に作成

interface NotificationItemProps {
  notification: NotificationResponse;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  let icon;
  let text;
  const linkTo = notification.entity_id ? `/status/${notification.entity_id}` : `/users/${notification.actor.firebase_uid}`;

  switch (notification.type) {
    case 'like':
      icon = <FaHeart className="icon like" />;
      text = 'さんがあなたの投稿に「いいね」しました';
      break;
    case 'reply':
      icon = <FaRegComment className="icon reply" />;
      text = 'さんがあなたの投稿に返信しました';
      break;
    case 'follow':
      icon = <FaUserPlus className="icon follow" />;
      text = 'さんがあなたをフォローしました';
      break;
    default:
      return null;
  }

  return (
    <Link to={linkTo} className={`notification-item ${notification.is_read ? '' : 'unread'}`}>
      <div className="notification-icon-container">
        {icon}
      </div>
      <div className="notification-content">
        <img 
          src={notification.actor.profile_image_url || '/default-avatar.png'} 
          alt={notification.actor.name} 
          className="notification-actor-avatar"
        />
        <p>
          <strong>{notification.actor.name}</strong>
          {text}
        </p>
      </div>
    </Link>
  );
};