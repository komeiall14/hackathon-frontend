import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageHeader.css'; 

interface PageHeaderProps {
  title: string;
  actionElement?: React.ReactNode; 
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, actionElement }) => {
  const navigate = useNavigate();

  return (
    <div className="page-header-container">
      <div className="page-header-left">
        <button onClick={() => navigate(-1)} className="back-button" title="戻る">
          ←
        </button>
        <h2 className="page-header-title">{title}</h2>
      </div>
      {actionElement && (
        <div className="page-header-right">
          {actionElement}
        </div>
      )}
    </div>
  );
};