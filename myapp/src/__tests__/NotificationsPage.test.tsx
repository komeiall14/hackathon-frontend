import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationsPage } from './NotificationsPage';
import { User as FirebaseUser } from 'firebase/auth';

global.fetch = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useOutletContext: () => ({
        loginUser: { getIdToken: () => Promise.resolve('test-token') } as FirebaseUser,
    }),
}));

describe('NotificationsPage', () => {
    test('fetches and displays notifications', async () => {
        const mockNotifications = [
            { id: 'n1', type: 'like', actor: { name: 'いいねした人', profile_image_url: null }, created_at: new Date().toISOString() },
            { id: 'n2', type: 'follow', actor: { name: 'フォローした人', profile_image_url: null }, created_at: new Date().toISOString() },
        ];
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockNotifications),
        });

        render(<MemoryRouter><NotificationsPage /></MemoryRouter>);
        
        expect(await screen.findByText(/さんがあなたの投稿に「いいね」しました/)).toBeInTheDocument();
        expect(await screen.findByText(/さんがあなたをフォローしました/)).toBeInTheDocument();
        // 既読APIの呼び出しも確認
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/notifications/read'), expect.any(Object));
    });
});