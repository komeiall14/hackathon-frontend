// src/EvaluationResultModal.tsx

import React from 'react';
// スタイルは既存の新規会話モーダルのものを流用します
import './NewConversationModal.css'; 

interface EvaluationResultModalProps {
  score: number;
  review: string;
  onClose: () => void;
}

export const EvaluationResultModal: React.FC<EvaluationResultModalProps> = ({ score, review, onClose }) => {
  // スコアに応じて色を決定 (70点以上は緑、未満は赤)
  const scoreColor = score >= 70 ? '#17bf63' : '#e0245e'; 

  return (
    <div 
        className="modal-overlay" 
        onClick={onClose}
        style={{
            alignItems: 'center',
            paddingTop: 0
        }}
    >
      <div 
           className="modal-content"
           onClick={e => e.stopPropagation()} 
           style={{
             padding: '20px', 
             textAlign: 'center',
             height: 'auto',
             maxHeight: '90vh'
           }}>

        <div className="modal-header" style={{justifyContent: 'center', border: 'none'}}>
            <h3>Geminiによる評価結果</h3>
        </div>

        <div className="modal-body" style={{overflowY: 'auto', padding: '0 16px'}}>
          {/* スコア表示サークル */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: scoreColor,
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '20px auto',
            border: '4px solid #38444d',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold' }}>{score}</span>
            <span style={{ fontSize: '16px' }}>点</span>
          </div>
          
          <h4>評価コメント</h4>
          <p style={{ textAlign: 'left', lineHeight: 1.6, color: '#e7e9ea', marginBottom: '20px' }}>{review}</p>
          
          {/* 不合格の場合のメッセージ */}
          {score < 70 && (
            <p style={{ color: scoreColor, fontWeight: 'bold', marginTop: '20px' }}>
              スコアが70点に満たなかったため、炎上は継続します。再度弁明を行ってください。
            </p>
          )}
        </div>
        
        {/* ▼▼▼ このボタンのスタイルを修正 ▼▼▼ */}
        <button 
            onClick={onClose} 
            style={{
                display: 'block', // ブロック要素として扱う
                width: 'fit-content', // 中身のテキストに合わせた幅にする
                margin: '20px auto 0 auto', // 上に余白、左右は自動で中央寄せ
                padding: '10px 30px', // 上下の余白を確保し、左右を広めに
                backgroundColor: '#38444d', // 背景色を少し明るいグレーに
                color: 'white',
                border: 'none',
                borderRadius: '20px', // 角を丸くする
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s' // ホバー時のアニメーション
            }}
            // マウスが乗った時のスタイル
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#536471'}
            // マウスが離れた時のスタイル
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#38444d'}
        >
            閉じる
        </button>
        {/* ▲▲▲ 修正ここまで ▲▲▲ */}

      </div>
    </div>
  );
};