import React, { useEffect } from 'react';
import videojs from 'video.js';
import './HlsPlayer.css';
import 'video.js/dist/video-js.css';

const HlsPlayer = ({ url }) => {
    const videoRef = React.useRef(null);
    const playerRef = React.useRef(null);

    useEffect(() => {
        // Инициализация плеера
        playerRef.current = videojs(videoRef.current, {
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

        // Очистка плеера при размонтировании компонента
        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
            }
        };
    }, [url]);

    return (
        <div data-vjs-player>
            <video ref={videoRef} className="video-js vjs-big-play-centered" />
        </div>
    );
};

export default HlsPlayer;
