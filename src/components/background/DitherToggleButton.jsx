// src/components/scripts/DitherToggleButton.jsx
'use client'; // Important pentru React Hooks în Astro


const DitherToggleButton = () => {
  // Starea butonului: true = animația este activată (Play), false = animația este dezactivată (Pause)
  const [isEnabled, setIsEnabled] = useState(() => {
    // Citim starea inițială din localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ditherAnimationEnabled');
      return stored ? JSON.parse(stored) : true; // Implicit: animația este activată (Play)
    }
    return true; // Default pentru SSR: animația este activată
  });

  // State to manage the SVG's drop shadow
  // Initial subtle shadow
  const [svgShadow, setSvgShadow] = useState('drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.5))'); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ditherAnimationEnabled', JSON.stringify(isEnabled));
      window.dispatchEvent(new CustomEvent('ditherAnimationToggle', { detail: isEnabled }));
    }
  }, [isEnabled]); // Se declanșează ori de câte ori isEnabled se schimbă

  // Funcția care inversează starea la click
  const toggleAnimation = () => {
    setIsEnabled(prev => !prev);

  };

  // Obiect de stil comun pentru ambele SVG-uri, inclusiv tranziția pentru umbră
  const svgBaseStyle = {
    transition: 'filter 0.3s ease-in-out', // Tranziție lină pentru umbră
    filter: svgShadow // Aplică umbra dinamică
  };

  // SVG pentru pictograma PAUSE
  const PauseIcon = (
    <svg width="24" height="24" viewBox="0 0 45.812 45.812" fill="currentColor" style={svgBaseStyle}>
      <g>
        <g>
          <path d="M39.104,6.708c-8.946-8.943-23.449-8.946-32.395,0c-8.946,8.944-8.946,23.447,0,32.394
            c8.946,8.946,23.449,8.946,32.395,0C48.05,30.155,48.05,15.652,39.104,6.708z M21.782,31.704c0,1.459-1.183,2.64-2.64,2.64
            s-2.64-1.181-2.64-2.64V14.108c0-1.457,1.183-2.64,2.64-2.64s2.64,1.183,2.64,2.64V31.704z M31.704,31.704
            c0,1.459-1.183,2.64-2.64,2.64s-2.64-1.181-2.64-2.64V14.108c0-1.457,1.183-2.64,2.64-2.64s2.64,1.183,2.64,2.64V31.704z"/>
        </g>
      </g>
    </svg>
  );

  // SVG pentru pictograma PLAY
  const PlayIcon = (
    <svg width="24" height="24" viewBox="0 0 330 330" fill="currentColor" style={svgBaseStyle}>
      <path d="M37.728,328.12c2.266,1.256,4.77,1.88,7.272,1.88c2.763,0,5.522-0.763,7.95-2.28l240-149.999
        c4.386-2.741,7.05-7.548,7.05-12.72c0-5.172-2.664-9.979-7.05-12.72L52.95,2.28c-4.625-2.891-10.453-3.043-15.222-0.4
        C32.959,4.524,30,9.547,30,15v300C30,320.453,32.959,325.476,37.728,328.12z"/>
    </svg>
  );

  return (
    <button
      onClick={toggleAnimation}
      className="dither-toggle-button" // Clasa pentru stilizare globală și media queries
      style={{
        position: 'fixed',
        top: '5px',
        right: '5px',
        zIndex: '9998',
        width: '45px', // Păstrăm lățimea pentru zona de click și centrarea SVG-ului
        height: '45px', // Păstrăm înălțimea pentru zona de click și centrarea SVG-ului
        border: 'none', // Fără margine vizibilă
        background: 'transparent', // Fundal complet transparent
        color: 'white', // Asigură că SVG-ul cu "currentColor" va fi alb
        display: 'flex', // Folosim flexbox pentru a centra SVG-ul
        justifyContent: 'center', // Centrează orizontal SVG-ul
        alignItems: 'center', // Centrează vertical SVG-ul
        cursor: 'pointer',
        boxShadow: 'none', // Elimină complet box-shadow de pe buton
        transition: 'transform 0.3s ease-in-out', // Tranziții line doar pentru transform (scalare)
        outline: 'none', // Elimină conturul de focus la click
      }}
      title={isEnabled ? "🛑" : "▶️"}
      // Efectele de hover rămân pentru a modifica transformarea butonului și umbra SVG-ului
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        setSvgShadow('drop-shadow(0px 6px 15px rgba(0, 0, 0, 0.8))'); // Umbră mai pronunțată pe SVG
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        setSvgShadow('drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.5))'); // Umbră subtilă înapoi pe SVG
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
    >
      {isEnabled ? PauseIcon : PlayIcon} {/* Afișează pictograma Pause când e activat, Play când e dezactivat */}
    </button>
  );
};

export default DitherToggleButton;