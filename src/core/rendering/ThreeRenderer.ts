import * as THREE from 'three';
import { Character3D } from '../../game/entities/Character3D.js';

export class ThreeRenderer {
  public renderer: THREE.WebGLRenderer;
  public cameraMay: THREE.PerspectiveCamera;
  public cameraCody: THREE.PerspectiveCamera;
  public isSplitScreen = true;

  // Spring-damper camera positions
  private mayCamPos = new THREE.Vector3();
  private codyCamPos = new THREE.Vector3();

  // Screen shake trauma
  public trauma = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(canvas.width, canvas.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Left Screen: May's 3rd-person Follow Camera
    this.cameraMay = new THREE.PerspectiveCamera(65, (canvas.width / 2) / canvas.height, 0.1, 150);

    // Right Screen: Cody's 3rd-person Follow Camera
    this.cameraCody = new THREE.PerspectiveCamera(65, (canvas.width / 2) / canvas.height, 0.1, 150);
  }

  public addTrauma(amount: number): void {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public render(
    scene: THREE.Scene,
    may: Character3D,
    cody: Character3D,
    dt: number
  ): void {
    const w = this.renderer.domElement.width;
    const h = this.renderer.domElement.height;

    // Screen Shake Offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.trauma > 0) {
      const mag = this.trauma * this.trauma * 0.45;
      shakeX = (Math.random() - 0.5) * mag;
      shakeY = (Math.random() - 0.5) * mag;
      this.trauma = Math.max(0, this.trauma - 2.0 * dt);
    }

    // 1. Position May's Over-the-Shoulder Camera
    const mayTargetCam = new THREE.Vector3(
      may.pos.x - Math.sin(may.facingAngle) * 5.5 + 0.8,
      may.pos.y + 3.2,
      may.pos.z - Math.cos(may.facingAngle) * 5.5
    );
    this.mayCamPos.lerp(mayTargetCam, Math.min(1, 10 * dt));
    this.cameraMay.position.copy(this.mayCamPos);
    this.cameraMay.position.x += shakeX;
    this.cameraMay.position.y += shakeY;

    const mayLookAt = new THREE.Vector3(
      may.pos.x + Math.sin(may.facingAngle) * 8.0,
      may.pos.y + 1.8,
      may.pos.z + Math.cos(may.facingAngle) * 8.0
    );
    this.cameraMay.lookAt(mayLookAt);

    // 2. Position Cody's Over-the-Shoulder Camera
    const codyTargetCam = new THREE.Vector3(
      cody.pos.x - Math.sin(cody.facingAngle) * 5.5 + 0.8,
      cody.pos.y + 3.2,
      cody.pos.z - Math.cos(cody.facingAngle) * 5.5
    );
    this.codyCamPos.lerp(codyTargetCam, Math.min(1, 10 * dt));
    this.cameraCody.position.copy(this.codyCamPos);
    this.cameraCody.position.x += shakeX;
    this.cameraCody.position.y += shakeY;

    const codyLookAt = new THREE.Vector3(
      cody.pos.x + Math.sin(cody.facingAngle) * 8.0,
      cody.pos.y + 1.8,
      cody.pos.z + Math.cos(cody.facingAngle) * 8.0
    );
    this.cameraCody.lookAt(codyLookAt);

    // 3. Render Vertical Split-Screen
    this.renderer.setScissorTest(true);

    // LEFT VIEWPORT: May's Screen
    const halfW = Math.floor(w / 2);
    this.renderer.setViewport(0, 0, halfW, h);
    this.renderer.setScissor(0, 0, halfW, h);
    this.cameraMay.aspect = halfW / h;
    this.cameraMay.updateProjectionMatrix();
    this.renderer.render(scene, this.cameraMay);

    // RIGHT VIEWPORT: Cody's Screen
    this.renderer.setViewport(halfW, 0, halfW, h);
    this.renderer.setScissor(halfW, 0, halfW, h);
    this.cameraCody.aspect = halfW / h;
    this.cameraCody.updateProjectionMatrix();
    this.renderer.render(scene, this.cameraCody);

    this.renderer.setScissorTest(false);
  }

  public resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
  }
}
