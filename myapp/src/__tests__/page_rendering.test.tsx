import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserProfile } from './UserProfile';
import { SearchResults } from './SearchResults';
import { NotificationsPage } from './NotificationsPage';

global.fetch = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ userId: 'test-id', postId: 'test-post-id' }),
  useOutletContext: () => ({ loginUser: { uid: 'test-user' } }),
}));

describe('Page Rendering Tests', () => {

  test('UserProfile page fetches and renders data', async () => {
    (fetch as jest.Mock).mockImplementation((url) => {
        if (url.toString().includes('posts')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'テストユーザー' }) });
    });
    render(<MemoryRouter><UserProfile /></MemoryRouter>);
    expect(await screen.findByText('テストユーザー')).toBeInTheDocument();
  });

  test('SearchResults page displays query and results', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve([{ content: '検索結果の投稿' }]) });
    render(
      <MemoryRouter initialEntries={['/search?q=test']}>
        <Routes><Route path="/search" element={<SearchResults />} /></Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('「test」の検索結果: 1件')).toBeInTheDocument();
  });

  test('NotificationsPage fetches and displays notifications', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve([{ id: 'n1', type: 'like', actor: { name: 'いいねした人' } }]) });
    render(<MemoryRouter><NotificationsPage /></MemoryRouter>);
    expect(await screen.findByText(/さんがあなたの投稿に「いいね」しました/)).toBeInTheDocument();
  });
});