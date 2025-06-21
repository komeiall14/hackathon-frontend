import React from 'react';
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

        <div 
          className="modal-footer" 
          style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #38444d', // 区切り線を追加
            display: 'flex',
            justifyContent: 'flex-end' // Flexboxで要素を右端に配置
          }}
        >
          <button 
              onClick={onClose} 
              style={{
                  // margin と display を削除し、レイアウトは親の div に任せる
                  padding: '10px 30px',
                  backgroundColor: '#38444d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#536471'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#38444d'}
          >
              閉じる
          </button>
        </div>

      </div>
    </div>
  );
};