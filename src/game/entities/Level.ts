import { RectCollider, Vec2 } from '../../core/physics/Kinematics.js';
import { Particle } from './Player.js';
import { SynthEngine } from '../../core/audio/SynthEngine.js';

export interface InteractiveSwitch {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'plate' | 'hammer_button';
  isActivated: boolean;
  linkedDoorId: string;
}

export interface MovingPlatform {
  x: number;
  y: number;
  w: number;
  h: number;
  originX: number;
  targetX: number;
  speed: number;
  isPinned: boolean;
  pinColliderId?: string;
}

export interface ExitGate {
  x: number;
  y: number;
  w: number;
  h: number;
  codyIn: boolean;
  mayIn: boolean;
}

export interface BossState {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  phase: number;
  armState: 'idle' | 'raising' | 'slamming' | 'pinned' | 'recovering';
  armX: number;
  armY: number;
  armTimer: number;
  sweepNailX: number;
  sweepNailDir: number;
  isHitFlashing: number;
}

export class Level {
  public stageIndex: number;
  public name: string;
  public description: string;
  public colliders: RectCollider[] = [];
  public switches: InteractiveSwitch[] = [];
  public movingPlatforms: MovingPlatform[] = [];
  public exitGate: ExitGate;
  public codyStart: Vec2;
  public mayStart: Vec2;
  public boss: BossState | null = null;

  constructor(stageIndex: number) {
    this.stageIndex = stageIndex;
    switch (stageIndex) {
      case 1:
        this.name = 'Stage 1: The Shed Awakening';
        this.description = 'Learn co-op fundamentals: Pressure Plates & May\'s Hammer Smash.';
        this.codyStart = { x: 80, y: 520 };
        this.mayStart = { x: 140, y: 520 };
        this.exitGate = { x: 1140, y: 440, w: 70, h: 90, codyIn: false, mayIn: false };
        this.buildStage1();
        break;

      case 2:
        this.name = 'Stage 2: The Nails & Hammer Traverse';
        this.description = 'Cody throws nails into wooden targets; May latches on to swing across chasms.';
        this.codyStart = { x: 80, y: 520 };
        this.mayStart = { x: 140, y: 520 };
        this.exitGate = { x: 1200, y: 320, w: 70, h: 90, codyIn: false, mayIn: false };
        this.buildStage2();
        break;

      case 3:
        this.name = 'Stage 3: The Clashing Conduit';
        this.description = 'Pin moving pistons with Cody\'s nails and shatter security locks with May\'s hammer.';
        this.codyStart = { x: 80, y: 520 };
        this.mayStart = { x: 140, y: 520 };
        this.exitGate = { x: 1220, y: 220, w: 70, h: 90, codyIn: false, mayIn: false };
        this.buildStage3();
        break;

      case 4:
      default:
        this.name = 'Boss Encounter: The Deranged Tool Box';
        this.description = 'Pin the boss\'s slamming arm with Cody\'s nail; May climbs and smashes the power core!';
        this.codyStart = { x: 160, y: 530 };
        this.mayStart = { x: 260, y: 530 };
        this.exitGate = { x: 1180, y: 520, w: 70, h: 90, codyIn: false, mayIn: false };
        this.buildBossStage();
        break;
    }
  }

  private buildStage1(): void {
    // Ground & Boundaries
    this.colliders.push({ x: 0, y: 600, w: 1300, h: 100, isSolid: true }); // Main floor
    this.colliders.push({ x: 0, y: 0, w: 30, h: 700, isSolid: true });      // Left wall
    this.colliders.push({ x: 1270, y: 0, w: 30, h: 700, isSolid: true });   // Right wall

    // Stepping platforms
    this.colliders.push({ x: 260, y: 490, w: 140, h: 25, isSolid: true });
    this.colliders.push({ x: 460, y: 410, w: 160, h: 25, isSolid: true });

    // Pneumatic Gate (opened by pressure plate)
    this.colliders.push({ x: 680, y: 320, w: 26, h: 280, isSolid: true, tag: 'door_stage1' });

    // Raised exit ledge
    this.colliders.push({ x: 740, y: 530, w: 540, h: 70, isSolid: true });

    // Interactive switches
    this.switches.push({
      x: 310,
      y: 476,
      w: 40,
      h: 14,
      type: 'plate',
      isActivated: false,
      linkedDoorId: 'door_stage1',
    });

    this.switches.push({
      x: 520,
      y: 396,
      w: 40,
      h: 14,
      type: 'hammer_button',
      isActivated: false,
      linkedDoorId: 'door_stage1',
    });
  }

  private buildStage2(): void {
    // Floor sections with wide spike chasm in the middle
    this.colliders.push({ x: 0, y: 600, w: 340, h: 100, isSolid: true }); // Left ledge
    this.colliders.push({ x: 340, y: 650, w: 580, h: 50, isHazard: true }); // Spike pit!
    this.colliders.push({ x: 920, y: 600, w: 380, h: 100, isSolid: true }); // Right ledge
    this.colliders.push({ x: 0, y: 0, w: 30, h: 700, isSolid: true });
    this.colliders.push({ x: 1270, y: 0, w: 30, h: 700, isSolid: true });

    // Wooden targets overhead where Cody can shoot nails for May to swing!
    this.colliders.push({ x: 440, y: 280, w: 70, h: 32, isSolid: true, isWood: true });
    this.colliders.push({ x: 650, y: 220, w: 70, h: 32, isSolid: true, isWood: true });
    this.colliders.push({ x: 820, y: 290, w: 70, h: 32, isSolid: true, isWood: true });

    // Upper platform with switch
    this.colliders.push({ x: 980, y: 410, w: 280, h: 25, isSolid: true });

    this.switches.push({
      x: 1060,
      y: 396,
      w: 44,
      h: 14,
      type: 'hammer_button',
      isActivated: false,
      linkedDoorId: 'door_stage2',
    });

    // Exit gate platform
    this.colliders.push({ x: 1160, y: 410, w: 100, h: 200, isSolid: true, tag: 'door_stage2' });
  }

  private buildStage3(): void {
    this.colliders.push({ x: 0, y: 600, w: 1300, h: 100, isSolid: true });
    this.colliders.push({ x: 0, y: 0, w: 30, h: 700, isSolid: true });
    this.colliders.push({ x: 1270, y: 0, w: 30, h: 700, isSolid: true });

    // Moving conveyor platforms that can be pinned by Cody's nails
    this.movingPlatforms.push({
      x: 320,
      y: 470,
      w: 160,
      h: 24,
      originX: 280,
      targetX: 520,
      speed: 120,
      isPinned: false,
    });

    this.movingPlatforms.push({
      x: 720,
      y: 340,
      w: 160,
      h: 24,
      originX: 660,
      targetX: 940,
      speed: 160,
      isPinned: false,
    });

    // Wooden crossbar above moving platform
    this.colliders.push({ x: 580, y: 260, w: 60, h: 30, isSolid: true, isWood: true });

    // Crushing gate
    this.colliders.push({ x: 1080, y: 150, w: 30, h: 450, isSolid: true, tag: 'door_stage3' });

    // Switches
    this.switches.push({
      x: 980,
      y: 586,
      w: 48,
      h: 14,
      type: 'plate',
      isActivated: false,
      linkedDoorId: 'door_stage3',
    });
  }

  private buildBossStage(): void {
    // Boss Arena Floor
    this.colliders.push({ x: 0, y: 600, w: 1300, h: 100, isSolid: true });
    this.colliders.push({ x: 0, y: 0, w: 40, h: 700, isSolid: true });
    this.colliders.push({ x: 1260, y: 0, w: 40, h: 700, isSolid: true });

    // Arena side platforms
    this.colliders.push({ x: 60, y: 440, w: 160, h: 25, isSolid: true });
    this.colliders.push({ x: 1060, y: 440, w: 160, h: 25, isSolid: true });

    // Center Boss
    this.boss = {
      x: 780,
      y: 220,
      w: 260,
      h: 280,
      hp: 100,
      maxHp: 100,
      phase: 1,
      armState: 'idle',
      armX: 580,
      armY: 260,
      armTimer: 2.5,
      sweepNailX: 100,
      sweepNailDir: 1,
      isHitFlashing: 0,
    };
  }

  public update(
    dt: number,
    codyPos: Vec2,
    mayPos: Vec2,
    hammerHitbox: { x: number; y: number; w: number; h: number } | undefined,
    audio: SynthEngine,
    particles: Particle[],
    triggerScreenshake: (trauma: number) => void
  ): { stageCompleted: boolean } {
    // 1. Update Switches
    for (const sw of this.switches) {
      let nowActive = false;
      if (sw.type === 'plate') {
        const codyOn = codyPos.x + 28 > sw.x && codyPos.x < sw.x + sw.w && Math.abs((codyPos.y + 46) - sw.y) < 8;
        const mayOn = mayPos.x + 28 > sw.x && mayPos.x < sw.x + sw.w && Math.abs((mayPos.y + 46) - sw.y) < 8;
        nowActive = codyOn || mayOn;
      } else if (sw.type === 'hammer_button') {
        if (hammerHitbox) {
          const hit =
            hammerHitbox.x < sw.x + sw.w &&
            hammerHitbox.x + hammerHitbox.w > sw.x &&
            hammerHitbox.y < sw.y + sw.h &&
            hammerHitbox.y + hammerHitbox.h > sw.y;
          if (hit) {
            nowActive = true;
            triggerScreenshake(0.3);
            audio.sfxHammerSmash();
          }
        }
      }

      if (nowActive !== sw.isActivated) {
        sw.isActivated = nowActive;
        audio.sfxSwitch();
      }
    }

    // 2. Update Doors based on switches
    for (const box of this.colliders) {
      if (box.tag) {
        const linkedSw = this.switches.find((s) => s.linkedDoorId === box.tag);
        if (linkedSw) {
          box.isSolid = !linkedSw.isActivated;
        }
      }
    }

    // 3. Update Moving Platforms
    for (const plat of this.movingPlatforms) {
      if (!plat.isPinned) {
        plat.x += plat.speed * dt;
        if (plat.x > plat.targetX) {
          plat.x = plat.targetX;
          plat.speed = -Math.abs(plat.speed);
        } else if (plat.x < plat.originX) {
          plat.x = plat.originX;
          plat.speed = Math.abs(plat.speed);
        }
      }
    }

    // 4. Update Exit Gate Check
    const codyAtGate =
      codyPos.x + 28 > this.exitGate.x &&
      codyPos.x < this.exitGate.x + this.exitGate.w &&
      codyPos.y + 46 > this.exitGate.y;

    const mayAtGate =
      mayPos.x + 28 > this.exitGate.x &&
      mayPos.x < this.exitGate.x + this.exitGate.w &&
      mayPos.y + 46 > this.exitGate.y;

    this.exitGate.codyIn = codyAtGate;
    this.exitGate.mayIn = mayAtGate;

    // 5. Update Boss if active
    if (this.boss && this.boss.hp > 0) {
      this.updateBoss(dt, codyPos, mayPos, hammerHitbox, audio, particles, triggerScreenshake);
    }

    if (this.boss) {
      return { stageCompleted: this.boss.hp <= 0 };
    }

    return { stageCompleted: codyAtGate && mayAtGate };
  }

  private updateBoss(
    dt: number,
    codyPos: Vec2,
    mayPos: Vec2,
    hammerHitbox: { x: number; y: number; w: number; h: number } | undefined,
    audio: SynthEngine,
    particles: Particle[],
    triggerScreenshake: (trauma: number) => void
  ): void {
    if (!this.boss) return;
    if (this.boss.isHitFlashing > 0) this.boss.isHitFlashing -= dt;

    this.boss.armTimer -= dt;

    // Boss State Machine: idle -> raising -> slamming -> pinned / recovering
    switch (this.boss.armState) {
      case 'idle':
        if (this.boss.armTimer <= 0) {
          this.boss.armState = 'raising';
          this.boss.armTimer = 1.0;
        }
        break;

      case 'raising':
        this.boss.armY -= 180 * dt;
        if (this.boss.armTimer <= 0) {
          this.boss.armState = 'slamming';
          this.boss.armTimer = 0.4;
        }
        break;

      case 'slamming':
        this.boss.armY += 750 * dt;
        if (this.boss.armY >= 520) {
          this.boss.armY = 520;
          this.boss.armState = 'recovering';
          this.boss.armTimer = 2.2;
          triggerScreenshake(0.6);
          audio.sfxGroundPound();

          // Spawn impact dust
          for (let i = 0; i < 20; i++) {
            particles.push({
              x: this.boss.armX + 80,
              y: 570,
              vx: (Math.random() - 0.5) * 600,
              vy: -Math.random() * 300,
              color: '#fee440',
              life: 0.4,
              maxLife: 0.4,
              size: Math.random() * 6 + 4,
            });
          }
        }
        break;

      case 'pinned':
        // Boss arm is pinned down by Cody's nail!
        // May can now hammer the core on the arm!
        if (hammerHitbox) {
          const hit =
            hammerHitbox.x < this.boss.armX + 180 &&
            hammerHitbox.x + hammerHitbox.w > this.boss.armX &&
            hammerHitbox.y < this.boss.armY + 70 &&
            hammerHitbox.y + hammerHitbox.h > this.boss.armY;

          if (hit) {
            this.boss.hp -= 34;
            this.boss.isHitFlashing = 0.35;
            triggerScreenshake(0.7);
            audio.sfxBossHit();

            for (let i = 0; i < 30; i++) {
              particles.push({
                x: this.boss.armX + 90,
                y: this.boss.armY + 30,
                vx: (Math.random() - 0.5) * 500,
                vy: (Math.random() - 0.5) * 500,
                color: '#ff2a85',
                life: 0.5,
                maxLife: 0.5,
                size: Math.random() * 8 + 3,
              });
            }

            this.boss.armState = 'recovering';
            this.boss.armTimer = 1.0;
          }
        }
        break;

      case 'recovering':
        this.boss.armY += (260 - this.boss.armY) * 3 * dt;
        if (this.boss.armTimer <= 0) {
          this.boss.armState = 'idle';
          this.boss.armTimer = 2.0;
        }
        break;
    }

    // Nail sweep hazard in Phase 2
    if (this.boss.hp < 70) {
      this.boss.sweepNailX += this.boss.sweepNailDir * 320 * dt;
      if (this.boss.sweepNailX > 900) this.boss.sweepNailDir = -1;
      if (this.boss.sweepNailX < 100) this.boss.sweepNailDir = 1;
    }
  }
}
