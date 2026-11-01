import { GameEngine } from './game/GameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const uiRoot = document.getElementById('ui-root') as HTMLElement;

  if (!canvas || !uiRoot) {
    console.error('Failed to find #game-canvas or #ui-root');
    return;
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();

  const engine = new GameEngine(canvas, uiRoot);

  window.addEventListener('resize', () => {
    resizeCanvas();
    engine.handleResize(window.innerWidth, window.innerHeight);
  });

  engine.start();
  console.log('🎮 It Takes Two (3D Split-Screen Clean-Room Edition) initialized successfully.');
});
