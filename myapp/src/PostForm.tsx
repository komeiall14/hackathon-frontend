// src/PostForm.tsx

import React, { useState, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import toast from 'react-hot-toast';
import { Post } from './PostList';
import { InitialAvatar } from './InitialAvatar';
import { Link } from 'react-router-dom'; 

interface PostFormProps {
  loginUser: FirebaseUser;
  onPostSuccess: (newPost: Post) => void;
  onBuzzStart: (postToBuzz: Post) => void;
  onFlameStart: (postToFlame: Post) => void;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const PostForm: React.FC<PostFormProps> = ({ loginUser, onPostSuccess, onBuzzStart, onFlameStart }) => {
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaType === 'image') {
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setSelectedVideo(null);
      setVideoPreviewUrl(null);
    } else {
      setSelectedVideo(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setSelectedImage(null);
      setImagePreviewUrl(null);
    }
  };

  const createPost = async (): Promise<Post | null> => {
    if (!content.trim() && !selectedImage && !selectedVideo) {
      toast.error('投稿内容を入力するか、メディアを選択してください。');
      return null;
    }
    
    setIsSubmitting(true);
    let mediaUrl = "";
    let mediaType = "";

    try {
      const token = await loginUser.getIdToken();
  
      if (selectedImage) {
        mediaType = 'image';
        const formData = new FormData();
        formData.append('image', selectedImage);
        const res = await fetch(`${BACKEND_API_URL}/api/post/image`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData,
        });
        if (!res.ok) throw new Error('画像のアップロードに失敗しました。');
        const result = await res.json();
        mediaUrl = result.imageUrl;
      } else if (selectedVideo) {
        mediaType = 'video';
        const formData = new FormData();
        formData.append('video', selectedVideo);
        const res = await fetch(`${BACKEND_API_URL}/api/post/video`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData,
        });
        if (!res.ok) throw new Error('動画のアップロードに失敗しました。');
        const result = await res.json();
        mediaUrl = result.videoUrl;
      }
  
      const postResponse = await fetch(`${BACKEND_API_URL}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          content: content.trim(),
          image_url: mediaType === 'image' ? mediaUrl : "",
          video_url: mediaType === 'video' ? mediaUrl : "",
        }),
      });
  
      if (!postResponse.ok) { throw new Error('投稿に失敗しました。'); }
      const newPostData: Post = await postResponse.json();
  
      setContent('');
      setSelectedImage(null);
      setImagePreviewUrl(null);
      setSelectedVideo(null);
      setVideoPreviewUrl(null);
      if(imageInputRef.current) imageInputRef.current.value = "";
      if(videoInputRef.current) videoInputRef.current.value = "";
      
      return newPostData;

    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleNormalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPost = await createPost();
    if (newPost) {
      toast.success('投稿に成功しました！');
      onPostSuccess(newPost);
    }
  };
  
  const handleBuzzSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPost = await createPost();
    if (newPost) {
        onBuzzStart(newPost);
    }
  };

  const handleFlameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPost = await createPost();
    if (newPost) {
        onFlameStart(newPost);
    }
  };

  return (
    // ▼▼▼ このブロック全体を修正 ▼▼▼
    <form onSubmit={handleNormalSubmit}>
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* 左側にアイコンを表示 */}
        <div style={{ flexShrink: 0 }}>
          <Link to={`/users/${loginUser.uid}`}>
            {loginUser.photoURL && loginUser.photoURL.startsWith('http') ? (
              <img 
                src={loginUser.photoURL}
                alt="your avatar"
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <InitialAvatar name={loginUser.displayName || ''} size={48} />
            )}
          </Link>
        </div>

        {/* 右側にテキストエリアとプレビューを表示 */}
        <div style={{ flexGrow: 1 }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="いまどうしてる？"
            style={{
              width: '100%',
              minHeight: '60px',
              paddingTop: '12px',
              paddingBottom: '12px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              backgroundColor: 'transparent',
              color: 'white',
              fontSize: '20px',
            }}
          />
          {imagePreviewUrl && <img src={imagePreviewUrl} alt="Preview" style={{maxWidth: '100%', height: 'auto', marginTop: '10px', borderRadius: '15px'}} />}
          {videoPreviewUrl && <video src={videoPreviewUrl} controls style={{maxWidth: '100%', height: 'auto', marginTop: '10px', borderRadius: '15px'}} />}
        </div>
      </div>

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingLeft: '60px'}}>
        <div>
          <input type="file" accept="image/*" onChange={(e) => handleMediaChange(e, 'image')} style={{display: 'none'}} ref={imageInputRef} />
          <button type="button" onClick={() => imageInputRef.current?.click()} style={{backgroundColor: 'transparent', padding: '8px', color: '#1DA1F2', fontSize: '24px', border: 'none'}}>🖼️</button>
          
          <input type="file" accept="video/*" onChange={(e) => handleMediaChange(e, 'video')} style={{display: 'none'}} ref={videoInputRef} />
          <button type="button" onClick={() => videoInputRef.current?.click()} style={{backgroundColor: 'transparent', padding: '8px', color: '#1DA1F2', fontSize: '24px', border: 'none'}}>🎬</button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" onClick={handleBuzzSubmit} disabled={isSubmitting} style={{ backgroundColor: '#17bf63', color: 'white', border: 'none', borderRadius: '20px', padding: '5px 10px', fontSize: '13px', fontWeight: 'normal', cursor: 'pointer' }}>
                バズる
            </button>
            <button type="button" onClick={handleFlameSubmit} disabled={isSubmitting} style={{ backgroundColor: '#e0245e', color: 'white', border: 'none', borderRadius: '20px', padding: '5px 10px', fontSize: '13px', fontWeight: 'normal', cursor: 'pointer' }}>
                炎上する
            </button>
            <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#1DA1F2', color: 'white', border: 'none', borderRadius: '20px', padding: '10px 20px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isSubmitting ? '投稿中...' : '投稿する'}
            </button>
        </div>
      </div>
    </form>
    // ▲▲▲ 修正ここまで ▲▲▲
  );
};