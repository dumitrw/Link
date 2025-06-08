import { useState, useEffect } from 'react';
import './DiscordPresence.css';

const DISCORD_ID = '268156620050006017'; // Your Discord ID

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
          
          // Actualizează culoarea în funcție de status
          const statusColors = {
            online: 'rgba(67, 181, 76, 0.37)',
            idle: 'rgba(250, 166, 26, 0.37)',
            dnd: 'rgba(224, 44, 44, 0.37)',
            offline: 'rgba(116, 127, 141, 0.37)'
          };
          
          const card = document.querySelector('.discord-card');
          if (card && lanyardData.data.discord_status) {
            card.style.setProperty('--status-color', statusColors[lanyardData.data.discord_status]);
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
    
    // Optional: Set up polling for real-time updates
    const interval = setInterval(fetchPresence, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading Discord presence...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data?.success) return <div>No presence data available</div>;

  return (
    <div className="discord-card">      <div className="user-section">
        <a href={`https://discord.com/users/${DISCORD_ID}`} target="_blank" rel="noopener noreferrer">
          <img 
            src={`https://cdn.discordapp.com/avatars/${DISCORD_ID}/${data.data.discord_user.avatar}.png?size=128`}
            alt="Discord avatar"
            className="avatar"
          />
        </a>
        <div>
          <h3>{data.data.discord_user.username || data.data.discord_user.global_name}</h3>
          <p className={`status ${data.data.discord_status}`}>
            {data.data.discord_status}
          </p>
        </div>
      </div>      {data.data.listening_to_spotify && data.data.spotify && (
        <a 
          href={`https://open.spotify.com/track/${data.data.spotify.track_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="spotify-link"
        >
          <div className="spotify-section">
            <strong>🎵 Ascult muzica pe Spotify</strong>
            <p>{data.data.spotify.song} by {data.data.spotify.artist}</p>
          </div>
        </a>
      )}
      
      {/* Add styling as needed */}
    </div>
  );
}