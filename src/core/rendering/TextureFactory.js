import * as THREE from 'three';
export class TextureFactory {
    /**
     * Generates a procedural wood grain texture for workshop beams and cogs
     */
    static createWoodTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        // Base warm wood color
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(0, 0, 512, 512);
        // Wood rings and grain lines
        ctx.lineWidth = 1.5;
        for (let y = 0; y < 512; y += 4) {
            const alpha = 0.15 + 0.15 * Math.sin(y * 0.08);
            ctx.strokeStyle = `rgba(35, 18, 8, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x < 512; x += 32) {
                ctx.lineTo(x, y + Math.sin(x * 0.03 + y * 0.05) * 3);
            }
            ctx.stroke();
        }
        // Wood knots
        for (let i = 0; i < 6; i++) {
            const kx = 60 + i * 80;
            const ky = 100 + (i % 3) * 120;
            ctx.strokeStyle = 'rgba(25, 10, 4, 0.4)';
            ctx.beginPath();
            ctx.ellipse(kx, ky, 18, 32, 0.2, 0, Math.PI * 2);
            ctx.stroke();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }
    /**
     * Generates a brushed brass/bronze metallic texture for cogs and clockwork
     */
    static createBrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#b38728';
        ctx.fillRect(0, 0, 512, 512);
        // Brushed metal streaks
        for (let i = 0; i < 1200; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const len = 30 + Math.random() * 60;
            const bright = Math.random() > 0.5;
            ctx.strokeStyle = bright ? 'rgba(255, 230, 140, 0.25)' : 'rgba(80, 50, 10, 0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + len, y);
            ctx.stroke();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }
    /**
     * Generates a woven yarn/fabric bump texture for May's hair and clothes
     */
    static createYarnTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2255bb';
        ctx.fillRect(0, 0, 256, 256);
        for (let y = 0; y < 256; y += 6) {
            for (let x = 0; x < 256; x += 6) {
                ctx.fillStyle = (x + y) % 12 === 0 ? '#3377dd' : '#1a4499';
                ctx.fillRect(x, y, 5, 5);
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 4);
        return tex;
    }
    /**
     * Generates an organic clay normal texture for Cody
     */
    static createClayTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#3a8a30';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 400; i++) {
            const cx = Math.random() * 256;
            const cy = Math.random() * 256;
            const r = 2 + Math.random() * 4;
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(80, 160, 60, 0.3)' : 'rgba(20, 60, 20, 0.3)';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }
}
