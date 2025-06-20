import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 
import { SpacePage } from './SpacePage';

import { PostList } from './PostList'; 
import { UserProfile } from './UserProfile';
import { SearchResults } from './SearchResults';
import { PostDetailPage } from './PostDetailPage';
import { QuoteRetweetsPage } from './QuoteRetweetsPage';
import { FollowingPage } from './FollowingPage';
import { FollowersPage } from './FollowersPage';
import { MessagesPage } from './MessagesPage';
import { ChatWindow } from './ChatWindow'; 
import { Home } from './Home'; 
import { NotificationsPage } from './NotificationsPage';
import { BookmarksPage } from './BookmarksPage';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Appコンポーネントをレイアウトルートとして設定 */}
        <Route path="/" element={<App />}>
          {/* URLが "/" の場合にOutletに表示される内容 */}
          <Route index element={<Home />} /> 

          <Route path="space" element={<SpacePage />} />

          
          {/* URLが "/messages" や "/messages/..." の場合にOutletに表示される内容 */}
          <Route path="messages" element={<MessagesPage />}>
            <Route path=":conversationId" element={<ChatWindow />} />
          </Route>

          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="bookmarks" element={<BookmarksPage />} />

          {/* その他のページのルーティング */}
          <Route path="users/:userId" element={<UserProfile />} />
          <Route path="users/:userId/following" element={<FollowingPage />} />
          <Route path="users/:userId/followers" element={<FollowersPage />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="status/:postId" element={<PostDetailPage />} />
          <Route path="status/:postId/quotes" element={<QuoteRetweetsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

serviceWorkerRegistration.register();

reportWebVitals();