import React, { useState, useRef, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { fireAuth } from './firebase';
import toast from 'react-hot-toast';
import './EditProfileModal.css'; // ★ モーダル用のCSSを追加

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

interface UserProfileData {
  id: string;
  name: string;
  bio: string | null;
  profile_image_url: string | null;
  header_image_url: string | null;
}

interface EditProfileModalProps {
  user: UserProfileData;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
  // フォームの入力値を管理するState
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 画像ファイルとプレビューURLを管理するState
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(user.profile_image_url);
  const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(user.header_image_url);

  // input(type=file)をプログラムから操作するためのRef
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const headerImageInputRef = useRef<HTMLInputElement>(null);

  // 画像が選択されたときの処理
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

  // 画像をバックエンドにアップロードする共通関数
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

  // 「保存」ボタンが押されたときの処理
  const handleSave = async () => {
    if (!fireAuth.currentUser) {
      toast.error("ログインしていません。");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await fireAuth.currentUser.getIdToken();
      let profileImageUrl = user.profile_image_url || "";
      let headerImageUrl = user.header_image_url || "";

      // 新しいプロフィール画像が選択されていればアップロード
      if (profileImageFile) {
        profileImageUrl = await uploadImage(profileImageFile, token);
      }
      // 新しいヘッダー画像が選択されていればアップロード
      if (headerImageFile) {
        headerImageUrl = await uploadImage(headerImageFile, token);
      }

      // プロフィール情報をバックエンドに送信
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

      toast.success('プロフィールを更新しました！');
      onUpdate(); // 親コンポーネントのデータを更新
      onClose();  // モーダルを閉じる
    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <button onClick={() => headerImageInputRef.current?.click()}>ヘッダー画像を変更</button>
              <input type="file" accept="image/*" ref={headerImageInputRef} onChange={(e) => handleImageChange(e, 'header')} style={{ display: 'none' }} />
            </div>
            <div className="profile-image-upload">
              <img src={profileImagePreview || '/default-avatar.png'} alt="Profile Preview" />
              <button onClick={() => profileImageInputRef.current?.click()}>プロフィール画像を変更</button>
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
