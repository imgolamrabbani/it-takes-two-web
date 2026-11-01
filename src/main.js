import { GameEngine } from './game/GameEngine.js';
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const uiRoot = document.getElementById('ui-root');
    if (!canvas || !uiRoot) {
        console.error('Failed to find #game-canvas or #ui-root');
        return;
    }
    // Adjust canvas size for sharp rendering
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const targetWidth = 1280;
        const targetHeight = 720;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const engine = new GameEngine(canvas, uiRoot);
    engine.start();
    console.log('🎮 It Takes Two (Clean-Room Reconstruction) initialized successfully.');
});
