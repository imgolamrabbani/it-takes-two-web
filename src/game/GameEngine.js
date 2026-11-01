import { Kinematics } from '../core/physics/Kinematics.js';
import { SynthEngine } from '../core/audio/SynthEngine.js';
import { InputManager } from '../core/input/InputManager.js';
import { Renderer } from '../core/rendering/Renderer.js';
import { Player } from './entities/Player.js';
import { Nail } from './entities/Nail.js';
import { Level } from './entities/Level.js';
import { UIManager } from '../ui/UIManager.js';
export class GameEngine {
    canvas;
    renderer;
    audio;
    input;
    ui;
    state = 'TITLE';
    currentStageIndex = 1;
    cody;
    may;
    level;
    nails = [];
    particles = [];
    // Fixed timestep loop
    lastTime = 0;
    accumulator = 0;
    fps = 60;
    frameCount = 0;
    fpsTimer = 0;
    showDebug = false;
    constructor(canvas, uiRoot) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.audio = new SynthEngine();
        this.input = new InputManager();
        this.ui = new UIManager(uiRoot, {
            onStartGame: (mode, stage) => {
                this.input.isCoopMode = mode === 'coop';
                this.startStage(stage);
            },
            onResume: () => {
                this.state = 'PLAYING';
                this.ui.setState('PLAYING');
            },
            onRestartStage: () => {
                this.startStage(this.currentStageIndex);
            },
            onNextStage: () => {
                this.startStage(this.currentStageIndex + 1);
            },
            onReturnTitle: () => {
                this.state = 'TITLE';
                this.ui.setState('TITLE');
                this.audio.stopProceduralMusic();
            },
            onVolumeChange: (sfx, music) => {
                this.audio.setSfxVolume(sfx);
                this.audio.setMusicVolume(music);
            },
        });
        this.initLevel(1);
        // Inject automated bot hook for AGENT_PLAYER_UX playtesting
        if (typeof window !== 'undefined') {
            window.__GAME_DEBUG__ = {
                getState: () => ({
                    state: this.state,
                    stage: this.currentStageIndex,
                    codyPos: { ...this.cody.pos },
                    mayPos: { ...this.may.pos },
                    codyNails: this.cody.nailsAvailable,
                    activeNails: this.nails.length,
                    bossHp: this.level.boss?.hp,
                    fps: this.fps,
                }),
                simulateAction: (action) => {
                    if (action === 'throwNail') {
                        const nail = new Nail(Date.now(), this.cody.pos.x + 32, this.cody.pos.y + 16, 750, -100);
                        this.nails.push(nail);
                        this.audio.sfxNailThrow();
                    }
                    else if (action === 'hammerSmash') {
                        this.may.isHammerSwinging = true;
                        this.may.hammerSwingTimer = 0.22;
                        this.audio.sfxHammerSmash();
                    }
                    else if (action === 'advanceStage') {
                        this.startStage(this.currentStageIndex + 1);
                    }
                },
            };
        }
    }
    initLevel(stage) {
        this.currentStageIndex = stage;
        this.level = new Level(stage);
        this.cody = new Player('cody', this.level.codyStart.x, this.level.codyStart.y);
        this.may = new Player('may', this.level.mayStart.x, this.level.mayStart.y);
        this.nails = [];
        this.particles = [];
    }
    startStage(stage) {
        if (stage > 4) {
            this.state = 'VICTORY';
            this.ui.setState('VICTORY');
            this.audio.sfxFanfare();
            return;
        }
        this.initLevel(stage);
        this.state = 'PLAYING';
        this.ui.setState('PLAYING');
        this.audio.startProceduralMusic();
    }
    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }
    loop(now) {
        const rawDelta = (now - this.lastTime) / 1000;
        this.lastTime = now;
        const delta = Math.min(rawDelta, 0.1); // clamp spiral of death
        // Calculate FPS
        this.frameCount++;
        this.fpsTimer += delta;
        if (this.fpsTimer >= 0.5) {
            this.fps = this.frameCount / this.fpsTimer;
            this.frameCount = 0;
            this.fpsTimer = 0;
        }
        // Handle global inputs
        if (this.input.isDebugToggled()) {
            this.showDebug = !this.showDebug;
        }
        if (this.input.isPauseToggled()) {
            if (this.state === 'PLAYING') {
                this.state = 'PAUSED';
                this.ui.setState('PAUSED');
            }
            else if (this.state === 'PAUSED') {
                this.state = 'PLAYING';
                this.ui.setState('PLAYING');
            }
        }
        // Fixed timestep accumulator for 120Hz deterministic physics
        if (this.state === 'PLAYING') {
            this.accumulator += delta;
            while (this.accumulator >= Kinematics.DT) {
                this.fixedUpdate(Kinematics.DT);
                this.accumulator -= Kinematics.DT;
            }
        }
        // Render Frame
        this.renderer.render({
            cody: this.cody,
            may: this.may,
            nails: this.nails,
            level: this.level,
            particles: this.particles,
            showDebug: this.showDebug,
            fps: this.fps,
            gameState: this.state,
        }, delta);
        this.input.endFrame();
        requestAnimationFrame((t) => this.loop(t));
    }
    fixedUpdate(dt) {
        const inputs = this.input.getPlayerInputs();
        // Update Cody
        const codyRes = this.cody.update(dt, inputs.cody, this.level.colliders, this.nails, this.audio, this.particles, (trauma) => this.renderer.addTrauma(trauma));
        if (codyRes.spawnedNail) {
            this.nails.push(codyRes.spawnedNail);
        }
        if (codyRes.recallNails) {
            for (const n of this.nails) {
                n.recall();
            }
        }
        // Update May
        const mayRes = this.may.update(dt, inputs.may, this.level.colliders, this.nails, this.audio, this.particles, (trauma) => this.renderer.addTrauma(trauma));
        // Update Nails
        for (let i = this.nails.length - 1; i >= 0; i--) {
            const nail = this.nails[i];
            const stillActive = nail.update(dt, this.level.colliders, this.cody.pos);
            // Check if nail embeds in moving platform
            for (const plat of this.level.movingPlatforms) {
                if (Kinematics.checkAABB(nail.pos.x, nail.pos.y, 4, 4, plat.x, plat.y, plat.w, plat.h)) {
                    plat.isPinned = true;
                    nail.isEmbedded = true;
                    this.audio.sfxNailEmbed();
                }
            }
            // Check if nail hits Boss Arm to pin it!
            if (this.level.boss && this.level.boss.armState === 'slamming' && this.level.boss.armY > 480) {
                if (Kinematics.checkAABB(nail.pos.x, nail.pos.y, 4, 4, this.level.boss.armX, this.level.boss.armY, 180, 50)) {
                    this.level.boss.armState = 'pinned';
                    this.level.boss.armTimer = 3.5;
                    nail.isEmbedded = true;
                    this.audio.sfxNailEmbed();
                    this.renderer.addTrauma(0.4);
                }
            }
            if (!stillActive) {
                this.nails.splice(i, 1);
                this.cody.nailsAvailable = Math.min(this.cody.maxNails, this.cody.nailsAvailable + 1);
                this.audio.sfxNailRecall();
            }
        }
        // Update Level puzzles, switches, doors & boss
        const levelRes = this.level.update(dt, this.cody.pos, this.may.pos, mayRes.hammerHitbox, this.audio, this.particles, (trauma) => this.renderer.addTrauma(trauma));
        if (levelRes.stageCompleted) {
            if (this.currentStageIndex >= 4) {
                this.state = 'VICTORY';
                this.ui.setState('VICTORY');
                this.audio.sfxFanfare();
            }
            else {
                this.state = 'STAGE_CLEAR';
                this.ui.setState('STAGE_CLEAR');
                this.audio.sfxFanfare();
            }
        }
    }
}
