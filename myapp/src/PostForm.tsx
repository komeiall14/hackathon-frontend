// src/PostForm.tsx （完成版）

import React, { useState, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import toast from 'react-hot-toast';
import { Post } from './PostList';

interface PostFormProps {
  loginUser: FirebaseUser;
  onPostSuccess: (newPost: Post) => void;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const PostForm: React.FC<PostFormProps> = ({ loginUser, onPostSuccess }) => {
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ▼▼▼ 動画用のstateとrefを追加 ▼▼▼
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  // ▲▲▲ 動画用のstateとrefを追加 ▲▲▲

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaType === 'image') {
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      // 他のメディア選択はリセット
      setSelectedVideo(null);
      setVideoPreviewUrl(null);
    } else {
      setSelectedVideo(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      // 他のメディア選択はリセット
      setSelectedImage(null);
      setImagePreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage && !selectedVideo) {
      toast.error('投稿内容を入力するか、メディアを選択してください。');
      return;
    }
    
    setIsSubmitting(true);
    let mediaUrl = "";
    let mediaType = "";

    try {
      const token = await loginUser.getIdToken();
  
      // ★ 画像または動画のアップロード処理
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
  
      // ★ 投稿作成APIへのリクエストを修正
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
  
      toast.success('投稿に成功しました！');
      // フォームをリセット
      setContent('');
      setSelectedImage(null);
      setImagePreviewUrl(null);
      setSelectedVideo(null);
      setVideoPreviewUrl(null);
      if(imageInputRef.current) imageInputRef.current.value = "";
      if(videoInputRef.current) videoInputRef.current.value = "";
      
      onPostSuccess(newPostData);

    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="いまどうしてる？" />
      
      {imagePreviewUrl && <img src={imagePreviewUrl} alt="Preview" style={{maxWidth: '100%', height: 'auto', marginTop: '10px', borderRadius: '15px'}} />}
      {videoPreviewUrl && <video src={videoPreviewUrl} controls style={{maxWidth: '100%', height: 'auto', marginTop: '10px', borderRadius: '15px'}} />}

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px'}}>
        <div>
          <input type="file" accept="image/*" onChange={(e) => handleMediaChange(e, 'image')} style={{display: 'none'}} ref={imageInputRef} />
          <button type="button" onClick={() => imageInputRef.current?.click()} style={{backgroundColor: 'transparent', padding: '8px', color: '#1DA1F2', fontSize: '24px', border: 'none'}}>🖼️</button>
          
          <input type="file" accept="video/*" onChange={(e) => handleMediaChange(e, 'video')} style={{display: 'none'}} ref={videoInputRef} />
          <button type="button" onClick={() => videoInputRef.current?.click()} style={{backgroundColor: 'transparent', padding: '8px', color: '#1DA1F2', fontSize: '24px', border: 'none'}}>🎬</button>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '投稿中...' : '投稿する'}
        </button>
      </div>
    </form>
  );
};