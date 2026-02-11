// src/components/scripts/GamesButton.jsx
export default function GamesButton() {
  return (
    <>
      <button
        className="games-btn"
        onClick={() => (window.location.href = '/games/')}
        title="Jocuri Secrete 🎮"
      >
        🎮
      </button>
      <style jsx>{`
  .games-btn {
    opacity: 0%;
    position: fixed !important;
    bottom: 50px !important;
    right: 15px !important;
    z-index: 9999 !important;
    width: 31px !important;
    height: 31px !important;
    border: none !important;
    border-radius: 50% !important;
    color: white !important;
    font-size: 15px !important;
    font-weight: bold !important;
    cursor: pointer !important;
    /* Gradient STATIC smooth */
    background: linear-gradient(135deg, #ff6b6b 0%, #4e5bcd 50%, #45b7a7 100%) !important;
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4) !important;
    /* Border UNIC cu glow */
    border: 3px solid rgba(255, 255, 255, 0.562) !important;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    line-height: 1 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
  }

  .games-btn:hover {
    transform: scale(1.15) !important; /* Fără rotate pe buton mic */
    box-shadow: 
      0 8px 25px rgba(255, 107, 107, 0.7),
      0 0 15px rgba(255,255,255,0.6) !important; /* Glow subtil */
    border-color: rgba(255,255,255,1) !important;
  }

  .games-btn:active {
    transform: scale(0.92) !important;
  }

  @media (max-width: 768px) {
    .games-btn { 
      bottom: 50px !important; 
      right: 15px !important; 
      width: 31px !important; 
      height: 31px !important; 
      font-size: 16px !important; 
      line-height: 1 !important;
      display: flex !important;     
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      box-shadow: 0 3px 10px rgba(255, 107, 107, 0.4) !important; /* Mai mic pe mobil */
    }
    .games-btn:hover {
      box-shadow: 
        0 6px 20px rgba(255, 107, 107, 0.7),
        0 0 12px rgba(255,255,255,0.6) !important;
    }
  }
`}</style>

    </>
  );
}
