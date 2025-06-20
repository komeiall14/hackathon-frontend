import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostForm } from '../PostForm';
import { QuoteRetweetModal } from '../QuoteRetweetModal';
import { BrowserRouter } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';

global.fetch = jest.fn();
const mockLoginUser = {
  uid: 'test-user',
  displayName: 'テストユーザー',
  getIdToken: () => Promise.resolve('test-token'),
} as unknown as FirebaseUser;

describe('Post-Related Components', () => {
  
  describe('PostForm', () => {
    test('allows typing and submitting', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      const mockOnPostSuccess = jest.fn();
      render(<BrowserRouter><PostForm loginUser={mockLoginUser} onPostSuccess={mockOnPostSuccess} onBuzzStart={()=>{}} onFlameStart={()=>{}} /></BrowserRouter>);
      await userEvent.type(screen.getByPlaceholderText('いまどうしてる？'), 'テスト投稿');
      await userEvent.click(screen.getByRole('button', { name: '投稿する' }));
      await waitFor(() => expect(mockOnPostSuccess).toHaveBeenCalled());
    });
  });

  describe('QuoteRetweetModal', () => {
    const mockPost = { post_id: 'p1', user_name: '元の投稿者', content: '元の投稿', created_at: new Date().toISOString() } as any;
    test('allows submitting a quote retweet', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      const mockOnQuoteSuccess = jest.fn();
      render(<QuoteRetweetModal post={mockPost} loginUser={mockLoginUser} onClose={()=>{}} onQuoteSuccess={mockOnQuoteSuccess} />);
      await userEvent.type(screen.getByPlaceholderText('コメントを追加...'), '引用コメント');
      await userEvent.click(screen.getByRole('button', { name: 'ポストする' }));
      await waitFor(() => expect(mockOnQuoteSuccess).toHaveBeenCalled());
    });
  });
});