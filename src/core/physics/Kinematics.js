export class Kinematics {
    static DT = 1 / 120; // 120Hz deterministic step
    static GRAVITY = 1450;
    static TERMINAL_VEL = 1200;
    static integrate(pos, vel, acc, dt, drag = 0.985) {
        vel.x = (vel.x + acc.x * dt) * drag;
        vel.y = (vel.y + acc.y * dt);
        const speed = Math.hypot(vel.x, vel.y);
        if (speed > this.TERMINAL_VEL) {
            const scale = this.TERMINAL_VEL / speed;
            vel.x *= scale;
            vel.y *= scale;
        }
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
    }
    static checkAABB(ax, ay, aw, ah, bx, by, bw, bh) {
        return (ax < bx + bw &&
            ax + aw > bx &&
            ay < by + bh &&
            ay + ah > by);
    }
    /**
     * Resolves AABB entity against static solid collider
     */
    static resolveBoxCollision(pos, vel, w, h, box) {
        if (!this.checkAABB(pos.x, pos.y, w, h, box.x, box.y, box.w, box.h)) {
            return { collided: false, normalX: 0, normalY: 0 };
        }
        const overlapLeft = (pos.x + w) - box.x;
        const overlapRight = (box.x + box.w) - pos.x;
        const overlapTop = (pos.y + h) - box.y;
        const overlapBottom = (box.y + box.h) - pos.y;
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);
        if (minOverlapX < minOverlapY) {
            if (overlapLeft < overlapRight) {
                pos.x -= overlapLeft;
                vel.x = Math.min(0, vel.x);
                return { collided: true, normalX: -1, normalY: 0 };
            }
            else {
                pos.x += overlapRight;
                vel.x = Math.max(0, vel.x);
                return { collided: true, normalX: 1, normalY: 0 };
            }
        }
        else {
            if (overlapTop < overlapBottom) {
                pos.y -= overlapTop;
                vel.y = Math.min(0, vel.y);
                return { collided: true, normalX: 0, normalY: -1 };
            }
            else {
                pos.y += overlapBottom;
                vel.y = Math.max(0, vel.y);
                return { collided: true, normalX: 0, normalY: 1 };
            }
        }
    }
    /**
     * 2D Spring-Damper Camera Solver: ddx = -k * (x - target) - c * dx
     */
    static stepSpringDamper(curr, target, vel, k = 120, c = 22, dt = 1 / 120) {
        const accel = -k * (curr - target) - c * vel;
        const nextVel = vel + accel * dt;
        const nextVal = curr + nextVel * dt;
        return { value: nextVal, vel: nextVel };
    }
}
