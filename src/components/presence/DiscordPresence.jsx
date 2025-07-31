import { useState, useEffect } from 'react';
import '../css/DiscordPresence.css'; // Acest fișier CSS va conține acum doar stilurile pentru Discord și Stremio

const DISCORD_ID = '268156620050006017';

const MANUAL_BADGES = [
  {
    name: "HypeSquad Brilliance",
    icon: "/badges/brilliance.png",
    lnk: "https://discord.com/settings/hypesquad-online",
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
  const [stremioElapsed, setStremioElapsed] = useState(0); // Stare pentru timpul Stremio

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

  // Efect pentru a anima bara de progres Stremio
  useEffect(() => {
    const stremioActivity = data?.data?.activities?.find(
      (activity) => activity.name === 'Stremio' && activity.timestamps?.start && activity.timestamps?.end
      // ^^^^^^ Asigură-te că 'Stremio' este numele exact.
    );

    if (!stremioActivity) {
      setStremioElapsed(0); // Resetează elapsed dacă nu există activitate Stremio validă
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
      updateStremioProgress(); // Pornim animația doar dacă se redă
    } else {
      setStremioElapsed(end - start); // Setăm la 100% dacă s-a terminat
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [data]); // Rulăm acest efect ori de câte ori datele Lanyard se actualizează

  if (loading) return <div>Loading DiscordPresence.jsx ...</div>;
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
              title="Viziteaza profil Discord"
              className="avatar"
            />
          </a>
          <div>
            <div className="name-and-badges-container">
            <h3>
              {data.data.discord_user.username || data.data.discord_user.global_name}
              {/* <span className="guild-tag">&#60;3</span> */}
            </h3>
              <div className="discord-badges">
               {MANUAL_BADGES.map(badge => (
               badge.link ? (
      // Folosește <a> atunci când există un link
      <a
        key={badge.name}
        href={badge.link}
        target="_blank"
        rel="noopener noreferrer"
        className="discord-badge-wrapper" // Aici folosim noua clasă
      >
        <img
          src={badge.icon}
          alt={badge.name}
          title={badge.name}
          className="discord-badge-icon" // Aici folosim clasa pentru img
        />
      </a>
    ) : (
      // Folosește un <div> ca wrapper când nu există link, pentru consistență structurală
      <div
        key={badge.name}
        className="discord-badge-wrapper" // Aici folosim noua clasă
      >
        <img
          src={badge.icon}
          alt={badge.name}
          title={badge.name}
          className="discord-badge-icon" // Aici folosim clasa pentru img
        />
      </div>
    )
  ))}
</div> 
</div>
            <p className={`status ${data.data.discord_status}`}>
              {data.data.discord_status}
            </p>
          </div>
        </div>

        {/* Randăm doar activitățile relevante pentru DiscordPresence: Stremio și alte activități non-Spotify */}
        {data.data.activities?.filter(activity => activity.type !== 2 && activity.name !== 'Spotify').map((activity) => {
          // NOU: Blocul pentru activitatea Stremio (inclusiv bara de progres)
          if (activity.name === 'Stremio' && activity.timestamps?.start && activity.timestamps?.end) {
            const start = activity.timestamps.start;
            const end = activity.timestamps.end;
            const duration = end - start;
            const percent = Math.max(0, Math.min(100, (stremioElapsed / duration) * 100));
            const isPlaying = (Date.now() >= start && Date.now() < end);
            const statusText = isPlaying ? "📺 Urmăresc pe Stremio" : "📺 Am urmărit pe Stremio";

            return (
              <div key={activity.id} className="activity-link stremio-activity">
                <div className="activity-section">
                  <div className="activity-container">
                    {activity.assets?.large_image && (
                      <img
                        src={activity.assets.large_image.startsWith('mp:external/')
                          ? `https://media.discordapp.net/external/${activity.assets.large_image.slice(12)}`
                          : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`
                        }
                        alt={activity.assets.large_text || `${activity.name} icon`}
                        className="activity-image stremio-image"
                      />
                    )}
                    <div className="activity-info">
                      <strong>{statusText}</strong>
                      {activity.details && <p className="activity-title">{activity.details}</p>}
                      {activity.state && <p>{activity.state}</p>}
                      {/* Bara de progres Stremio */}
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
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            // Blocul pentru toate celelalte activități (non-Spotify, non-Stremio)
            // sau Stremio fără timestamps valide (deși ar trebui să fie filtrat sus)
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
                        {/* Nu mai avem "Stremio" aici, doar "🎮" pentru alte jocuri/activități */}
                        {activity.name === 'Visual Studio Code' ? '💻' : '🎮'} {activity.name}
                      </strong>
                      {activity.details && <p className="activity-title">{activity.details}</p>}
                      {activity.state && <p>{activity.state}</p>}
                      {/* Pentru alte activități, afișăm timpul scurs în minute */}
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