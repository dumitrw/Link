// src/components/scripts/SplashToggleButton.jsx
'use client'; // Necesare pentru Hooks și interacțiunea cu DOM-ul browserului
import{ useState, useEffect } from 'react';

const SplashToggleButton = () => {
  const [isEnabled, setIsEnabled] = useState(() => {
    // Încărcăm starea inițială din localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cursorSplashEnabled');
      // implicit, splash-ul este dezactivat dacă nu există o valoare salvată (conform cerinței tale anterioare)
      return stored ? JSON.parse(stored) : false;
    }
    return false; // Default pentru SSR
  });

  // Efect secundar pentru a salva starea în localStorage și a trimite evenimentul
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cursorSplashEnabled', JSON.stringify(isEnabled));
      // Dispatchează un eveniment custom pentru a notifica alte componente (ex: SplashCursorWrapper)
      window.dispatchEvent(new CustomEvent('cursorSplashToggle', { detail: isEnabled }));
    }
  }, [isEnabled]); // Se declanșează ori de câte ori isEnabled se schimbă

  // Funcție pentru a gestiona intrarea/ieșirea din modul fullscreen
  const toggleFullscreen = (enable) => {
    if (typeof document === 'undefined') return; // Asigură-te că rulează doar în browser

    const element = document.documentElement; // Vrem ca întreaga pagină să intre în fullscreen

    if (enable) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) { /* Firefox */
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) { /* IE/Edge */
        element.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
        element.webkitExitFullscreen(); // This should be document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
      }
    }
  };

  // Funcția principală apelată la click pe buton
  const toggleSplash = () => {
    // Determină noua stare a splash-ului *înainte* de a o seta
    const newState = !isEnabled;

    // Apoi apelează funcția de fullscreen cu noua stare.
    // Aceasta este esențial pentru a satisface cerința browserului ("Document not active").
    toggleFullscreen(newState);

    // În cele din urmă, actualizează starea React a butonului.
    setIsEnabled(newState);

    console.log('SplashToggleButton clicked. Splash Enabled:', newState);
  };

  return (
    <button
      onClick={toggleSplash}
      className="splash-easter-egg-button" // Păstrăm clasa pentru stilizarea globală
      style={{
        position: 'fixed',
        bottom: '15px',
        right: '15px',
        zIndex: '9999',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        border: '3px solid rgba(255, 255, 255, 0.6)',
        background: 'rgba(100, 149, 255, 1)', // Păstrăm culoarea de fundal existentă
        color: 'white', // Fără text vizibil în exemplul tău, dar util pentru iconițe
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
        opacity: '1',
        transition: 'all 0.3s ease-in-out',
        outline: 'none',
        // onMouseDown și onMouseUp sunt adăugate pentru un feedback tactil subtil
      }}
      title={isEnabled ? "nu mai vreau curcubeu!" : "APASA!"} // Păstrăm titlul existent
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
      }}
      onMouseDown={(e) => { // Adăugat pentru efect de apăsare
        e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => { // Adăugat pentru efect de eliberare
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
    >
       {isEnabled ? "𓍊𓋼" : "🍄"}
    </button>
  );
};

export default SplashToggleButton;