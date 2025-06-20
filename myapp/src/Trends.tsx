// src/Trends.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// バックエンドから受け取るトレンドの型を定義
interface Trend {
  topic: string;
  count: number;
}

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export const Trends: React.FC = () => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${BACKEND_API_URL}/api/trends`);
        if (!response.ok) {
          throw new Error('トレンドの取得に失敗しました。');
        }
        const data: Trend[] = await response.json();
        setTrends(data);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrends();
  }, []);

  if (isLoading) {
    return (
      <div className="trends-container">
        <h3>日本のトレンド</h3>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    // ▼▼▼ 変更箇所はこの行です ▼▼▼
    <div className="trends-container" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
      <h3>日本のトレンド</h3>
      {trends.length > 0 ? (
        <ul className="trends-list">
          {trends.map((trend, index) => (
            <li key={index} className="trend-item">
              <Link to={`/search?q=${encodeURIComponent('#' + trend.topic)}`}>
                <span className="trend-topic">#{trend.topic}</span>
                <span className="trend-count">{trend.count} posts</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>現在トレンドはありません。</p>
      )}
    </div>
  );
};