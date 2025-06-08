import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import toast from 'react-hot-toast';

// Appコンポーネントからログインユーザー情報とコールバック関数を受け取るためのPropsの型定義
interface PostFormProps {
  loginUser: FirebaseUser;
  onPostSuccess: () => void; // 親から受け取る関数の型定義を追加
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const PostForm: React.FC<PostFormProps> = ({ loginUser, onPostSuccess }) => {
  // 投稿内容のテキストを保持するためのState
  const [content, setContent] = useState<string>('');
  // 投稿処理中の状態を管理するためのState
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('投稿内容を入力してください。');  
      return;
    }
    if (content.trim().length > 280) { // 例：文字数制限
      toast.error('投稿は280文字以内で入力してください。'); 
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_API_URL}/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 将来的に認証トークンをここに含めることができます
          // 'Authorization': `Bearer ${await loginUser.getIdToken()}`
        },
        body: JSON.stringify({
          content: content.trim(),
          user_id: loginUser.uid, // ログインユーザーのID
          user_name: loginUser.displayName || '名無しさん', // ログインユーザーの表示名
        }),
      });

      if (!response.ok) {
        throw new Error('投稿に失敗しました。');
      }

      toast.success('投稿に成功しました！');   
      setContent(''); // フォームをクリア

      // ★★★ ページリロードを削除し、親から受け取った関数を呼び出す ★★★
      onPostSuccess(); 

    } catch (err: any) {
        toast.error(`エラー: ${err.message}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section style={{ marginTop: '30px', marginBottom: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', width: '80%', maxWidth: '600px' }}>
      <h2>新しい投稿を作成</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="いまどうしてる？"
          style={{ width: '95%', height: '80px', padding: '10px', fontSize: '16px', marginBottom: '10px' }}
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
          {isSubmitting ? '投稿中...' : '投稿する'}
        </button>
      </form>
    </section>
  );
};