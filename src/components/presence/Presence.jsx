import DiscordPresence from './DiscordPresence';
import SpotifyPresence from './SpotifyPresence';

function Presence() {
  return (
    <div className="presence-wrapper">
      <DiscordPresence />
      <SpotifyPresence />
    </div>
  );
}

export default Presence;