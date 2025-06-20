// src/ExplanationModal.tsx

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Post } from './PostList';
import './QuoteRetweetModal.css'; // スタイルは既存の引用RTモーダルのものを流用します

interface ExplanationModalProps {
  originalPost: Post;
  onClose: () => void;
  // 提出する際に、弁明のテキストだけを渡すようにします
  onSubmit: (explanationText: string) => void; 
  isSubmitting: boolean;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({ originalPost, onClose, onSubmit, isSubmitting }) => {
  const [explanation, setExplanation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation.trim()) {
      toast.error('弁明を入力してください。');
      return;
    }
    // 親コンポーネント(App.tsx)に弁明テキストを渡して、API呼び出しを依頼します
    onSubmit(explanation);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-qt" // 引用RTモーダルと同じクラス名でスタイルを適用
           onClick={e => e.stopPropagation()}> 
        <div className="modal-header-qt">
          <button onClick={onClose} className="close-button-qt">&times;</button>
        </div>
        
        <div className="modal-body-qt">
          <h3 style={{marginTop: 0}}>投稿に対する弁明</h3>
          <p style={{color: '#8899a6', fontSize: '15px'}}>
            炎上した投稿について、誠意ある弁明や謝罪、状況説明を入力してください。内容はGeminiによって評価されます。
          </p>
          <form onSubmit={handleSubmit}>
            <div className="qt-form-body">
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="弁明や謝罪の言葉を入力..."
                className="qt-textarea"
                style={{ minHeight: '150px' }} // 入力欄を広めに
              />
            </div>

            <div className="original-post-container-qt" style={{marginTop: '20px'}}>
              <p style={{fontWeight: 'bold'}}>炎上した投稿:</p>
              <p>{originalPost.content}</p>
            </div>

            <div className="modal-footer-qt" style={{marginTop: '20px'}}>
              <button 
                type="submit" 
                className="submit-button-qt" 
                disabled={isSubmitting || !explanation.trim()}
                // 炎上体験に合わせたボタンテキストに変更
              >
                {isSubmitting ? '評価中...' : '弁明を投稿して評価を受ける'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};