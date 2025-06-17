import React, { useState, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import toast from 'react-hot-toast';
import { Post } from './PostList'; // ★ Postの型をインポート

interface PostFormProps {
  loginUser: FirebaseUser;
  onPostSuccess: (newPost: Post) => void; // ★ 引数を取るように変更
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';


export const PostForm: React.FC<PostFormProps> = ({ loginUser, onPostSuccess }) => {
    const [content, setContent] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
  
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim() && !selectedImage) {
        toast.error('投稿内容を入力するか、画像を選択してください。');
        return;
      }
      
      setIsSubmitting(true);
      let imageUrl = "";
  
      try {
          const token = await loginUser.getIdToken();
    
          if (selectedImage) {
            const formData = new FormData();
            formData.append('image', selectedImage);
    
            const imageUploadResponse = await fetch(`${BACKEND_API_URL}/api/post/image`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData,
            });
    
            if (!imageUploadResponse.ok) { throw new Error('画像のアップロードに失敗しました。'); }
            const result = await imageUploadResponse.json();
            imageUrl = result.imageUrl;
          }
    
          const postResponse = await fetch(`${BACKEND_API_URL}/post`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            // ★ 修正: user_name と user_id をリクエストボディから削除
            body: JSON.stringify({
              content: content.trim(),
              image_url: imageUrl,
            }),
          });
    
          if (!postResponse.ok) { throw new Error('投稿に失敗しました。'); }

          const newPostData: Post = await postResponse.json(); // ★ レスポンスをパース
    
          toast.success('投稿に成功しました！');
          setContent('');
          setSelectedImage(null);
          setPreviewUrl(null);
          if(fileInputRef.current) { fileInputRef.current.value = ""; }
          onPostSuccess(newPostData);
    
        } catch (err: any) {
          toast.error(`エラー: ${err.message}`);
        } finally {
          setIsSubmitting(false);
        }
      };
  
  return (
    // ★★★ 4. 新しい要素（画像選択ボタン、プレビュー）を追加したフォーム ★★★
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="いまどうしてる？"
      />
      
      {/* 画像プレビュー */}
      {previewUrl && <img src={previewUrl} alt="Preview" style={{maxWidth: '100%', height: 'auto', marginTop: '10px', borderRadius: '15px'}} />}

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px'}}>
        {/* 画像選択ボタン */}
        <input 
          type="file" 
          accept="image/*"
          onChange={handleImageChange}
          style={{display: 'none'}} // input自体は隠す
          ref={fileInputRef} 
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} style={{backgroundColor: 'transparent', padding: '8px', color: '#1DA1F2', fontSize: '24px'}}>
          🖼️
        </button>

        {/* 投稿ボタン */}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '投稿中...' : '投稿する'}
        </button>
      </div>
    </form>
  );
};