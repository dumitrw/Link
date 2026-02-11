class BlackjackGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(`canvas-${canvasId}`);
    this.container = this.canvas.parentElement;
    this.iframeUrl = "https://zv1y2i8p.play.gamezop.com/g/H13-Z8sQILx";
  }

  start() {
    // În loc să desenăm pe canvas, îl ascundem și injectăm iframe-ul
    this.canvas.style.display = 'none';
    
    const iframe = document.createElement('iframe');
    iframe.src = this.iframeUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '16px';
    iframe.id = "game-iframe";
    
    // Adăugăm iframe-ul în containerul tău de sticlă
    this.container.appendChild(iframe);
    
    // Scorul rămâne 0000 sau poți pune un mesaj
    document.getElementById('game-score').innerText = "LIVE";
  }

  reset() {
    // Dacă utilizatorul apasă butonul tău de restart 🔄
    const oldIframe = document.getElementById('game-iframe');
    if (oldIframe) {
      oldIframe.src = this.iframeUrl; // Reîncărcăm iframe-ul
    }
  }
}

// Mapăm clasa pentru ca init() din layout-ul tău să o găsească
window.BlackjackGame = BlackjackGame;