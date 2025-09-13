// Link/src/components/presence/DiscordPresence.jsx

import { useState, useEffect } from 'react';
import '../css/DiscordPresence.css'; 

const DISCORD_ID = '268156620050006017';

const MANUAL_BADGES = [
  {
    name: "HypeSquad Brilliance",
    icon: "/badges/brilliance.png",
    link: "https://discord.com/settings/hypesquad-online",
  },
  {
    name: "Active Developer",
    icon: "/badges/active_developer.png",
    link: "https://support-dev.discord.com/hc/en-us/articles/10113997751447-Active-Developer-Badge?ref=badge",
  },
  {
    name: "Originally known as dumitrw#7396",
    icon: "/badges/legacy_user.png",
    link: "https://discord.com/users/268156620050006017",
  },
  {
    name: "Completed a Quest",
    icon: "/badges/quest_completed.png",
    link: "https://www.youtube.com/watch?v=xvFZjo5PgG0&list=RDxvFZjo5PgG0&start_radio=1", 
  },
  {
    name: "Orbs",
    icon: "/badges/orbs.png",
    link: "https://www.youtube.com/watch?v=xvFZjo5PgG0&list=RDxvFZjo5PgG0&start_radio=1", 
  },
];

const formatTime = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms / 1000) % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function DiscordPresence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stremioElapsed, setStremioElapsed] = useState(0); 

  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        if (response.ok) {
          const lanyardData = await response.json();
          setData(lanyardData);
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

  useEffect(() => {
    const stremioActivity = data?.data?.activities?.find(
      (activity) => activity.name === 'Stremio' && activity.timestamps?.start && activity.timestamps?.end
    );

    if (!stremioActivity) {
      setStremioElapsed(0); 
      return;
    }

    const start = stremioActivity.timestamps.start;
    const end = stremioActivity.timestamps.end;
    let rafId;

    function updateStremioProgress() {
      setStremioElapsed(Math.min(Date.now() - start, end - start));
      rafId = requestAnimationFrame(updateStremioProgress);
    }

    const currentTime = Date.now();
    if (currentTime >= start && currentTime < end) {
      updateStremioProgress(); 
    } else {
      setStremioElapsed(end - start); 
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [data]); 

  if (loading) return <div>Loading DiscordPresence.jsx ...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data?.success) return <div>No presence data available</div>;

  const { discord_user, discord_status, activities } = data.data;

  // --- LOGICĂ DE FILTRARE ȘI EXTRACȚIE CUSTOM STATUS ---
  let customStatusText = null; 
  const filteredActivities = activities.filter(activity => {
    // 1. Extrage textul Custom Status-ului (type 4)
    if (activity.type === 4) { 
      customStatusText = activity.state || activity.details || null;
      return false; // Exclude Custom Status (type 4) din lista de activități randate separat
    }

    // 2. Exclude Spotify (type 2)
    if (activity.type === 2) {
      return false;
    }
    
    // 3. Exclude activitatea Discord "Custom Status" bazată pe application_id
    if (activity.application_id === "1020297858911634455") {
      return false;
    }

    return true; // Include toate celelalte activități filtrate
  });
  // ---------------------------------------------------

  // Corectăm displayStatusText pentru afișare dacă detectăm concatenarea Custom Status-ului
  let displayStatusText = discord_status;
  if (customStatusText && discord_status.includes(customStatusText.replace(/\s/g, ''))) {
    displayStatusText = discord_status.replace(new RegExp(customStatusText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '').trim();
    if (displayStatusText === '') {
        displayStatusText = discord_status.split(' ')[0] || discord_status;
    }
  }


  return (
    <div className="presence-wrapper">
      <div className="discord-card">
        <div className="user-section">
         <div className={`avatar-wrapper ${discord_status}`}>
  <a href={`https://discord.com/users/${DISCORD_ID}`} target="_blank" rel="noopener noreferrer">
    {/* Avatarul */}
    <img
      src={`https://cdn.discordapp.com/avatars/${DISCORD_ID}/${discord_user.avatar}.png?size=128`}
      alt="Discord avatar"
      title="Viziteaza profil Discord"
      className="avatar"
    />
    {/* Overlay cu gluga Discord */}
    <img
      src="https://cdn.discordapp.com/avatar-decoration-presets/a_41445f736db3525135b6b9e1122f2254.png?size=160&passthrough=true"
      alt="Discord Hood Decoration"
      className="avatar-hood-decoration"
      draggable={false}
    />
  </a>
  <div className="status-dot"></div>
</div>
          <div>
            <div className="name-and-badges-container">
              <h3>
                {discord_user.username || discord_user.global_name}
              </h3>
              <div className="discord-badges">
                {MANUAL_BADGES.map(badge => (
                  badge.link ? (
                    <a
                      key={badge.name}
                      href={badge.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="discord-badge-wrapper"
                    >
                      <img
                        src={badge.icon}
                        alt={badge.name}
                        title={badge.name}
                        className="discord-badge-icon"
                      />
                    </a>
                  ) : (
                    <div
                      key={badge.name}
                      className="discord-badge-wrapper"
                    >
                      <img
                        src={badge.icon}
                        alt={badge.name}
                        title={badge.name}
                        className="discord-badge-icon"
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
            {/* Aici afișăm doar textul statusului și custom status-ul dedesubt (fără bulină) */}
            <p className="status-text-only"> {/* Clasa noua pentru textul statusului */}
              {displayStatusText} {/* Afișăm textul statusului curățat */}
              {/* Afișare CUSTOM STATUS CAND E IDLE */}
              {discord_status === 'idle' && customStatusText && (
                <span className="custom-status-text">
                  {customStatusText}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Randăm activitățile filtrate (Stremio, jocuri, VS Code etc.) */}
        {filteredActivities.map((activity) => {
          // --- Logică UNIFICATĂ pentru Stremio ---
          if (activity.name === 'Stremio') {
            const hasTimestamps = activity.timestamps?.start && activity.timestamps?.end;
            const start = hasTimestamps ? activity.timestamps.start : 0;
            const end = hasTimestamps ? activity.timestamps.end : 0;
            const duration = end - start;
            const percent = hasTimestamps ? Math.max(0, Math.min(100, (stremioElapsed / duration) * 100)) : 0;
            const isPlaying = hasTimestamps ? (Date.now() >= start && Date.now() < end) : false;

            let mainActivityText = "";
            let activityDisplayImage = null; 

            // Iconița Stremio - ACUM VA APAREA MEREU DACA EXISTA assets.large_image
            if (activity.assets?.large_image) {
                activityDisplayImage = (
                    <img
                      src={activity.assets.large_image.startsWith('mp:external/')
                        ? `https://media.discordapp.net/external/${activity.assets.large_image.slice(12)}`
                        : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`
                      }
                      alt={activity.assets.large_text || `${activity.name} icon`}
                      className="activity-image stremio-image"
                    />
                );
            }

            if (hasTimestamps) {
              mainActivityText = isPlaying ? "📺 Urmăresc pe Stremio" : "📺 Am urmărit pe Stremio";
            } else {
              mainActivityText = `🧭 Caut hentai pe Stremio`; 
            }

            return (
              <div key={activity.id} className="activity-link stremio-activity">
                <div className="activity-section">
                  <div className="activity-container">
                    {activityDisplayImage} 
                    <div className="activity-info">
                      <strong>{mainActivityText}</strong>
                      {activity.details && <p className="activity-title">{activity.details}</p>}
                      {activity.state && <p>{activity.state}</p>}
                      
                      {hasTimestamps && ( 
                        <div className="stremio-progress-wrapper">
                          <span className="stremio-time">{formatTime(stremioElapsed)}</span>
                          <div className="stremio-progress-bar">
                            <div
                              className="stremio-progress"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="stremio-time">{formatTime(duration)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          } 
          // --- Logică pentru Alte Activități (Jocuri, VS Code, etc.) ---
          else {
            let iconEmoji = '🎮'; 
            if (activity.name === 'Visual Studio Code') {
              iconEmoji = '💻';
            }

            return (
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
                        {iconEmoji} {activity.name}
                      </strong>
                      {activity.details && <p className="activity-title">{activity.details}</p>}
                      {activity.state && <p>{activity.state}</p>}
                      {activity.timestamps?.start && (
                        <p>
                          <span className="time-text">⏳</span>
                          {`${Math.floor((Date.now() - activity.timestamps.start) / 60000)} minute`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}