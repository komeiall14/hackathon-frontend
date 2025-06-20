import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MessagesPage } from './MessagesPage';
import { ChatWindow } from './ChatWindow';
import { User as FirebaseUser } from 'firebase/auth';

global.fetch = jest.fn();
const mockLoginUser = {
    uid: 'test-user',
    getIdToken: () => Promise.resolve('test-token'),
} as unknown as FirebaseUser;

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useOutletContext: () => ({ loginUser: mockLoginUser }),
}));

describe('Direct Message Feature', () => {
    test('user can see conversation list, open a chat, and send a message', async () => {
        const mockConversations = [{ conversation_id: 'conv1', other_user: { name: '相手ユーザー' }, updated_at: new Date().toISOString() }];
        const mockMessages = [{ id: 'msg1', sender_id: 'other-user', content: 'こんにちは' }];

        (fetch as jest.Mock).mockImplementation((url) => {
            const urlStr = url.toString();
            if (urlStr.endsWith('/api/conversations')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockConversations) });
            if (urlStr.includes('/messages')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMessages) });
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
        
        render(
            <MemoryRouter initialEntries={['/messages']}>
                <Routes>
                    <Route path="/messages" element={<MessagesPage />}>
                        <Route path=":conversationId" element={<ChatWindow />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        // 1. 会話リストが表示される
        expect(await screen.findByText('相手ユーザー')).toBeInTheDocument();
        
        // 2. 会話をクリックしてチャットウィンドウを開く
        await userEvent.click(screen.getByText('相手ユーザー'));
        
        // 3. 過去のメッセージが表示される
        expect(await screen.findByText('こんにちは')).toBeInTheDocument();
        
        // 4. メッセージを送信する
        (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({id: 'msg2', sender_id: 'test-user', content: 'テスト返信'}) });
        
        const textarea = screen.getByPlaceholderText('新しいメッセージを送信');
        await userEvent.type(textarea, 'テスト返信');
        await userEvent.click(screen.getByRole('button', {name: ''})); // アイコンボタンのためnameなし

        // 5. 送信したメッセージが画面に表示される
        expect(await screen.findByText('テスト返信')).toBeInTheDocument();
    });
});