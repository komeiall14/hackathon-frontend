import React, { useState, useRef, useCallback } from 'react';
// ▼▼▼ 修正箇所(1/3) ▼▼▼
import { useNavigate } from 'react-router-dom'; // useNavigateをインポート
import { fireAuth } from './firebase';
import { updateProfile } from "firebase/auth"; // updateProfileをインポート
// ▲▲▲ 修正ここまで ▲▲▲
import toast from 'react-hot-toast';
import './EditProfileModal.css';
import { UserProfileData } from './UserProfile';
import { InitialAvatar } from './InitialAvatar';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

interface EditProfileModalProps {
  user: UserProfileData;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ▼▼▼ 修正箇所(2/3) ▼▼▼
  const navigate = useNavigate(); // navigate関数を取得
  // ▲▲▲ 修正ここまで ▲▲▲

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(user.header_image_url);

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const headerImageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'profile' | 'header') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      if (imageType === 'profile') {
        setProfileImageFile(file);
        setProfileImagePreview(previewUrl);
      } else {
        setHeaderImageFile(file);
        setHeaderImagePreview(previewUrl);
      }
    }
  };

  const uploadImage = useCallback(async (imageFile: File, token: string): Promise<string> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await fetch(`${BACKEND_API_URL}/api/post/image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      throw new Error('画像のアップロードに失敗しました。');
    }
    const result = await response.json();
    return result.imageUrl;
  }, []);

  const handleSave = async () => {
    const currentUser = fireAuth.currentUser;
    if (!currentUser) {
      toast.error("ログインしていません。");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await currentUser.getIdToken();
      let profileImageUrl = user.profile_image_url || "";
      let headerImageUrl = user.header_image_url || "";

      if (profileImageFile) {
        profileImageUrl = await uploadImage(profileImageFile, token);
      }
      if (headerImageFile) {
        headerImageUrl = await uploadImage(headerImageFile, token);
      }

      // アプリのDBを更新
      const response = await fetch(`${BACKEND_API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name,
          bio: bio,
          profile_image_url: profileImageUrl,
          header_image_url: headerImageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('プロフィールの更新に失敗しました。');
      }

      // Firebase Authenticationのプロフィール情報も更新
      await updateProfile(currentUser, {
        displayName: name,
        photoURL: profileImageUrl
      });

      toast.success('プロフィールを更新しました！');
      onUpdate();
      onClose();

      // ▼▼▼ 修正箇所(3/3) ▼▼▼
      // ホームページに遷移することで、アプリケーション全体をリフレッシュし、
      // 最新のユーザー情報を読み込ませる
      navigate('/');
      // ▲▲▲ 修正ここまで ▲▲▲

    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>プロフィールを編集</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="image-upload-section">
            <div className="header-upload">
              <img src={headerImagePreview || '/default-header.png'} alt="Header Preview" />
              <button type="button" onClick={() => headerImageInputRef.current?.click()} title="ヘッダー画像を変更">
                <CameraIcon />
              </button>
              <input type="file" accept="image/*" ref={headerImageInputRef} onChange={(e) => handleImageChange(e, 'header')} style={{ display: 'none' }} />
            </div>
            <div className="profile-image-upload">
              {profileImagePreview ? (
                <img src={profileImagePreview} alt="Profile Preview" />
              ) : (user.profile_image_url && user.profile_image_url.startsWith('http')) ? (
                <img src={user.profile_image_url} alt="Profile Preview" />
              ) : (
                <InitialAvatar name={user.name} size={112} />
              )}
              <button type="button" onClick={() => profileImageInputRef.current?.click()} title="プロフィール画像を変更">
                <CameraIcon />
              </button>
              <input type="file" accept="image/*" ref={profileImageInputRef} onChange={(e) => handleImageChange(e, 'profile')} style={{ display: 'none' }} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="name">名前</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="bio">自己紹介</label>
            <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4}></textarea>
          </div>
          <div style={{ borderTop: '1px solid #38444d', margin: '20px 0' }}></div>
          <div className="form-group">
            <label>パスワードとセキュリティ</label>
            <p style={{ color: '#8899a6', fontSize: '14px', margin: '0 0 10px 0' }}>
              このアカウントはGoogleで認証されています。パスワードの変更はGoogleアカウント設定で行ってください。
            </p>
            <a 
              href="https://myaccount.google.com/security" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                  display: 'inline-block', padding: '8px 16px', borderRadius: '20px',
                  border: '1px solid #536471', textDecoration: 'none', color: 'white',
                  fontWeight: 'bold', transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(231, 233, 234, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Googleアカウント設定を開く
            </a>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};