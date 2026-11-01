import { Kinematics, RectCollider, Vec2 } from '../../core/physics/Kinematics.js';
import { PlayerInputState } from '../../core/input/InputManager.js';
import { SynthEngine } from '../../core/audio/SynthEngine.js';
import { Nail } from './Nail.js';

export type CharacterType = 'cody' | 'may';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export class Player {
  public type: CharacterType;
  public pos: Vec2;
  public vel: Vec2 = { x: 0, y: 0 };
  public acc: Vec2 = { x: 0, y: 0 };
  public w = 28;
  public h = 46;

  public facing: 1 | -1 = 1;
  public isGrounded = false;
  public isWallSliding = false;
  public wallSide: -1 | 1 = 0 as -1 | 1;

  public coyoteFrames = 0;
  public jumpBufferFrames = 0;
  public canDoubleJump = true;

  // Cody specific
  public nailsAvailable = 3;
  public maxNails = 3;

  // May specific
  public isHammerSwinging = false;
  public hammerSwingTimer = 0;
  public isGroundPounding = false;
  public groundPoundStallTimer = 0;

  // Swinging on Nail hook
  public isSwinging = false;
  public swingNail: Nail | null = null;
  public swingAngle = 0;
  public swingAngularVel = 0;
  public swingRadius = 75;

  // Juice & Animation
  public squashY = 1.0;
  public stretchX = 1.0;
  public hitFlashTimer = 0;
  public isInvulnerable = false;
  public isBubbleRespawning = false;
  public bubbleRespawnTimer = 0;
  public respawnTarget: Vec2 = { x: 0, y: 0 };

  constructor(type: CharacterType, startX: number, startY: number) {
    this.type = type;
    this.pos = { x: startX, y: startY };
    this.respawnTarget = { x: startX, y: startY };
  }

  public update(
    dt: number,
    input: PlayerInputState,
    colliders: RectCollider[],
    nails: Nail[],
    audio: SynthEngine,
    particles: Particle[],
    triggerScreenshake: (trauma: number) => void
  ): { spawnedNail?: Nail; recallNails?: boolean; hammerHitbox?: { x: number; y: number; w: number; h: number } } {
    if (this.isBubbleRespawning) {
      this.bubbleRespawnTimer -= dt;
      // Float towards target
      this.pos.x += (this.respawnTarget.x - this.pos.x) * 4 * dt;
      this.pos.y += (this.respawnTarget.y - this.pos.y) * 4 * dt;

      if (this.bubbleRespawnTimer <= 0) {
        this.isBubbleRespawning = false;
        this.vel = { x: 0, y: 0 };
        audio.sfxRespawn();
      }
      return {};
    }

    // Animation easing back to 1.0
    this.squashY += (1.0 - this.squashY) * 12 * dt;
    this.stretchX += (1.0 - this.stretchX) * 12 * dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // --- CODY MECHANIC: Throw & Recall Nails ---
    let spawnedNail: Nail | undefined;
    let recallNails = false;

    if (this.type === 'cody') {
      if (input.action1Pressed && this.nailsAvailable > 0) {
        this.nailsAvailable--;
        const shootUp = input.moveY < -0.4;
        const vx = shootUp ? this.facing * 350 : this.facing * 850;
        const vy = shootUp ? -800 : -140;

        spawnedNail = new Nail(Date.now() + Math.random(), this.pos.x + (this.facing > 0 ? this.w + 4 : -4), this.pos.y + 16, vx, vy);
        audio.sfxNailThrow();
        triggerScreenshake(0.15);
      }

      if (input.action2Pressed) {
        recallNails = true;
        audio.sfxNailRecall();
      }
    }

    // --- MAY MECHANIC: Swinging on Nails ---
    if (this.type === 'may') {
      if (this.isSwinging && this.swingNail) {
        // May is locked onto nail pivot
        const pivotX = this.swingNail.pos.x;
        const pivotY = this.swingNail.pos.y;

        // Pendulum equation: theta'' = -(g / L) * sin(theta) - damping * theta'
        const gravity = 18;
        const angularAccel = (-gravity * Math.sin(this.swingAngle)) + input.moveX * 6.0;
        this.swingAngularVel += angularAccel * dt;
        this.swingAngularVel *= 0.995; // slight damping
        this.swingAngle += this.swingAngularVel * dt;

        this.pos.x = pivotX + Math.sin(this.swingAngle) * this.swingRadius - this.w / 2;
        this.pos.y = pivotY + Math.cos(this.swingAngle) * this.swingRadius - this.h / 2;

        // Dismount jump
        if (input.jumpPressed) {
          this.isSwinging = false;
          this.vel.x = Math.cos(this.swingAngle) * this.swingAngularVel * this.swingRadius * 1.5 + this.facing * 200;
          this.vel.y = -Math.sin(this.swingAngle) * this.swingAngularVel * this.swingRadius * 1.5 - 380;
          this.canDoubleJump = true;
          this.swingNail = null;
          audio.sfxJump();
        }

        return {};
      } else {
        // Check if May can grab onto an embedded nail
        if (input.jumpPressed || input.action1Pressed) {
          for (const nail of nails) {
            if (nail.isEmbedded) {
              const dist = Math.hypot(
                (this.pos.x + this.w / 2) - nail.pos.x,
                (this.pos.y + 10) - nail.pos.y
              );
              if (dist <= 85) {
                this.isSwinging = true;
                this.swingNail = nail;
                this.swingRadius = Math.max(50, dist);
                this.swingAngle = Math.atan2(
                  (this.pos.x + this.w / 2) - nail.pos.x,
                  (this.pos.y + this.h / 2) - nail.pos.y
                );
                this.swingAngularVel = this.vel.x / 40;
                audio.sfxSwitch();
                return {};
              }
            }
          }
        }
      }
    }

    // --- MAY MECHANIC: Ground Pound ---
    if (this.type === 'may') {
      if (input.action2Pressed && !this.isGrounded && !this.isGroundPounding) {
        this.isGroundPounding = true;
        this.groundPoundStallTimer = 0.12; // brief hang in air
        this.vel.x = 0;
        this.vel.y = 0;
        audio.sfxHammerSwing();
      }

      if (this.isGroundPounding) {
        if (this.groundPoundStallTimer > 0) {
          this.groundPoundStallTimer -= dt;
          return {};
        }
        // Slam down at terminal speed
        this.vel.y = 950;
        this.vel.x = 0;
      }
    }

    // --- MAY MECHANIC: Hammer Swing Melee ---
    let hammerHitbox: { x: number; y: number; w: number; h: number } | undefined;
    if (this.type === 'may') {
      if (input.action1Pressed && !this.isHammerSwinging && !this.isSwinging) {
        this.isHammerSwinging = true;
        this.hammerSwingTimer = 0.22;
        audio.sfxHammerSwing();
      }

      if (this.isHammerSwinging) {
        this.hammerSwingTimer -= dt;
        hammerHitbox = {
          x: this.facing > 0 ? this.pos.x + this.w : this.pos.x - 48,
          y: this.pos.y - 10,
          w: 48,
          h: 60,
        };
        if (this.hammerSwingTimer <= 0) {
          this.isHammerSwinging = false;
        }
      }
    }

    // --- Standard Movement & Kinematics ---
    if (input.moveX !== 0) {
      this.facing = input.moveX > 0 ? 1 : -1;
      const targetSpeed = input.moveX * 340;
      const accel = this.isGrounded ? 2200 : 1400;
      this.vel.x += (targetSpeed - this.vel.x) * (accel / 340) * dt;
    } else {
      const friction = this.isGrounded ? 0.82 : 0.96;
      this.vel.x *= Math.pow(friction, dt * 60);
      if (Math.abs(this.vel.x) < 5) this.vel.x = 0;
    }

    // Gravity
    this.vel.y += Kinematics.GRAVITY * dt;
    if (this.vel.y > Kinematics.TERMINAL_VEL) this.vel.y = Kinematics.TERMINAL_VEL;

    // Coyote & Buffer
    if (this.isGrounded) {
      this.coyoteFrames = 8;
      this.canDoubleJump = true;
      this.respawnTarget = { x: this.pos.x, y: this.pos.y };
    } else if (this.coyoteFrames > 0) {
      this.coyoteFrames--;
    }

    if (input.jumpPressed) {
      this.jumpBufferFrames = 10;
    } else if (this.jumpBufferFrames > 0) {
      this.jumpBufferFrames--;
    }

    // Jump Execution
    if (this.jumpBufferFrames > 0) {
      if (this.coyoteFrames > 0) {
        this.vel.y = -560;
        this.coyoteFrames = 0;
        this.jumpBufferFrames = 0;
        this.isGrounded = false;
        this.squashY = 1.35;
        this.stretchX = 0.75;
        audio.sfxJump();
      } else if (this.isWallSliding) {
        // Wall Jump
        this.vel.y = -520;
        this.vel.x = -this.wallSide * 420;
        this.facing = (-this.wallSide) as 1 | -1;
        this.jumpBufferFrames = 0;
        this.isWallSliding = false;
        audio.sfxJump();
      } else if (this.canDoubleJump) {
        this.vel.y = -500;
        this.canDoubleJump = false;
        this.jumpBufferFrames = 0;
        this.squashY = 1.25;
        audio.sfxDoubleJump();
      }
    }

    // Variable jump height cut
    if (!input.jump && this.vel.y < -220) {
      this.vel.y = -220;
    }

    // Integrate Position
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Collision against Solids
    this.isGrounded = false;
    this.isWallSliding = false;
    this.wallSide = 0 as -1 | 1;

    for (const box of colliders) {
      if (box.isHazard) {
        if (Kinematics.checkAABB(this.pos.x, this.pos.y, this.w, this.h, box.x, box.y, box.w, box.h)) {
          this.triggerRespawn();
          return {};
        }
        continue;
      }

      if (!box.isSolid) continue;

      const col = Kinematics.resolveBoxCollision(this.pos, this.vel, this.w, this.h, box);
      if (col.collided) {
        if (col.normalY === -1) {
          this.isGrounded = true;

          // If ground pounding, impact!
          if (this.isGroundPounding) {
            this.isGroundPounding = false;
            triggerScreenshake(0.45);
            audio.sfxGroundPound();
            this.squashY = 0.55;
            this.stretchX = 1.45;

            // Spawn dust particles
            for (let i = 0; i < 16; i++) {
              particles.push({
                x: this.pos.x + this.w / 2,
                y: this.pos.y + this.h,
                vx: (Math.random() - 0.5) * 450,
                vy: -Math.random() * 250,
                color: '#e09f3e',
                life: 0.35,
                maxLife: 0.35,
                size: Math.random() * 5 + 3,
              });
            }
          }
        }
        if (col.normalX !== 0 && !this.isGrounded && this.vel.y > 0) {
          this.isWallSliding = true;
          this.wallSide = col.normalX as -1 | 1;
          this.vel.y = Math.min(this.vel.y, 110); // Wall friction slide
        }
      }
    }

    // World boundary check (pit fall)
    if (this.pos.y > 1400) {
      this.triggerRespawn();
    }

    return { spawnedNail, recallNails, hammerHitbox };
  }

  public triggerRespawn(): void {
    this.isBubbleRespawning = true;
    this.bubbleRespawnTimer = 1.2;
    this.vel = { x: 0, y: 0 };
    this.isGroundPounding = false;
    this.isSwinging = false;
    this.swingNail = null;
  }
}
