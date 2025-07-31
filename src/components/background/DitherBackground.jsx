// src/components/background/DitherBackground.jsx
'use client';

import Dither from './Dither.jsx'; // <<< Make sure this import is correct and Dith.jsx exists

function DitherBackground() {
  const [isAnimationPaused, setIsAnimationPaused] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ditherAnimationEnabled');
      return stored ? !JSON.parse(stored) : false;
    }
    return false;
  });

  useEffect(() => {
    const handleToggle = (event) => {
      setIsAnimationPaused(!event.detail);
      console.log('DitherBackground received toggle event. Animation will be paused:', !event.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ditherAnimationToggle', handleToggle);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('ditherAnimationToggle', handleToggle);
      }
    };
  }, []);

  return (
    <Dither
      waveColor={[0.5, 0.5, 0.5]}
      disableAnimation={isAnimationPaused}
      enableMouseInteraction={true}
      mouseRadius={0.4}
      colorNum={12}
      waveAmplitude={0.3}
      waveFrequency={2.4}
      waveSpeed={0.02}
    />
  );
}

export default DitherBackground;