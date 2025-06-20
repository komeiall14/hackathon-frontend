import React, { useState, useEffect } from 'react';
import './OGPPreview.css';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

interface OGPData {
  title?: string;
  description?: string;
  image_url?: string;
  site_url?: string;
}

interface OGPPreviewProps {
  url: string;
}

export const OGPPreview: React.FC<OGPPreviewProps> = ({ url }) => {
  const [ogpData, setOgpData] = useState<OGPData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOGP = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${BACKEND_API_URL}/api/ogp?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          return;
        }
        const data: OGPData = await response.json();
        // titleがない場合は表示しない
        if (data.title) {
          setOgpData(data);
        }
      } catch (err) {
        console.error("Failed to fetch OGP data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOGP();
  }, [url]);

  if (isLoading) {
    // ローディング中のスケルトン表示
    return (
      <div className="ogp-card ogp-loading" onClick={e => e.stopPropagation()}>
        <div className="ogp-skeleton-text long"></div>
        <div className="ogp-skeleton-text short"></div>
      </div>
    );
  }

  if (!ogpData) {
    return null; // データがなければ何も表示しない
  }

  return (
    <a href={ogpData.site_url} target="_blank" rel="noopener noreferrer" className="ogp-card-link" onClick={e => e.stopPropagation()}>
      <div className="ogp-card">
        {ogpData.image_url && <img src={ogpData.image_url} alt={ogpData.title} className="ogp-image" />}
        <div className="ogp-content">
          <p className="ogp-title">{ogpData.title}</p>
          {ogpData.description && <p className="ogp-description">{ogpData.description}</p>}
          {ogpData.site_url && <p className="ogp-site-url">{new URL(ogpData.site_url).hostname}</p>}
        </div>
      </div>
    </a>
  );
};