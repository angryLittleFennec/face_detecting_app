import React from 'react';
import { render, screen } from '@testing-library/react';
import HlsPlayer from './HlsPlayer';
import videojs from 'video.js';

// Мокаем video.js
jest.mock('video.js');

describe('HlsPlayer Component', () => {
    const url = 'http://example.com/video';

    beforeEach(() => {
        // Сброс мока перед каждым тестом
        videojs.mockClear();
    });

    test('renders video element', () => {
        render(<HlsPlayer url={url} />);

        // Проверяем, что элемент video отрендерился
        const videoElement = screen.getByRole('video');
        expect(videoElement).toBeInTheDocument();
    });

    test('initializes video.js player with correct options', () => {
        render(<HlsPlayer url={url} />);

        // Проверяем, что video.js был вызван с правильными параметрами
        expect(videojs).toHaveBeenCalledTimes(1);
        expect(videojs).toHaveBeenCalledWith(expect.anything(), {
            controls: true,
            autoplay: true,
            preload: 'auto',
            sources: [
                {
                    src: `${url}/index.m3u8`,
                    type: 'application/x-mpegURL',
                },
            ],
        });
    });

    test('disposes player on unmount', () => {
        const { unmount } = render(<HlsPlayer url={url} />);

        // Удаляем компонент
        unmount();

        // Проверяем, что dispose был вызван
        expect(videojs().dispose).toHaveBeenCalledTimes(1);
    });
});
