import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InitialAvatar } from './InitialAvatar';
import { PageHeader } from './PageHeader';
import { MemoryRouter } from 'react-router-dom';

describe('Core UI Components', () => {
    describe('InitialAvatar', () => {
        test('renders correct initial', () => {
            render(<InitialAvatar name="アバター" size={40} />);
            expect(screen.getByText('ア')).toBeInTheDocument();
        });
    });

    describe('PageHeader', () => {
        test('renders title and back button', () => {
            render(<MemoryRouter><PageHeader title="テストページ" /></MemoryRouter>);
            expect(screen.getByRole('heading', { name: 'テストページ' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
        });
    });
});