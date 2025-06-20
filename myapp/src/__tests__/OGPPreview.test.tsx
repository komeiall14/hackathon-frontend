import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OGPPreview } from '../OGPPreview';

global.fetch = jest.fn();

describe('OGPPreview', () => {
    test('shows loading skeleton initially, then displays OGP data', async () => {
        const mockOgpData = { title: 'テストサイト', description: 'テストの説明文', site_url: 'https://example.com' };
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockOgpData),
        });

        render(<OGPPreview url="https://example.com" />);

        // 最初はローディングスケルトンが表示されている（この確認は難しい場合がある）
        expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument(); // Roleは仮。適切なRoleがなければ別の方法で

        // findBy*で非同期に表示される要素を待つ
        expect(await screen.findByText('テストサイト')).toBeInTheDocument();
        expect(screen.getByText('テストの説明文')).toBeInTheDocument();
        expect(screen.getByText('example.com')).toBeInTheDocument();
    });
});

// `OGPPreview.css`に `role="progressbar"` を追加する必要があるかもしれません。
// 例: <div className="ogp-card ogp-loading" role="progressbar">