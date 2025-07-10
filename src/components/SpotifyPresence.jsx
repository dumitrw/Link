import { useState, useEffect } from 'react';
import './SpotifyPresence.css';

const DISCORD_ID = '268156620050006017';

export default function SpotifyPresence() {
  const [data, setData] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const fetchPresence = async () => {
      const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
      const lanyardData = await response.json();
      setData(lanyardData);
    };
    fetchPresence();
    const interval = setInterval(fetchPresence, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data?.data?.listening_to_spotify || !data.data.spotify) return;
    const start = data.data.spotify.timestamps.start;
    const end = data.data.spotify.timestamps.end;
    let raf;
    function update() {
      setElapsed(Math.min(Date.now() - start, end - start));
      raf = requestAnimationFrame(update);
    }
    update();
    return () => cancelAnimationFrame(raf);
  }, [data]);

  if (!data?.data?.listening_to_spotify || !data.data.spotify) return null;

  const start = data.data.spotify.timestamps.start;
  const end = data.data.spotify.timestamps.end;
  const duration = end - start;
  const percent = Math.max(0, Math.min(100, (elapsed / duration) * 100));

  const formatTime = ms => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <a
      href={`https://open.spotify.com/track/${data.data.spotify.track_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="spotify-link"
    >
      <div className="spotify-section">
        <div className="spotify-album">
          <img
            src={data.data.spotify.album_art_url}
            alt={`${data.data.spotify.song} album art`}
            className="album-art"
          />
          <div className="spotify-meta">
            <strong className="spotify-presence-title">🎵 Ascult muzica pe Spotify</strong>
            <div className="spotify-info">
              <p className="song-title">{data.data.spotify.song}</p>
              <p className="song-artist"><span className="by-text">by</span> {data.data.spotify.artist}</p>
              <div className="spotify-progress-wrapper">
                <span className="spotify-time">{formatTime(elapsed)}</span>
                <div className="spotify-progress-bar">
                  <div
                    className="spotify-progress"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="spotify-time">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}