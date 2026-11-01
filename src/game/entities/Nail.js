import { Kinematics } from '../../core/physics/Kinematics.js';
export class Nail {
    pos;
    vel;
    isEmbedded = false;
    embedSurface = null;
    angle = 0;
    id;
    trail = [];
    isRecalling = false;
    constructor(id, startX, startY, vx, vy) {
        this.id = id;
        this.pos = { x: startX, y: startY };
        this.vel = { x: vx, y: vy };
        this.angle = Math.atan2(vy, vx);
    }
    update(dt, colliders, codyPos) {
        if (this.isRecalling) {
            // Fly back magnetically to Cody
            const dx = (codyPos.x + 16) - this.pos.x;
            const dy = (codyPos.y + 20) - this.pos.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 28) {
                return false; // Collected
            }
            const speed = 1200;
            this.vel.x = (dx / dist) * speed;
            this.vel.y = (dy / dist) * speed;
            this.pos.x += this.vel.x * dt;
            this.pos.y += this.vel.y * dt;
            this.angle = Math.atan2(this.vel.y, this.vel.x);
            return true;
        }
        if (this.isEmbedded) {
            // Anchored in place
            return true;
        }
        // In flight
        this.trail.push({ x: this.pos.x, y: this.pos.y });
        if (this.trail.length > 8)
            this.trail.shift();
        this.vel.y += 450 * dt; // Slight gravity for parabolic arc
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;
        this.angle = Math.atan2(this.vel.y, this.vel.x);
        // Check collision with surfaces
        for (const box of colliders) {
            if (Kinematics.checkAABB(this.pos.x - 4, this.pos.y - 4, 8, 8, box.x, box.y, box.w, box.h)) {
                if (box.isWood) {
                    // Embed securely!
                    this.isEmbedded = true;
                    this.embedSurface = box;
                    this.vel.x = 0;
                    this.vel.y = 0;
                    return true;
                }
                else {
                    // Ricochet off metal/stone
                    this.vel.x *= -0.5;
                    this.vel.y = -Math.abs(this.vel.y) * 0.5;
                }
            }
        }
        return true;
    }
    recall() {
        this.isEmbedded = false;
        this.isRecalling = true;
    }
}
