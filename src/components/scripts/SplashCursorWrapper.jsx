// src/components/scripts/SplashCursorWrapper.jsx
'use client';
import React, { useState, useEffect } from 'react';
import SplashCursor from './SplashCursor.jsx'; // Asigură-te că calea este corectă

const SplashCursorWrapper = () => {
  const [isEnabled, setIsEnabled] = useState(() => {
    // Citim starea inițială din localStorage când componenta se montează
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cursorSplashEnabled');
      // Efectul este OPRIT implicit la prima vizită
      return stored ? JSON.parse(stored) : false;
    }
    return false; // Default pentru SSR
  });

  useEffect(() => {
    // Listener pentru evenimentul de toggle de la SplashToggleButton
    const handleToggle = (event) => {
      setIsEnabled(event.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cursorSplashToggle', handleToggle);
    }

    // Curățare la demontarea componentei
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cursorSplashToggle', handleToggle);
      }
    };
  }, []); // Dependențe goale, se rulează doar la montare/demontare

  if (!isEnabled) {
    return null; // Nu randa SplashCursor dacă este dezactivat
  }

  return (
    <div
      className="splash"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Asigură-te că nu blochează interacțiunile cu pagina
        zIndex: 50, // Poți ajusta zIndex-ul dacă este necesar
      }}
    >
      <SplashCursor /> {/* Randa SplashCursor doar dacă este activat */}
    </div>
  );
};

export default SplashCursorWrapper;