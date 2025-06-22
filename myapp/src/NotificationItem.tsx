import React from 'react';
import { Link } from 'react-router-dom';
import { NotificationResponse } from './NotificationsPage';
import { FaHeart, FaRegComment, FaUserPlus, FaQuoteLeft, FaUsers } from 'react-icons/fa';
import './NotificationsPage.css';

interface NotificationItemProps {
  notification: NotificationResponse;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  let icon;
  let text;
  
  // ★★★ 変更点(1): リンク先を決定するロジックを修正・統合 ★★★
  // 通知タイプに応じて、遷移先となるURLをここで一括して決定します。
  let finalLink: string;
  switch (notification.type) {
    case 'like':
    case 'reply':
    case 'quote_retweet':
      // 投稿関連の通知は、その投稿詳細ページへ
      finalLink = `/status/${notification.entity_id}`;
      break;
    case 'follow':
      // フォロー通知は、そのユーザーのプロフィールページへ
      finalLink = `/users/${notification.actor.firebase_uid}`;
      break;
    case 'space_started':
      // ★★★ 新機能: スペース開始通知は、そのスペースのページへ ★★★
      finalLink = `/spaces/${notification.entity_id}`; 
      break;
    default:
      // 万が一、未知のタイプが来た場合はホームへ
      finalLink = `/`;
  }


  // ★★★ 変更点(2): アイコンとテキストを決定するロジックに新しい通知タイプを追加 ★★★
  // 通知タイプに応じて、表示するアイコンとテキストを決定します。
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
    case 'space_started':
      // ★★★ 新機能: 'space_started'タイプの表示方法を追加 ★★★
      icon = <FaUsers className="icon reply" />; // アイコンは任意でFaUsersを使用
      text = 'さんが新しいスペースを開始しました';
      break;
    default:
      return null;
  }

  return (
    // Linkコンポーネントの "to" に、上で決定した finalLink を使用
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