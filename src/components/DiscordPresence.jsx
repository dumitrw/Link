import { useState, useEffect } from 'react';
import './DiscordPresence.css';

const DISCORD_ID = '268156620050006017';

const statusColors = {
  online: { 
    main: '#43B54C',
    shadow: 'rgba(67, 181, 76, 0.37)',
    glitchColors: ['#43B54C', '#2b4539', '#61dca3']
  },
  idle: {
    main: '#FAA61A',
    shadow: 'rgba(250, 166, 26, 0.37)',
    glitchColors: ['#FAA61A', '#8B6914', '#FFD700']
  },
  dnd: {
    main: '#E02C2C',
    shadow: 'rgba(224, 44, 44, 0.37)',
    glitchColors: ['#E02C2C', '#8B0000', '#FF4500']
  },
  offline: {
    main: '#747F8D',
    shadow: 'rgba(116, 127, 141, 0.37)',
    glitchColors: ['#747F8D', '#36393F', '#4F545C']
  }
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
};

export default function DiscordPresence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        if (response.ok) {
          const lanyardData = await response.json();
          setData(lanyardData);
          
          if (lanyardData.data.discord_status) {
            const status = lanyardData.data.discord_status;
            const statusConfig = statusColors[status];
            const card = document.querySelector('.discord-card');
            
            if (card && statusConfig) {
              card.style.setProperty('--status-color', statusConfig.shadow);
              
              // Emit status color change event immediately
              console.log('Emitting new colors:', statusConfig.glitchColors);
              const event = new CustomEvent('discord-status-change', {
                detail: {
                  colors: statusConfig.glitchColors
                }
              });
              window.dispatchEvent(event);
              console.log('Event emitted with colors:', statusConfig.glitchColors);
            }
          }
        } else {
          setError(`Failed to fetch: ${response.status}`);
        }
      } catch (e) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchPresence();
    
    // Update every 5 seconds to match Discord more closely
    const interval = setInterval(fetchPresence, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading Discord presence...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data?.success) return <div>No presence data available</div>;

  return (
    <div className="presence-wrapper">
      <div className="discord-card">      
        <div className="user-section">
          <a href={`https://discord.com/users/${DISCORD_ID}`} target="_blank" rel="noopener noreferrer">
            <img 
              src={`https://cdn.discordapp.com/avatars/${DISCORD_ID}/${data.data.discord_user.avatar}.png?size=128`}
              alt="Discord avatar"
              className="avatar"
            />
          </a>
          <div>
            <h3>
              {data.data.discord_user.username || data.data.discord_user.global_name}
              <span className="guild-tag">&#60;3</span>
            </h3>
            <p className={`status ${data.data.discord_status}`}>
              {data.data.discord_status}
            </p>
          </div>
        </div>      
        {data.data.activities?.filter(activity => activity.type !== 2).map((activity) => (
          <div key={activity.id} className="activity-link">
            <div className="activity-section">
              <div className="activity-container">
                {activity.assets?.large_image && (
                  <img 
                    src={activity.assets.large_image.startsWith('mp:external/') 
                      ? `https://media.discordapp.net/external/${activity.assets.large_image.slice(12)}`
                      : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`
                    } 
                    alt={activity.assets.large_text || `${activity.name} icon`}
                    className="activity-image"
                  />
                )}
                <div className="activity-info">
                  <strong>🎮 {activity.name}</strong>
                  {activity.details && <p className="activity-title">{activity.details}</p>}
                  {activity.state && <p>{activity.state}</p>}
                  {activity.timestamps?.start && (
                    <p><span className="time-text">⏰</span> {Math.floor((Date.now() - activity.timestamps.start) / 60000)} minute</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.data.listening_to_spotify && data.data.spotify && (
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
              <div className="spotify-info">
                <strong>🎵 Ascult muzica pe Spotify</strong>
                <p className="song-title">{data.data.spotify.song}</p>
                <p><span className="by-text">by</span> {data.data.spotify.artist}</p>
              </div>
            </div>
          </div>
        </a>
      )}
    </div>
  );
}