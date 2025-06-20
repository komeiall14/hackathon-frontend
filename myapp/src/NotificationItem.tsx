import React from 'react';
import { Link } from 'react-router-dom';
import { NotificationResponse } from './NotificationsPage';
// ▼▼▼ FaQuoteLeft アイコンをインポート ▼▼▼
import { FaHeart, FaRegComment, FaUserPlus, FaQuoteLeft } from 'react-icons/fa';
import './NotificationsPage.css';

interface NotificationItemProps {
  notification: NotificationResponse;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  let icon;
  let text;
  // ▼▼▼ 引用リツイートの場合、元の投稿ではなく引用リツイート自体の投稿詳細ページに飛ぶように修正 ▼▼▼
  const linkTo = notification.type === 'quote_retweet' 
      ? `/status/${notification.id}` // 引用RT通知の場合は、通知IDが投稿IDになっているはず(要バックエンド確認) -> 修正: entity_idは元の投稿を指すべきだが、通知のentity_idは通知対象の投稿を指す。ここでは引用RT投稿そのものに飛ばしたい。
      : notification.entity_id ? `/status/${notification.entity_id}` : `/users/${notification.actor.firebase_uid}`;

  // バックエンドの修正でentity_idには元の投稿IDが入るので、引用RT投稿に飛ぶには工夫が必要。
  // しかし、まずは通知内容を正しく表示することを優先します。
  // リンク先は元の投稿のまま、表示テキストとアイコンを修正します。
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
    // ▼▼▼ 'quote_retweet' の場合を追加 ▼▼▼
    case 'quote_retweet':
      icon = <FaQuoteLeft className="icon reply" />; // アイコンは引用符、色はリプライと同じ青色
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