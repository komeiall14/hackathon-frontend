import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EvaluationResultModal } from '../EvaluationResultModal';

describe('EvaluationResultModal', () => {
    test('displays high score with green color', () => {
        render(<EvaluationResultModal score={85} review="素晴らしい弁明です。" onClose={() => {}} />);
        const scoreElement = screen.getByText('85');
        expect(scoreElement).toBeInTheDocument();
        // 親要素の背景色をテスト
        expect(scoreElement.parentElement).toHaveStyle('background-color: #17bf63');
        expect(screen.getByText('素晴らしい弁明です。')).toBeInTheDocument();
    });

    test('displays low score with red color and warning message', () => {
        render(<EvaluationResultModal score={40} review="論点がずれています。" onClose={() => {}} />);
        const scoreElement = screen.getByText('40');
        expect(scoreElement).toBeInTheDocument();
        expect(scoreElement.parentElement).toHaveStyle('background-color: #e0245e');
        expect(screen.getByText(/炎上は継続します/)).toBeInTheDocument();
    });
});