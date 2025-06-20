import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfileData } from './UserProfile';
import toast from 'react-hot-toast';
import { InitialAvatar } from './InitialAvatar';


const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

interface RecommendedUsersProps {
  loginUser: FirebaseUser | null;
}

export const RecommendedUsers: React.FC<RecommendedUsersProps> = ({ loginUser }) => {
  const [recommendedUsers, setRecommendedUsers] = useState<UserProfileData[]>([]);

  useEffect(() => {
    if (!loginUser) {
      setRecommendedUsers([]);
      return;
    }
    const fetchRecommendations = async () => {
      try {
        const token = await loginUser.getIdToken();
        const response = await fetch(`${BACKEND_API_URL}/api/users/recommendations`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          console.error('おすすめユーザーの取得に失敗しました。');
          return;
        }
        const data = await response.json();
        setRecommendedUsers(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecommendations();
  }, [loginUser]);

  if (recommendedUsers.length === 0) {
    return null;
  }

  return (
    <div className="trends-container">
      <h3>おすすめユーザー</h3>
      <div>
        {recommendedUsers.map(user => (
          <Link 
            to={`/users/${user.firebase_uid}`} 
            key={user.id} 
            className="user-management-item"
          >
            <div className="user-management-avatar">
              {user.profile_image_url && user.profile_image_url.startsWith('http') ? (
                <img 
                  src={user.profile_image_url} 
                  alt={user.name} 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                />
              ) : (
                <InitialAvatar name={user.name} size={40} />
              )}
            </div>
            <div style={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                <span className="user-management-name">{user.name}</span>
                <p style={{fontSize: '14px', color: '#8899a6', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    {user.bio || ''}
                </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};