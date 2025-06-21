import React from 'react';
import './FlameEffect.css';

export const FlameEffect: React.FC = () => {
  return (
    <div className="flame-container" aria-hidden="true">
      <div className="flame f1"></div>
      <div className="flame f2"></div>
      <div className="flame f3"></div>
      <div className="flame f4"></div>
      <div className="flame f5"></div>
      {/* アニメーションに多様性を出すために、遅延や位置が異なる要素を追加 */}
      <div className="flame f1" style={{ animationDelay: '2s', left: '20%' }}></div>
      <div className="flame f2" style={{ animationDelay: '1.5s', left: '40%' }}></div>
      <div className="flame f3" style={{ animationDelay: '2.5s', left: '60%' }}></div>
      <div className="flame f4" style={{ animationDelay: '1s', left: '80%' }}></div>
    </div>
  );
};
