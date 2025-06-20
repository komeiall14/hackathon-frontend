import React from 'react';
import { Link } from 'react-router-dom';
import { NotificationResponse } from './NotificationsPage';
import { FaHeart, FaRegComment, FaUserPlus, FaQuoteLeft } from 'react-icons/fa';
import './NotificationsPage.css';

interface NotificationItemProps {
  notification: NotificationResponse;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  let icon;
  let text;
  const linkTo = notification.type === 'quote_retweet' 
      ? `/status/${notification.id}` 
      : notification.entity_id ? `/status/${notification.entity_id}` : `/users/${notification.actor.firebase_uid}`;


  const finalLink = notification.entity_id ? `/status/${notification.entity_id}` : `/users/${notification.actor.firebase_uid}`;


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
    case 'quote_retweet':
      icon = <FaQuoteLeft className="icon reply" />; 
      text = 'さんがあなたの投稿を引用リツイ-トしました';
      break;
    default:
      return null;
  }

  return (
    // リンク先は finalLink を使用
    <Link to={finalLink} className={`notification-item ${notification.is_read ? '' : 'unread'}`}>
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