import * as THREE from 'three';
import { ThreeRenderer } from '../core/rendering/ThreeRenderer.js';
import { Character3D } from './entities/Character3D.js';
import { World3D } from './entities/World3D.js';
import { Weapons3D } from './weapons/Weapons3D.js';
import { SynthEngine } from '../core/audio/SynthEngine.js';
import { InputManager } from '../core/input/InputManager.js';
import { UIManager } from '../ui/UIManager.js';
export class GameEngine {
    scene;
    renderer;
    audio;
    input;
    ui;
    state = 'TITLE';
    currentStageIndex = 1;
    cody;
    may;
    world;
    weapons;
    lastTime = 0;
    fps = 60;
    frameCount = 0;
    fpsTimer = 0;
    showDebug = false;
    constructor(canvas, uiRoot) {
        this.scene = new THREE.Scene();
        this.renderer = new ThreeRenderer(canvas);
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
        // Toggle Camera View with V key
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyV') {
                const isSplit = this.renderer.toggleViewMode();
                const divider = document.getElementById('split-divider');
                if (divider)
                    divider.style.display = isSplit ? 'block' : 'none';
                const mayHud = document.getElementById('may-hud');
                const codyHud = document.getElementById('cody-hud');
                if (mayHud && codyHud) {
                    mayHud.style.display = isSplit ? 'block' : 'none';
                    codyHud.style.display = isSplit ? 'block' : 'none';
                }
            }
        });
        this.initStage(1);
        // Automated hook for QA playtesting
        if (typeof window !== 'undefined') {
            window.__GAME_DEBUG__ = {
                getState: () => ({
                    state: this.state,
                    stage: this.currentStageIndex,
                    codyPos: { x: this.cody.pos.x, y: this.cody.pos.y, z: this.cody.pos.z },
                    mayPos: { x: this.may.pos.x, y: this.may.pos.y, z: this.may.pos.z },
                    sapGlobsCount: this.weapons.sapGlobs.length,
                    matchDartsCount: this.weapons.matchDarts.length,
                    explosionsCount: this.weapons.explosions.length,
                    bossHp: this.world.boss?.hp,
                    fps: this.fps,
                }),
                simulateAction: (action) => {
                    if (action === 'fireSap') {
                        const dir = new THREE.Vector3(Math.sin(this.cody.facingAngle), 0.1, Math.cos(this.cody.facingAngle));
                        this.weapons.fireSap(this.cody.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), dir);
                        this.audio.sfxNailThrow();
                    }
                    else if (action === 'fireMatch') {
                        const dir = new THREE.Vector3(Math.sin(this.may.facingAngle), 0, Math.cos(this.may.facingAngle));
                        this.weapons.fireMatch(this.may.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), dir);
                        this.audio.sfxHammerSmash();
                    }
                    else if (action === 'advanceStage') {
                        this.startStage(this.currentStageIndex + 1);
                    }
                },
            };
        }
    }
    initStage(stage) {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.currentStageIndex = stage;
        this.world = new World3D(this.scene, stage);
        this.weapons = new Weapons3D(this.scene);
        // Spawn May on left (-6) and Cody on right (+6), facing -Z (into the level)
        this.may = new Character3D('may', new THREE.Vector3(-6, 0, 0));
        this.cody = new Character3D('cody', new THREE.Vector3(6, 0, 0));
        this.scene.add(this.may.group);
        this.scene.add(this.cody.group);
    }
    startStage(stage) {
        if (stage > 4) {
            this.state = 'VICTORY';
            this.ui.setState('VICTORY');
            this.audio.sfxFanfare();
            return;
        }
        this.initStage(stage);
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
        const delta = Math.min(rawDelta, 0.1);
        this.frameCount++;
        this.fpsTimer += delta;
        if (this.fpsTimer >= 0.5) {
            this.fps = this.frameCount / this.fpsTimer;
            this.frameCount = 0;
            this.fpsTimer = 0;
        }
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
        if (this.state === 'PLAYING') {
            this.updateGame(delta, now / 1000);
        }
        // Render Split-Screen Viewports
        this.renderer.render(this.scene, this.may, this.cody, delta);
        this.input.endFrame();
        requestAnimationFrame((t) => this.loop(t));
    }
    updateGame(dt, time) {
        const inputs = this.input.getPlayerInputs();
        // 1. Cody Controls (WASD)
        const codySpeed = 9.5;
        const codyMoveDir = new THREE.Vector3(inputs.cody.moveX, 0, inputs.cody.moveY);
        if (codyMoveDir.lengthSq() > 0.05) {
            codyMoveDir.normalize();
            this.cody.pos.addScaledVector(codyMoveDir, codySpeed * dt);
            this.cody.facingAngle = Math.atan2(codyMoveDir.x, codyMoveDir.z);
            this.cody.isMoving = true;
        }
        else {
            this.cody.isMoving = false;
        }
        if (inputs.cody.jumpPressed && this.cody.pos.y <= 0.1) {
            this.cody.vel.y = 8.5;
            this.cody.isJumping = true;
            this.audio.sfxJump();
        }
        this.cody.vel.y -= 22 * dt;
        this.cody.pos.y += this.cody.vel.y * dt;
        if (this.cody.pos.y <= 0) {
            this.cody.pos.y = 0;
            this.cody.vel.y = 0;
            this.cody.isJumping = false;
        }
        this.cody.updateAnimation(dt);
        // Cody Fire Sap (F key)
        if (inputs.cody.action1Pressed) {
            const shootDir = new THREE.Vector3(Math.sin(this.cody.facingAngle), 0.15, Math.cos(this.cody.facingAngle));
            this.weapons.fireSap(this.cody.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), shootDir);
            this.audio.sfxNailThrow();
        }
        // 2. May Controls (Arrow Keys)
        const maySpeed = 9.5;
        const mayMoveDir = new THREE.Vector3(inputs.may.moveX, 0, inputs.may.moveY);
        if (mayMoveDir.lengthSq() > 0.05) {
            mayMoveDir.normalize();
            this.may.pos.addScaledVector(mayMoveDir, maySpeed * dt);
            this.may.facingAngle = Math.atan2(mayMoveDir.x, mayMoveDir.z);
            this.may.isMoving = true;
        }
        else {
            this.may.isMoving = false;
        }
        if (inputs.may.jumpPressed && this.may.pos.y <= 0.1) {
            this.may.vel.y = 8.5;
            this.may.isJumping = true;
            this.audio.sfxJump();
        }
        this.may.vel.y -= 22 * dt;
        this.may.pos.y += this.may.vel.y * dt;
        if (this.may.pos.y <= 0) {
            this.may.pos.y = 0;
            this.may.vel.y = 0;
            this.may.isJumping = false;
        }
        this.may.updateAnimation(dt);
        // May Fire Match Rifle (L or M key)
        if (inputs.may.action1Pressed) {
            const shootDir = new THREE.Vector3(Math.sin(this.may.facingAngle), 0, Math.cos(this.may.facingAngle));
            this.weapons.fireMatch(this.may.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), shootDir);
            this.audio.sfxHammerSwing();
        }
        // 3. Update 3D World (gears, pendulum, boss)
        this.world.update(dt, time);
        // 4. Update Weapons, Projectiles & Chain Reaction Explosions
        const { detonatedCount } = this.weapons.update(dt, this.world.colliders);
        if (detonatedCount > 0) {
            this.audio.sfxHammerSmash();
            this.renderer.addTrauma(0.55);
            if (this.world.boss && this.world.boss.hp > 0) {
                for (const exp of this.weapons.explosions) {
                    const bossModulePos = this.world.boss.armTargetModule.position.clone()
                        .add(this.world.boss.slammingArm.position)
                        .add(this.world.boss.group.position);
                    if (exp.pos.distanceTo(bossModulePos) < 5.5) {
                        this.world.boss.hp -= 34;
                        this.audio.sfxBossHit();
                        this.renderer.addTrauma(0.75);
                        if (this.world.boss.hp <= 0) {
                            this.state = 'VICTORY';
                            this.ui.setState('VICTORY');
                            this.audio.sfxFanfare();
                        }
                    }
                }
            }
        }
    }
    handleResize(width, height) {
        this.renderer.resize(width, height);
    }
}
