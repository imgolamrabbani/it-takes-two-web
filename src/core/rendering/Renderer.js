import { Kinematics } from '../physics/Kinematics.js';
export class Renderer {
    canvas;
    ctx;
    // Spring-damper Camera
    camX = 640;
    camY = 360;
    camVelX = 0;
    camVelY = 0;
    camZoom = 1.0;
    // Screen shake
    trauma = 0;
    hitStopFrames = 0;
    constructor(canvas) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context)
            throw new Error('Could not get CanvasRenderingContext2D');
        this.ctx = context;
    }
    addTrauma(amount) {
        this.trauma = Math.min(1.0, this.trauma + amount);
    }
    render(state, dt) {
        if (this.hitStopFrames > 0) {
            this.hitStopFrames--;
            return; // Freeze-frame for punchy hit-stop
        }
        const { ctx } = this;
        const w = this.canvas.width;
        const h = this.canvas.height;
        // Camera follow midpoint of Cody and May
        const midX = (state.cody.pos.x + state.may.pos.x) / 2 + 14;
        const midY = (state.cody.pos.y + state.may.pos.y) / 2 + 20;
        const resX = Kinematics.stepSpringDamper(this.camX, midX, this.camVelX, 100, 20, dt);
        const resY = Kinematics.stepSpringDamper(this.camY, midY, this.camVelY, 100, 20, dt);
        this.camX = resX.value;
        this.camVelX = resX.vel;
        this.camY = resY.value;
        this.camVelY = resY.vel;
        // Screen shake decay (trauma^2)
        let shakeX = 0;
        let shakeY = 0;
        let shakeAngle = 0;
        if (this.trauma > 0) {
            const shakeMag = this.trauma * this.trauma * 24;
            shakeX = (Math.random() - 0.5) * shakeMag;
            shakeY = (Math.random() - 0.5) * shakeMag;
            shakeAngle = (Math.random() - 0.5) * this.trauma * 0.08;
            this.trauma = Math.max(0, this.trauma - 1.8 * dt);
        }
        ctx.save();
        ctx.clearRect(0, 0, w, h);
        // Apply Camera transform with Shake
        ctx.translate(w / 2 + shakeX, h / 2 + shakeY);
        ctx.rotate(shakeAngle);
        ctx.scale(this.camZoom, this.camZoom);
        ctx.translate(-this.camX, -this.camY);
        // 1. Background Grid & Workshop Ambience
        this.drawBackground(ctx);
        // 2. Draw Level Terrain, Platforms, and Hazards
        this.drawLevel(ctx, state.level);
        // 3. Draw Nails and Swing Line
        this.drawNails(ctx, state.nails, state.may);
        // 4. Draw Particles
        this.drawParticles(ctx, state.particles);
        // 5. Draw Cody & May
        this.drawPlayer(ctx, state.cody, '#2ec4b6', '#38b000', 'Cody');
        this.drawPlayer(ctx, state.may, '#3a86ff', '#ff006e', 'May');
        // 6. Draw Boss if active
        if (state.level.boss) {
            this.drawBoss(ctx, state.level.boss);
        }
        ctx.restore();
        // 7. Render Screen Overlay HUD & Debug Information
        this.drawHUD(ctx, state);
    }
    drawBackground(ctx) {
        ctx.fillStyle = '#080a10';
        ctx.fillRect(-500, -500, 2500, 2000);
        // Wooden workshop planks & grid lines
        ctx.strokeStyle = '#141a29';
        ctx.lineWidth = 2;
        for (let x = -400; x < 2000; x += 120) {
            ctx.beginPath();
            ctx.moveTo(x, -400);
            ctx.lineTo(x, 1800);
            ctx.stroke();
        }
        for (let y = -400; y < 1800; y += 100) {
            ctx.beginPath();
            ctx.moveTo(-400, y);
            ctx.lineTo(2000, y);
            ctx.stroke();
        }
    }
    drawLevel(ctx, level) {
        for (const box of level.colliders) {
            if (box.isHazard) {
                // Red hazard spikes
                ctx.fillStyle = '#ff0054';
                ctx.fillRect(box.x, box.y, box.w, box.h);
                for (let sx = box.x; sx < box.x + box.w; sx += 20) {
                    ctx.beginPath();
                    ctx.moveTo(sx, box.y + box.h);
                    ctx.lineTo(sx + 10, box.y - 12);
                    ctx.lineTo(sx + 20, box.y + box.h);
                    ctx.fillStyle = '#ff2a85';
                    ctx.fill();
                }
                continue;
            }
            if (box.isWood) {
                // Wooden Target beam where Cody can embed nails!
                ctx.fillStyle = '#a06020';
                ctx.fillRect(box.x, box.y, box.w, box.h);
                ctx.strokeStyle = '#ffb703';
                ctx.lineWidth = 3;
                ctx.strokeRect(box.x, box.y, box.w, box.h);
                // Target bullseye circle
                ctx.beginPath();
                ctx.arc(box.x + box.w / 2, box.y + box.h / 2, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#fee440';
                ctx.fill();
                continue;
            }
            if (box.tag) {
                // Pneumatic door
                if (box.isSolid) {
                    ctx.fillStyle = '#3a0ca3';
                    ctx.fillRect(box.x, box.y, box.w, box.h);
                    ctx.strokeStyle = '#4cc9f0';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(box.x, box.y, box.w, box.h);
                }
                else {
                    // Open door ghost outline
                    ctx.strokeStyle = 'rgba(76, 201, 240, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(box.x, box.y, box.w, box.h);
                }
                continue;
            }
            // Standard solid industrial floor/wall
            ctx.fillStyle = '#1b2234';
            ctx.fillRect(box.x, box.y, box.w, box.h);
            ctx.strokeStyle = '#2b3650';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.w, box.h);
        }
        // Moving Platforms
        for (const plat of level.movingPlatforms) {
            ctx.fillStyle = '#ffb703';
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            ctx.strokeStyle = '#fb8500';
            ctx.lineWidth = 2;
            ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
        }
        // Switches
        for (const sw of level.switches) {
            if (sw.type === 'plate') {
                ctx.fillStyle = sw.isActivated ? '#00f5d4' : '#555b6e';
                ctx.fillRect(sw.x, sw.y + (sw.isActivated ? 6 : 0), sw.w, sw.h - (sw.isActivated ? 6 : 0));
            }
            else {
                // Red spring button for May's hammer
                ctx.fillStyle = sw.isActivated ? '#ff0054' : '#d90429';
                ctx.fillRect(sw.x, sw.y, sw.w, sw.h);
                ctx.strokeStyle = '#fee440';
                ctx.lineWidth = 2;
                ctx.strokeRect(sw.x, sw.y, sw.w, sw.h);
            }
        }
        // Exit Gate
        const eg = level.exitGate;
        ctx.strokeStyle = (eg.codyIn && eg.mayIn) ? '#00f5d4' : '#7b2cbf';
        ctx.lineWidth = 4;
        ctx.strokeRect(eg.x, eg.y, eg.w, eg.h);
        ctx.fillStyle = (eg.codyIn && eg.mayIn) ? 'rgba(0, 245, 212, 0.25)' : 'rgba(123, 44, 191, 0.15)';
        ctx.fillRect(eg.x, eg.y, eg.w, eg.h);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('EXIT GATE', eg.x + 4, eg.y - 8);
    }
    drawNails(ctx, nails, may) {
        for (const nail of nails) {
            // Glow trail
            if (nail.trail.length > 1) {
                ctx.strokeStyle = 'rgba(0, 245, 212, 0.5)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(nail.trail[0].x, nail.trail[0].y);
                for (let i = 1; i < nail.trail.length; i++) {
                    ctx.lineTo(nail.trail[i].x, nail.trail[i].y);
                }
                ctx.stroke();
            }
            ctx.save();
            ctx.translate(nail.pos.x, nail.pos.y);
            ctx.rotate(nail.angle);
            // Steel nail body
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(-12, -3, 24, 6);
            // Metallic tip
            ctx.beginPath();
            ctx.moveTo(12, -3);
            ctx.lineTo(18, 0);
            ctx.lineTo(12, 3);
            ctx.fillStyle = '#00f5d4';
            ctx.fill();
            ctx.restore();
        }
        // If May is swinging on a nail, draw the taut cord/rope!
        if (may.isSwinging && may.swingNail) {
            ctx.strokeStyle = '#fee440';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(may.swingNail.pos.x, may.swingNail.pos.y);
            ctx.lineTo(may.pos.x + may.w / 2, may.pos.y + 10);
            ctx.stroke();
            // Hook pivot spark ring
            ctx.strokeStyle = '#00f5d4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(may.swingNail.pos.x, may.swingNail.pos.y, 6, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    drawParticles(ctx, particles) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= 0.016;
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            const alpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            ctx.globalAlpha = 1.0;
        }
    }
    drawPlayer(ctx, p, primaryColor, accentColor, label) {
        ctx.save();
        if (p.isBubbleRespawning) {
            // Protective glowing respawn bubble
            ctx.beginPath();
            ctx.arc(p.pos.x + p.w / 2, p.pos.y + p.h / 2, 32, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(76, 201, 240, 0.4)';
            ctx.fill();
            ctx.strokeStyle = '#4cc9f0';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.translate(p.pos.x + p.w / 2, p.pos.y + p.h);
        ctx.scale(p.stretchX * p.facing, p.squashY);
        // Torso / Body
        ctx.fillStyle = p.hitFlashTimer > 0 ? '#ffffff' : primaryColor;
        ctx.fillRect(-p.w / 2, -p.h, p.w, p.h);
        // Head Accent
        ctx.fillStyle = accentColor;
        ctx.fillRect(-p.w / 2 + 4, -p.h - 10, p.w - 8, 12);
        // Eye visor
        ctx.fillStyle = '#070913';
        ctx.fillRect(p.w / 2 - 10, -p.h + 6, 6, 6);
        // Character specific props:
        if (p.type === 'may') {
            // Hammer
            ctx.fillStyle = '#e09f3e';
            ctx.fillRect(p.isHammerSwinging ? 8 : -4, -p.h + 16, 20, 6); // Handle
            ctx.fillStyle = '#48cae4';
            ctx.fillRect(p.isHammerSwinging ? 22 : 12, -p.h + 8, 14, 22); // Heavy Forged Hammerhead
        }
        else {
            // Cody's Nail quiver
            ctx.fillStyle = '#ffb703';
            ctx.fillRect(-p.w / 2 - 4, -p.h + 10, 6, 16);
        }
        ctx.restore();
        // Name Tag
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, p.pos.x + p.w / 2, p.pos.y - 14);
    }
    drawBoss(ctx, boss) {
        ctx.save();
        // Boss Main Body
        ctx.fillStyle = boss.isHitFlashing > 0 ? '#ffffff' : '#8b4513'; // Heavy timber box
        ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
        ctx.strokeStyle = '#d4af37'; // Brass corner plates
        ctx.lineWidth = 6;
        ctx.strokeRect(boss.x, boss.y, boss.w, boss.h);
        // Glowing Menacing Eyes
        ctx.fillStyle = '#ff0054';
        ctx.fillRect(boss.x + 40, boss.y + 60, 36, 18);
        ctx.fillRect(boss.x + 160, boss.y + 60, 36, 18);
        // Articulated Arm & Slamming Fist
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(boss.armX, boss.armY, 180, 50);
        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 4;
        ctx.strokeRect(boss.armX, boss.armY, 180, 50);
        // Glowing Power Module on Arm (May's Hammer Target!)
        ctx.fillStyle = '#00f5d4';
        ctx.beginPath();
        ctx.arc(boss.armX + 90, boss.armY + 25, 16, 0, Math.PI * 2);
        ctx.fill();
        // Nail Sweep Hazard
        if (boss.hp < 70) {
            ctx.fillStyle = '#ff0054';
            ctx.fillRect(boss.sweepNailX, 580, 50, 16);
        }
        ctx.restore();
        // Boss Health Bar
        const barW = 320;
        const barH = 14;
        const barX = boss.x - 30;
        const barY = boss.y - 30;
        ctx.fillStyle = '#11162b';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#ff2a85';
        ctx.fillRect(barX, barY, (boss.hp / boss.maxHp) * barW, barH);
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('THE DERANGED TOOLBOX', barX + 70, barY - 6);
    }
    drawHUD(ctx, state) {
        // Top Left: Cody & May Status
        ctx.fillStyle = 'rgba(7, 9, 19, 0.85)';
        ctx.fillRect(16, 16, 280, 68);
        ctx.strokeStyle = '#2b3650';
        ctx.lineWidth = 1;
        ctx.strokeRect(16, 16, 280, 68);
        ctx.fillStyle = '#2ec4b6';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`CODY: ${state.cody.nailsAvailable} / ${state.cody.maxNails} Nails [F: Throw | R: Recall]`, 26, 40);
        ctx.fillStyle = '#3a86ff';
        ctx.fillText(`MAY: Hammer & Swing Ready [L: Swing | Down: Slam]`, 26, 64);
        // Stage Name Center
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(state.level.name, this.canvas.width / 2, 34);
        // Debug Overlay (toggleable with ` or F3)
        if (state.showDebug) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
            ctx.fillRect(this.canvas.width - 340, 16, 324, 210);
            ctx.strokeStyle = '#00f5d4';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(this.canvas.width - 340, 16, 324, 210);
            ctx.fillStyle = '#00f5d4';
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            const rightX = this.canvas.width - 328;
            ctx.fillText(`--- ENGINE DEBUG OVERLAY (\` / F3) ---`, rightX, 38);
            ctx.fillText(`FPS: ${state.fps.toFixed(1)} | Fixed dt: ${(Kinematics.DT * 1000).toFixed(2)}ms`, rightX, 58);
            ctx.fillText(`State: ${state.gameState}`, rightX, 78);
            ctx.fillText(`Cody: (${state.cody.pos.x.toFixed(1)}, ${state.cody.pos.y.toFixed(1)}) vx:${state.cody.vel.x.toFixed(0)} vy:${state.cody.vel.y.toFixed(0)}`, rightX, 98);
            ctx.fillText(`May:  (${state.may.pos.x.toFixed(1)}, ${state.may.pos.y.toFixed(1)}) vx:${state.may.vel.x.toFixed(0)} vy:${state.may.vel.y.toFixed(0)}`, rightX, 118);
            ctx.fillText(`May Swinging: ${state.may.isSwinging} | GroundPound: ${state.may.isGroundPounding}`, rightX, 138);
            ctx.fillText(`Active Nails: ${state.nails.length} | Particles: ${state.particles.length}`, rightX, 158);
            ctx.fillText(`Cam: (${this.camX.toFixed(1)}, ${this.camY.toFixed(1)}) trauma: ${this.trauma.toFixed(2)}`, rightX, 178);
            ctx.fillText(`COOP/COEP Headers: Active | WASM Ready`, rightX, 198);
        }
    }
}
