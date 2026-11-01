import * as THREE from 'three';
import { TextureFactory } from '../../core/rendering/TextureFactory.js';

export class Character3D {
  public group: THREE.Group;
  public type: 'cody' | 'may';

  // Body hierarchy for animation
  public pelvis: THREE.Group;
  public torso: THREE.Group;
  public head: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftForearm: THREE.Group;
  public rightForearm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public weaponMesh: THREE.Group;
  public backpack: THREE.Group;

  // Animation cycle
  private walkTime = 0;
  public isMoving = false;
  public isJumping = false;
  public facingAngle = Math.PI; // Face towards -Z (into the level)

  // Kinematic state
  public pos = new THREE.Vector3();
  public vel = new THREE.Vector3();

  constructor(type: 'cody' | 'may', startPos: THREE.Vector3) {
    this.type = type;
    this.group = new THREE.Group();
    this.pos.copy(startPos);
    this.group.position.copy(startPos);

    this.pelvis = new THREE.Group();
    this.torso = new THREE.Group();
    this.head = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftForearm = new THREE.Group();
    this.rightForearm = new THREE.Group();
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.weaponMesh = new THREE.Group();
    this.backpack = new THREE.Group();

    if (type === 'may') {
      this.buildStylizedMay();
    } else {
      this.buildStylizedCody();
    }

    this.group.add(this.pelvis);
  }

  private buildStylizedMay(): void {
    const woodTex = TextureFactory.createWoodTexture();
    const yarnTex = TextureFactory.createYarnTexture();
    const brassTex = TextureFactory.createBrassTexture();

    // Wood joint material
    const woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xc89868,
      roughness: 0.5,
      metalness: 0.15,
    });

    // Denim fabric material
    const denimMat = new THREE.MeshStandardMaterial({
      map: yarnTex,
      color: 0x1d4e89,
      roughness: 0.75,
      metalness: 0.05,
    });

    // Striped sweater material
    const sweaterMat = new THREE.MeshStandardMaterial({
      color: 0xf4a261,
      roughness: 0.8,
    });

    // Brass hardware material
    const brassMat = new THREE.MeshStandardMaterial({
      map: brassTex,
      metalness: 0.85,
      roughness: 0.25,
    });

    // 1. Pelvis & Overalls Hips
    const pelvisGeo = new THREE.BoxGeometry(0.7, 0.45, 0.55);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, denimMat);
    pelvisMesh.position.y = 0.9;
    pelvisMesh.castShadow = true;
    this.pelvis.add(pelvisMesh);

    // 2. Torso (Sweater + Overalls Bib)
    this.torso.position.set(0, 0.25, 0);
    const sweaterGeo = new THREE.CylinderGeometry(0.38, 0.35, 0.75, 16);
    const sweaterMesh = new THREE.Mesh(sweaterGeo, sweaterMat);
    sweaterMesh.position.y = 0.45;
    sweaterMesh.castShadow = true;
    this.torso.add(sweaterMesh);

    // Overalls front bib & pocket
    const bibGeo = new THREE.BoxGeometry(0.48, 0.5, 0.42);
    const bibMesh = new THREE.Mesh(bibGeo, denimMat);
    bibMesh.position.set(0, 0.42, 0.1);
    bibMesh.castShadow = true;
    this.torso.add(bibMesh);

    // Brass buttons
    const btnGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8);
    const btnL = new THREE.Mesh(btnGeo, brassMat);
    btnL.rotation.x = Math.PI / 2;
    btnL.position.set(0.16, 0.62, 0.32);
    const btnR = new THREE.Mesh(btnGeo, brassMat);
    btnR.rotation.x = Math.PI / 2;
    btnR.position.set(-0.16, 0.62, 0.32);
    this.torso.add(btnL, btnR);

    // 3. Head & Hair
    this.head.position.set(0, 0.95, 0);

    // Carved wooden doll head
    const headGeo = new THREE.SphereGeometry(0.42, 20, 20);
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.55,
      metalness: 0.05,
    });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.08, 0.16, 8);
    const nose = new THREE.Mesh(noseGeo, woodMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0.02, 0.44);
    this.head.add(nose);

    // Expressive cartoon doll eyes
    const eyeWhiteGeo = new THREE.SphereGeometry(0.11, 12, 12);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x112244 });

    const eyeLW = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeLW.position.set(0.16, 0.08, 0.36);
    const eyeLP = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    eyeLP.position.set(0.18, 0.09, 0.44);
    this.head.add(eyeLW, eyeLP);

    const eyeRW = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeRW.position.set(-0.16, 0.08, 0.36);
    const eyeRP = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    eyeRP.position.set(-0.18, 0.09, 0.44);
    this.head.add(eyeRW, eyeRP);

    // Beautiful Yarn Hair Cap & Braided Pigtails
    const hairCapGeo = new THREE.SphereGeometry(0.44, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1d5cb8,
      roughness: 0.85,
    });
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.rotation.x = -0.15;
    this.head.add(hairCap);

    // Left braided pigtail with hairband
    const braidL = new THREE.Group();
    braidL.position.set(0.45, 0.15, -0.15);
    for (let i = 0; i < 4; i++) {
      const segGeo = new THREE.SphereGeometry(0.12 - i * 0.015, 8, 8);
      const seg = new THREE.Mesh(segGeo, hairMat);
      seg.position.set(i * 0.08, -i * 0.18, -i * 0.08);
      braidL.add(seg);
    }
    this.head.add(braidL);

    // Right braided pigtail
    const braidR = new THREE.Group();
    braidR.position.set(-0.45, 0.15, -0.15);
    for (let i = 0; i < 4; i++) {
      const segGeo = new THREE.SphereGeometry(0.12 - i * 0.015, 8, 8);
      const seg = new THREE.Mesh(segGeo, hairMat);
      seg.position.set(-i * 0.08, -i * 0.18, -i * 0.08);
      braidR.add(seg);
    }
    this.head.add(braidR);

    // 4. Arms with Ball-Jointed Shoulders
    const ballJointGeo = new THREE.SphereGeometry(0.12, 12, 12);

    // Left Arm
    this.leftArm.position.set(0.48, 0.72, 0);
    const lShoulder = new THREE.Mesh(ballJointGeo, woodMat);
    this.leftArm.add(lShoulder);
    const lBicepGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.45, 8);
    const lBicep = new THREE.Mesh(lBicepGeo, sweaterMat);
    lBicep.position.y = -0.25;
    this.leftArm.add(lBicep);

    this.leftForearm.position.set(0, -0.48, 0);
    const lElbow = new THREE.Mesh(ballJointGeo, woodMat);
    this.leftForearm.add(lElbow);
    const lForearmGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.42, 8);
    const lForearmMesh = new THREE.Mesh(lForearmGeo, woodMat);
    lForearmMesh.position.y = -0.22;
    this.leftForearm.add(lForearmMesh);
    this.leftArm.add(this.leftForearm);

    // Right Arm
    this.rightArm.position.set(-0.48, 0.72, 0);
    const rShoulder = new THREE.Mesh(ballJointGeo, woodMat);
    this.rightArm.add(rShoulder);
    const rBicep = new THREE.Mesh(lBicepGeo, sweaterMat);
    rBicep.position.y = -0.25;
    this.rightArm.add(rBicep);

    this.rightForearm.position.set(0, -0.48, 0);
    const rElbow = new THREE.Mesh(ballJointGeo, woodMat);
    this.rightForearm.add(rElbow);
    const rForearmMesh = new THREE.Mesh(lForearmGeo, woodMat);
    rForearmMesh.position.y = -0.22;
    this.rightForearm.add(rForearmMesh);
    this.rightArm.add(this.rightForearm);

    // 5. Legs & Boots
    const thighGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.45, 8);
    const bootGeo = new THREE.BoxGeometry(0.24, 0.3, 0.4);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x5a2d0c, roughness: 0.6 });

    // Left Leg
    this.leftLeg.position.set(0.22, 0.7, 0);
    const lThigh = new THREE.Mesh(thighGeo, denimMat);
    lThigh.position.y = -0.22;
    this.leftLeg.add(lThigh);
    const lKnee = new THREE.Mesh(ballJointGeo, woodMat);
    lKnee.position.y = -0.45;
    this.leftLeg.add(lKnee);
    const lBoot = new THREE.Mesh(bootGeo, bootMat);
    lBoot.position.set(0, -0.65, 0.08);
    this.leftLeg.add(lBoot);

    // Right Leg
    this.rightLeg.position.set(-0.22, 0.7, 0);
    const rThigh = new THREE.Mesh(thighGeo, denimMat);
    rThigh.position.y = -0.22;
    this.rightLeg.add(rThigh);
    const rKnee = new THREE.Mesh(ballJointGeo, woodMat);
    rKnee.position.y = -0.45;
    this.rightLeg.add(rKnee);
    const rBoot = new THREE.Mesh(bootGeo, bootMat);
    rBoot.position.set(0, -0.65, 0.08);
    this.rightLeg.add(rBoot);

    // 6. May's Matchbox Backpack & Match Rifle
    this.backpack.position.set(0, 0.45, -0.28);
    const boxGeo = new THREE.BoxGeometry(0.42, 0.55, 0.22);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
    const matchbox = new THREE.Mesh(boxGeo, boxMat);
    this.backpack.add(matchbox);

    // Match heads sticking out of box
    for (let i = 0; i < 3; i++) {
      const matchStickGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6);
      const matchStick = new THREE.Mesh(matchStickGeo, woodMat);
      matchStick.position.set((i - 1) * 0.1, 0.32, 0);
      const matchHeadGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const matchHeadMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
      const matchHead = new THREE.Mesh(matchHeadGeo, matchHeadMat);
      matchHead.position.y = 0.16;
      matchStick.add(matchHead);
      this.backpack.add(matchStick);
    }
    this.torso.add(this.backpack);

    // May's Match Rifle in hands
    this.weaponMesh.position.set(0.3, 0.35, 0.35);
    const rifleBarrelGeo = new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8);
    const rifleStockGeo = new THREE.BoxGeometry(0.12, 0.22, 0.35);
    const barrel = new THREE.Mesh(rifleBarrelGeo, brassMat);
    barrel.rotation.x = Math.PI / 2;
    const stock = new THREE.Mesh(rifleStockGeo, woodMat);
    stock.position.z = -0.4;
    this.weaponMesh.add(barrel, stock);

    // Glowing tip
    const tipGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.z = 0.65;
    this.weaponMesh.add(tip);

    this.torso.add(this.weaponMesh);
    this.pelvis.add(this.torso);
    this.pelvis.add(this.head);
    this.pelvis.add(this.leftArm);
    this.pelvis.add(this.rightArm);
    this.pelvis.add(this.leftLeg);
    this.pelvis.add(this.rightLeg);
  }

  private buildStylizedCody(): void {
    const clayTex = TextureFactory.createClayTexture();
    const brassTex = TextureFactory.createBrassTexture();

    const clayGreenMat = new THREE.MeshStandardMaterial({
      map: clayTex,
      color: 0x38b000,
      roughness: 0.65,
    });

    const clayJacketMat = new THREE.MeshStandardMaterial({
      color: 0x9e2a2b, // rustic red/maroon clay sweater
      roughness: 0.75,
    });

    const clayPantsMat = new THREE.MeshStandardMaterial({
      color: 0x546e7a,
      roughness: 0.8,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      map: brassTex,
      metalness: 0.85,
      roughness: 0.25,
    });

    // 1. Pelvis & Trousers
    const pelvisGeo = new THREE.BoxGeometry(0.75, 0.48, 0.58);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, clayPantsMat);
    pelvisMesh.position.y = 0.9;
    pelvisMesh.castShadow = true;
    this.pelvis.add(pelvisMesh);

    // 2. Torso (Clay Knit Jacket)
    this.torso.position.set(0, 0.26, 0);
    const torsoGeo = new THREE.CylinderGeometry(0.44, 0.4, 0.8, 16);
    const torsoMesh = new THREE.Mesh(torsoGeo, clayJacketMat);
    torsoMesh.position.y = 0.45;
    torsoMesh.castShadow = true;
    this.torso.add(torsoMesh);

    // Leaf collar lapels
    const leafGeo = new THREE.ConeGeometry(0.14, 0.4, 6);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.5 });
    const leafL = new THREE.Mesh(leafGeo, leafMat);
    leafL.position.set(0.18, 0.7, 0.25);
    leafL.rotation.z = -0.3;
    const leafR = new THREE.Mesh(leafGeo, leafMat);
    leafR.position.set(-0.18, 0.7, 0.25);
    leafR.rotation.z = 0.3;
    this.torso.add(leafL, leafR);

    // 3. Head & Botanical Sprout Hair
    this.head.position.set(0, 0.98, 0);

    const headGeo = new THREE.SphereGeometry(0.46, 20, 20);
    const headMesh = new THREE.Mesh(headGeo, clayGreenMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Clay nose
    const noseGeo = new THREE.SphereGeometry(0.1, 10, 10);
    const nose = new THREE.Mesh(noseGeo, clayGreenMat);
    nose.position.set(0, 0.02, 0.45);
    this.head.add(nose);

    // Eyes
    const eyeWhiteGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x1b4332 });

    const eyeLW = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeLW.position.set(0.17, 0.08, 0.38);
    const eyeLP = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    eyeLP.position.set(0.19, 0.09, 0.47);
    this.head.add(eyeLW, eyeLP);

    const eyeRW = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeRW.position.set(-0.17, 0.08, 0.38);
    const eyeRP = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    eyeRP.position.set(-0.19, 0.09, 0.47);
    this.head.add(eyeRW, eyeRP);

    // Brass Goggles rested on forehead
    const goggleFrameGeo = new THREE.TorusGeometry(0.16, 0.04, 8, 16);
    const goggleL = new THREE.Mesh(goggleFrameGeo, brassMat);
    goggleL.position.set(0.2, 0.3, 0.38);
    const goggleR = new THREE.Mesh(goggleFrameGeo, brassMat);
    goggleR.position.set(-0.2, 0.3, 0.38);
    this.head.add(goggleL, goggleR);

    // Botanical leafy sprout hair tuft
    const sproutStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
    const sproutStem = new THREE.Mesh(sproutStemGeo, leafMat);
    sproutStem.position.set(0, 0.55, 0);
    sproutStem.rotation.z = 0.15;
    this.head.add(sproutStem);

    for (let i = 0; i < 3; i++) {
      const petalGeo = new THREE.ConeGeometry(0.16, 0.45, 6);
      const petal = new THREE.Mesh(petalGeo, leafMat);
      petal.position.set(Math.cos(i * 2.1) * 0.15, 0.75, Math.sin(i * 2.1) * 0.15);
      petal.rotation.z = Math.cos(i * 2.1) * 0.5;
      petal.rotation.x = Math.sin(i * 2.1) * 0.5;
      this.head.add(petal);
    }

    // 4. Arms & Hands
    const armGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.48, 8);
    const handGeo = new THREE.SphereGeometry(0.12, 8, 8);

    // Left Arm
    this.leftArm.position.set(0.52, 0.72, 0);
    const lBicep = new THREE.Mesh(armGeo, clayJacketMat);
    lBicep.position.y = -0.26;
    this.leftArm.add(lBicep);
    this.leftForearm.position.set(0, -0.5, 0);
    const lForearm = new THREE.Mesh(armGeo, clayGreenMat);
    lForearm.position.y = -0.24;
    const lHand = new THREE.Mesh(handGeo, clayGreenMat);
    lHand.position.y = -0.48;
    this.leftForearm.add(lForearm, lHand);
    this.leftArm.add(this.leftForearm);

    // Right Arm
    this.rightArm.position.set(-0.52, 0.72, 0);
    const rBicep = new THREE.Mesh(armGeo, clayJacketMat);
    rBicep.position.y = -0.26;
    this.rightArm.add(rBicep);
    this.rightForearm.position.set(0, -0.5, 0);
    const rForearm = new THREE.Mesh(armGeo, clayGreenMat);
    rForearm.position.y = -0.24;
    const rHand = new THREE.Mesh(handGeo, clayGreenMat);
    rHand.position.y = -0.48;
    this.rightForearm.add(rForearm, rHand);
    this.rightArm.add(this.rightForearm);

    // 5. Legs & Boots
    const thighGeo = new THREE.CylinderGeometry(0.16, 0.15, 0.48, 8);
    const bootGeo = new THREE.BoxGeometry(0.26, 0.32, 0.44);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x3d2614, roughness: 0.7 });

    this.leftLeg.position.set(0.24, 0.7, 0);
    const lThigh = new THREE.Mesh(thighGeo, clayPantsMat);
    lThigh.position.y = -0.24;
    const lBoot = new THREE.Mesh(bootGeo, bootMat);
    lBoot.position.set(0, -0.65, 0.08);
    this.leftLeg.add(lThigh, lBoot);

    this.rightLeg.position.set(-0.24, 0.7, 0);
    const rThigh = new THREE.Mesh(thighGeo, clayPantsMat);
    rThigh.position.y = -0.24;
    const rBoot = new THREE.Mesh(bootGeo, bootMat);
    rBoot.position.set(0, -0.65, 0.08);
    this.rightLeg.add(rThigh, rBoot);

    // 6. Cody's Sap Cannon Weapon & Tank Backpack
    this.backpack.position.set(0, 0.45, -0.32);

    // Pressure canister tank
    const tankGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.75, 16);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6,
      ior: 1.4,
    });
    const tank = new THREE.Mesh(tankGeo, glassMat);
    this.backpack.add(tank);

    // Brass fittings on tank
    const ringGeo = new THREE.TorusGeometry(0.26, 0.04, 8, 16);
    const ring1 = new THREE.Mesh(ringGeo, brassMat);
    ring1.position.y = 0.25;
    ring1.rotation.x = Math.PI / 2;
    const ring2 = new THREE.Mesh(ringGeo, brassMat);
    ring2.position.y = -0.25;
    ring2.rotation.x = Math.PI / 2;
    this.backpack.add(ring1, ring2);
    this.torso.add(this.backpack);

    // Cody's Sap Gun Nozzle in hand
    this.weaponMesh.position.set(0.32, 0.35, 0.35);
    const nozzleBodyGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.6, 12);
    const nozzleBody = new THREE.Mesh(nozzleBodyGeo, brassMat);
    nozzleBody.rotation.x = Math.PI / 2;

    const amberTipGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const amberTipMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const amberTip = new THREE.Mesh(amberTipGeo, amberTipMat);
    amberTip.position.z = 0.35;
    this.weaponMesh.add(nozzleBody, amberTip);

    this.torso.add(this.weaponMesh);
    this.pelvis.add(this.torso);
    this.pelvis.add(this.head);
    this.pelvis.add(this.leftArm);
    this.pelvis.add(this.rightArm);
    this.pelvis.add(this.leftLeg);
    this.pelvis.add(this.rightLeg);
  }

  public updateAnimation(dt: number): void {
    if (this.isMoving) {
      this.walkTime += dt * 10;
      const legSwing = Math.sin(this.walkTime) * 0.55;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      this.leftArm.rotation.x = -legSwing * 0.75;
      this.rightArm.rotation.x = legSwing * 0.75;
      this.torso.position.y = 0.25 + Math.abs(Math.sin(this.walkTime)) * 0.06;
    } else {
      this.leftLeg.rotation.x *= 0.82;
      this.rightLeg.rotation.x *= 0.82;
      this.leftArm.rotation.x *= 0.82;
      this.rightArm.rotation.x *= 0.82;
      this.torso.position.y = 0.25;
    }

    if (this.isJumping) {
      this.leftLeg.rotation.x = 0.35;
      this.rightLeg.rotation.x = 0.35;
      this.leftArm.rotation.x = -0.55;
      this.rightArm.rotation.x = -0.55;
    }

    this.group.position.copy(this.pos);
    this.group.rotation.y = this.facingAngle;
  }
}
