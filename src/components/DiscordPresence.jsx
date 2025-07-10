import { useState, useEffect } from 'react';
import './DiscordPresence.css';

const DISCORD_ID = '268156620050006017';

const MANUAL_BADGES = [
  {
    name: "Nitro",
    icon: "/badges/nitro.png",
    link: "https://discord.com/nitro"
  },
  {
    name: "HypeSquad Brilliance",
    icon: "/badges/brilliance.png",
    link: "https://discord.com/settings/hypesquad-online"
  },
  {
    name: "Active Developer",
    icon: "/badges/active_developer.png",
    link: "https://support-dev.discord.com/hc/en-us/articles/10113997751447"
  },
  {
    name: "Server Booster",
    icon: "/badges/booster.png",
    link: "https://support.discord.com/hc/en-us/articles/360028038352"
  },
  {
    name: "Originally known as dumitrw#7396",
    icon: "/badges/legacy_user.png",
    link: "https://discord.com/users/268156620050006017"
  },
  {
    name: "Completed a Quest",
    icon: "/badges/quest_completed.png",
    link: "https://www.youtube.com/watch?v=xvFZjo5PgG0&list=RDxvFZjo5PgG0&start_radio=1"
  },
];

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

const formatTime = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor(ms / 1000) % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
              const event = new CustomEvent('discord-status-change', {
                detail: { colors: statusConfig.glitchColors }
              });
              window.dispatchEvent(event);
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
            <div className="discord-badges">
              {MANUAL_BADGES.map(badge => (
                badge.link ? (
                  <a key={badge.name} href={badge.link} target="_blank" rel="noopener noreferrer">
                    <img
                      src={badge.icon}
                      alt={badge.name}
                      title={badge.name}
                      className="discord-badge"
                    />
                  </a>
                ) : (
                  <img
                    key={badge.name}
                    src={badge.icon}
                    alt={badge.name}
                    title={badge.name}
                    className="discord-badge"
                  />
                )
              ))}
            </div>
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
                  <strong>
                    {activity.name === 'Stremio' ? '🎬' : '🎮'} {activity.name}
                  </strong>
                  {activity.details && <p className="activity-title">{activity.details}</p>}
                  {activity.state && <p>{activity.state}</p>}
                  {activity.timestamps?.start && (
                    <p>
                      <span className="time-text">⏳</span>
                      {activity.name === 'Stremio' && activity.timestamps.end
                        ? `${formatTime(Date.now() - activity.timestamps.start)}/${formatTime(activity.timestamps.end - activity.timestamps.start)}`
                        : `${Math.floor((Date.now() - activity.timestamps.start) / 60000)} minute`
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}