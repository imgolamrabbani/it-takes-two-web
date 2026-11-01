import * as THREE from 'three';
import { TextureFactory } from '../../core/rendering/TextureFactory.js';

export interface ClockworkGear {
  mesh: THREE.Group;
  speed: number;
}

export interface Boss3DState {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  eyeLeft: THREE.Mesh;
  eyeRight: THREE.Mesh;
  slammingArm: THREE.Group;
  armTargetModule: THREE.Mesh;
  hp: number;
  maxHp: number;
  armState: 'idle' | 'raising' | 'slamming' | 'pinned' | 'recovering';
  armTimer: number;
  collider: THREE.Box3;
  moduleCollider: THREE.Box3;
}

export class World3D {
  public scene: THREE.Scene;
  public colliders: THREE.Box3[] = [];
  public gears: ClockworkGear[] = [];
  public pendulumGroup: THREE.Group | null = null;
  public boss: Boss3DState | null = null;
  private dustPoints!: THREE.Points;
  private dustGeo!: THREE.BufferGeometry;

  constructor(scene: THREE.Scene, stage: number) {
    this.scene = scene;
    this.buildAtmosphere();
    this.buildDustParticles();

    if (stage === 1 || stage === 2) {
      this.buildGrandClockworkCathedral();
    } else {
      this.buildSapBossArena();
    }
  }

  private buildAtmosphere(): void {
    // Warm cinematic ambient light
    const ambient = new THREE.AmbientLight(0xffecd2, 0.75);
    this.scene.add(ambient);

    // Warm Sun / Clock Face directional backlight from deep in the chamber
    const dirLight = new THREE.DirectionalLight(0xffb703, 2.2);
    dirLight.position.set(0, 24, -28);
    dirLight.target.position.set(0, 4, 0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1.0;
    dirLight.shadow.camera.far = 70;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    this.scene.add(dirLight);
    this.scene.add(dirLight.target);

    // Warm rim fill light from the camera side
    const frontFill = new THREE.DirectionalLight(0x7090b0, 0.6);
    frontFill.position.set(0, 10, 15);
    this.scene.add(frontFill);

    // Atmospheric warm workshop haze
    this.scene.fog = new THREE.FogExp2(0x1a120c, 0.015);
  }

  private buildDustParticles(): void {
    const count = 400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 45;
    }

    this.dustGeo = new THREE.BufferGeometry();
    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xffe082,
      size: 0.18,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    this.dustPoints = new THREE.Points(this.dustGeo, dustMat);
    this.scene.add(this.dustPoints);
  }

  private buildGrandClockworkCathedral(): void {
    const woodTex = TextureFactory.createWoodTexture();
    const brassTex = TextureFactory.createBrassTexture();

    // 1. Heavy Workshop Timber Floor
    const floorGeo = new THREE.BoxGeometry(60, 1.5, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.75,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.75, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.colliders.push(new THREE.Box3().setFromObject(floor));

    // Wooden floor edge trims
    const trimGeo = new THREE.BoxGeometry(60, 0.6, 1.2);
    const trimFront = new THREE.Mesh(trimGeo, floorMat);
    trimFront.position.set(0, 0.3, 24);
    this.scene.add(trimFront);

    // 2. Colossal Backlit Clock Face (Direct homage to User Reference 3)
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 16, -22);

    const clockRimGeo = new THREE.TorusGeometry(12, 0.9, 16, 48);
    const clockRimMat = new THREE.MeshStandardMaterial({
      map: brassTex,
      metalness: 0.9,
      roughness: 0.25,
    });
    const clockRim = new THREE.Mesh(clockRimGeo, clockRimMat);
    clockGroup.add(clockRim);

    // Glowing warm sun dial face
    const clockDialGeo = new THREE.CylinderGeometry(11.8, 11.8, 0.4, 32);
    const clockDialMat = new THREE.MeshStandardMaterial({
      color: 0xffe57f,
      emissive: 0xffb300,
      emissiveIntensity: 0.85,
      roughness: 0.4,
    });
    const clockDial = new THREE.Mesh(clockDialGeo, clockDialMat);
    clockDial.rotation.x = Math.PI / 2;
    clockGroup.add(clockDial);

    // Clock hour indices (Roman numerals radial pattern)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const notchGeo = new THREE.BoxGeometry(0.5, 2.2, 0.6);
      const notchMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.5 });
      const notch = new THREE.Mesh(notchGeo, notchMat);
      notch.position.set(Math.sin(angle) * 9.5, Math.cos(angle) * 9.5, 0.2);
      notch.rotation.z = -angle;
      clockGroup.add(notch);
    }
    this.scene.add(clockGroup);

    // 3. Giant Rotating Interlocking Brass Gears (User Reference 3)
    const gearCenter = this.createDetailedGear(7.5, 20, brassTex);
    gearCenter.position.set(0, 26, -18);
    this.scene.add(gearCenter);
    this.gears.push({ mesh: gearCenter, speed: 0.2 });

    const gearLeft = this.createDetailedGear(5.0, 16, brassTex);
    gearLeft.position.set(-13, 14, -16);
    this.scene.add(gearLeft);
    this.gears.push({ mesh: gearLeft, speed: -0.45 });

    const gearRight = this.createDetailedGear(4.2, 14, brassTex);
    gearRight.position.set(13, 12, -15);
    this.scene.add(gearRight);
    this.gears.push({ mesh: gearRight, speed: 0.55 });

    const gearFloor = this.createDetailedGear(6.5, 18, brassTex);
    gearFloor.position.set(-6, 2, -14);
    this.scene.add(gearFloor);
    this.gears.push({ mesh: gearFloor, speed: 0.35 });

    // 4. Giant Swinging Ornate Lyre Pendulum (User Reference 3)
    this.pendulumGroup = new THREE.Group();
    this.pendulumGroup.position.set(0, 24, -14);

    const shaftGeo = new THREE.CylinderGeometry(0.24, 0.24, 20, 12);
    const shaft = new THREE.Mesh(shaftGeo, clockRimMat);
    shaft.position.y = -10;
    this.pendulumGroup.add(shaft);

    // Ornate Lyre / Bob Structure
    const lyreBobGroup = new THREE.Group();
    lyreBobGroup.position.set(0, -18, 0);

    const outerRingGeo = new THREE.TorusGeometry(3.6, 0.5, 12, 32);
    const outerRing = new THREE.Mesh(outerRingGeo, clockRimMat);
    lyreBobGroup.add(outerRing);

    // Lyre strings / bars
    for (let s = -3; s <= 3; s++) {
      const stringGeo = new THREE.CylinderGeometry(0.06, 0.06, 6.0, 8);
      const str = new THREE.Mesh(stringGeo, clockRimMat);
      str.position.set(s * 0.8, 0, 0);
      lyreBobGroup.add(str);
    }
    this.pendulumGroup.add(lyreBobGroup);
    this.scene.add(this.pendulumGroup);

    // 5. Wooden Scaffold Bridges, Railings & Hanging Lanterns
    const bridgeGeo = new THREE.BoxGeometry(16, 0.8, 5);
    const bridgeL = new THREE.Mesh(bridgeGeo, floorMat);
    bridgeL.position.set(-8, 3.5, -6);
    bridgeL.castShadow = true;
    bridgeL.receiveShadow = true;
    this.scene.add(bridgeL);
    this.colliders.push(new THREE.Box3().setFromObject(bridgeL));

    const bridgeR = new THREE.Mesh(bridgeGeo, floorMat);
    bridgeR.position.set(8, 6.2, -8);
    bridgeR.castShadow = true;
    bridgeR.receiveShadow = true;
    this.scene.add(bridgeR);
    this.colliders.push(new THREE.Box3().setFromObject(bridgeR));

    // Wooden Crates & Tool Stacks
    this.createWoodenCrate(new THREE.Vector3(-14, 1.0, -2), 2.0);
    this.createWoodenCrate(new THREE.Vector3(14, 1.0, -2), 2.0);
    this.createWoodenCrate(new THREE.Vector3(-12, 4.5, -6), 1.6);
    this.createWoodenCrate(new THREE.Vector3(12, 7.2, -8), 1.6);

    // Hanging Lanterns casting local glowing amber pools
    this.createHangingLantern(new THREE.Vector3(-8, 7.5, -4));
    this.createHangingLantern(new THREE.Vector3(8, 10.5, -6));

    // Interactive Target Boards for Cody's Sap & May's Matches
    this.createTargetBoard(new THREE.Vector3(-16, 5.0, -10));
    this.createTargetBoard(new THREE.Vector3(16, 8.0, -12));
  }

  private buildSapBossArena(): void {
    const woodTex = TextureFactory.createWoodTexture();
    const brassTex = TextureFactory.createBrassTexture();

    // Cavern Arena Floor
    const floorGeo = new THREE.CylinderGeometry(28, 28, 1.5, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.75, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.colliders.push(new THREE.Box3().setFromObject(floor));

    // Perimeter Timber Barricades
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
      const px = Math.cos(a) * 25;
      const pz = Math.sin(a) * 25;
      this.createWoodenCrate(new THREE.Vector3(px, 1.2, pz), 2.4);
    }

    // Targets for Sap Explosion Practice
    this.createTargetBoard(new THREE.Vector3(-16, 3.5, -12));
    this.createTargetBoard(new THREE.Vector3(16, 3.5, -12));

    // Build The Deranged Toolbox 3D Boss
    this.buildBossToolbox(brassTex, woodTex);
  }

  private buildBossToolbox(brassTex: THREE.CanvasTexture, woodTex: THREE.CanvasTexture): void {
    const bossGroup = new THREE.Group();
    bossGroup.position.set(0, 0, -16);

    // Timber Toolbox Chest
    const bodyGeo = new THREE.BoxGeometry(12, 8, 7);
    const bodyMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0x7a3818,
      roughness: 0.65,
      metalness: 0.2,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 4.0;
    bodyMesh.castShadow = true;
    bossGroup.add(bodyMesh);

    // Brass Hinges and Corner Brackets
    const bracketGeo = new THREE.BoxGeometry(12.4, 0.8, 7.4);
    const brassMat = new THREE.MeshStandardMaterial({ map: brassTex, metalness: 0.85, roughness: 0.25 });
    const bracket = new THREE.Mesh(bracketGeo, brassMat);
    bracket.position.y = 6.5;
    bossGroup.add(bracket);

    // Menacing Glowing Eyes
    const eyeGeo = new THREE.BoxGeometry(1.8, 0.9, 0.4);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-2.6, 5.0, 3.6);
    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(2.6, 5.0, 3.6);
    bossGroup.add(eyeLeft, eyeRight);

    // Articulated Wooden Slamming Fist / Hydraulic Arm
    const slammingArm = new THREE.Group();
    slammingArm.position.set(0, 7, 4.5);

    const armGeo = new THREE.BoxGeometry(3.0, 3.0, 11);
    const armMesh = new THREE.Mesh(armGeo, bodyMat);
    armMesh.position.z = 5.5;
    armMesh.castShadow = true;
    slammingArm.add(armMesh);

    // Glowing Power Module Target on Fist (Where Sap + Match must hit!)
    const moduleGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16);
    const moduleMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 1.0,
      roughness: 0.2,
    });
    const armTargetModule = new THREE.Mesh(moduleGeo, moduleMat);
    armTargetModule.position.set(0, 1.8, 8.0);
    slammingArm.add(armTargetModule);

    bossGroup.add(slammingArm);
    this.scene.add(bossGroup);

    this.boss = {
      group: bossGroup,
      bodyMesh,
      eyeLeft,
      eyeRight,
      slammingArm,
      armTargetModule,
      hp: 100,
      maxHp: 100,
      armState: 'idle',
      armTimer: 2.0,
      collider: new THREE.Box3().setFromObject(bodyMesh),
      moduleCollider: new THREE.Box3().setFromObject(armTargetModule),
    };
  }

  private createDetailedGear(radius: number, teeth: number, brassTex: THREE.CanvasTexture): THREE.Group {
    const gear = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      map: brassTex,
      metalness: 0.9,
      roughness: 0.25,
    });

    // Central disc
    const discGeo = new THREE.CylinderGeometry(radius, radius, 0.7, 32);
    const disc = new THREE.Mesh(discGeo, mat);
    disc.rotation.x = Math.PI / 2;
    disc.castShadow = true;
    gear.add(disc);

    // Hub center boss
    const hubGeo = new THREE.CylinderGeometry(radius * 0.35, radius * 0.35, 1.1, 16);
    const hub = new THREE.Mesh(hubGeo, mat);
    hub.rotation.x = Math.PI / 2;
    gear.add(hub);

    // Extruded mechanical teeth
    const toothGeo = new THREE.BoxGeometry(0.9, 1.4, 0.7);
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeo, mat);
      tooth.position.set(Math.cos(angle) * (radius + 0.5), Math.sin(angle) * (radius + 0.5), 0);
      tooth.rotation.z = angle;
      tooth.castShadow = true;
      gear.add(tooth);
    }

    return gear;
  }

  private createWoodenCrate(pos: THREE.Vector3, size: number): void {
    const woodTex = TextureFactory.createWoodTexture();
    const crateGeo = new THREE.BoxGeometry(size, size, size);
    const crateMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.7,
    });
    const crate = new THREE.Mesh(crateGeo, crateMat);
    crate.position.copy(pos);
    crate.castShadow = true;
    crate.receiveShadow = true;
    this.scene.add(crate);
    this.colliders.push(new THREE.Box3().setFromObject(crate));
  }

  private createHangingLantern(pos: THREE.Vector3): void {
    const chainGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    const chain = new THREE.Mesh(chainGeo, metalMat);
    chain.position.set(pos.x, pos.y + 1.75, pos.z);
    this.scene.add(chain);

    const lanternGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 8);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff8800,
      emissiveIntensity: 0.9,
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.copy(pos);
    this.scene.add(lantern);

    const light = new THREE.PointLight(0xffaa22, 2.5, 14);
    light.position.copy(pos);
    this.scene.add(light);
  }

  private createTargetBoard(pos: THREE.Vector3): void {
    const targetGroup = new THREE.Group();
    targetGroup.position.copy(pos);

    const woodTex = TextureFactory.createWoodTexture();
    const boardGeo = new THREE.CylinderGeometry(2.6, 2.6, 0.4, 24);
    const boardMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.rotation.x = Math.PI / 2;
    targetGroup.add(board);

    // Bullseye Ring
    const ringGeo = new THREE.TorusGeometry(1.5, 0.22, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xff0044, roughness: 0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    targetGroup.add(ring);

    this.scene.add(targetGroup);
    this.colliders.push(new THREE.Box3().setFromObject(targetGroup));
  }

  public update(dt: number, time: number): void {
    // 1. Rotate gears
    for (const g of this.gears) {
      g.mesh.rotation.z += g.speed * dt;
    }

    // 2. Swing pendulum
    if (this.pendulumGroup) {
      this.pendulumGroup.rotation.z = Math.sin(time * 1.6) * 0.42;
    }

    // 3. Float dust particles
    if (this.dustGeo) {
      const pos = this.dustGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= 0.6 * dt;
        if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 22;
      }
      this.dustGeo.attributes.position.needsUpdate = true;
    }

    // 4. Update Boss state
    if (this.boss && this.boss.hp > 0) {
      this.boss.armTimer -= dt;
      const { slammingArm } = this.boss;

      switch (this.boss.armState) {
        case 'idle':
          slammingArm.rotation.x = Math.sin(time * 2.0) * 0.08;
          if (this.boss.armTimer <= 0) {
            this.boss.armState = 'raising';
            this.boss.armTimer = 1.0;
          }
          break;

        case 'raising':
          slammingArm.rotation.x += 1.8 * dt;
          if (this.boss.armTimer <= 0) {
            this.boss.armState = 'slamming';
            this.boss.armTimer = 0.3;
          }
          break;

        case 'slamming':
          slammingArm.rotation.x -= 6.0 * dt;
          if (slammingArm.rotation.x <= -0.5 || this.boss.armTimer <= 0) {
            slammingArm.rotation.x = -0.5;
            this.boss.armState = 'recovering';
            this.boss.armTimer = 2.4;
          }
          break;

        case 'recovering':
          slammingArm.rotation.x += (0 - slammingArm.rotation.x) * 2.8 * dt;
          if (this.boss.armTimer <= 0) {
            this.boss.armState = 'idle';
            this.boss.armTimer = 2.0;
          }
          break;
      }

      this.boss.moduleCollider.setFromObject(this.boss.armTargetModule);
    }
  }
}
