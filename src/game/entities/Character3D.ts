import * as THREE from 'three';
import { TextureFactory } from '../../core/rendering/TextureFactory.js';

export class Character3D {
  public group: THREE.Group;
  public type: 'cody' | 'may';

  // Body parts for procedural animation
  public torso: THREE.Mesh;
  public head: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public weaponMesh: THREE.Group;

  // Animation cycle
  private walkTime = 0;
  public isMoving = false;
  public isJumping = false;
  public facingAngle = 0;

  // Kinematic state
  public pos = new THREE.Vector3();
  public vel = new THREE.Vector3();

  constructor(type: 'cody' | 'may', startPos: THREE.Vector3) {
    this.type = type;
    this.group = new THREE.Group();
    this.pos.copy(startPos);
    this.group.position.copy(startPos);

    if (type === 'cody') {
      const { torso, head, leftArm, rightArm, leftLeg, rightLeg, weapon } = this.buildCody();
      this.torso = torso;
      this.head = head;
      this.leftArm = leftArm;
      this.rightArm = rightArm;
      this.leftLeg = leftLeg;
      this.rightLeg = rightLeg;
      this.weaponMesh = weapon;
    } else {
      const { torso, head, leftArm, rightArm, leftLeg, rightLeg, weapon } = this.buildMay();
      this.torso = torso;
      this.head = head;
      this.leftArm = leftArm;
      this.rightArm = rightArm;
      this.leftLeg = leftLeg;
      this.rightLeg = rightLeg;
      this.weaponMesh = weapon;
    }

    this.group.add(this.torso);
    this.group.add(this.head);
    this.group.add(this.leftArm);
    this.group.add(this.rightArm);
    this.group.add(this.leftLeg);
    this.group.add(this.rightLeg);
    this.group.add(this.weaponMesh);
  }

  private buildCody() {
    const clayTex = TextureFactory.createClayTexture();

    // Torso (Clay green chunky body)
    const torsoGeo = new THREE.CylinderGeometry(0.5, 0.45, 1.1, 16);
    const torsoMat = new THREE.MeshStandardMaterial({
      map: clayTex,
      color: 0x449933,
      roughness: 0.7,
      metalness: 0.1,
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.0;
    torso.castShadow = true;

    // Head
    const head = new THREE.Group();
    head.position.set(0, 1.8, 0);

    const headGeo = new THREE.SphereGeometry(0.48, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      map: clayTex,
      color: 0x55aa44,
      roughness: 0.65,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Leaf hair sprout on top
    const leafGeo = new THREE.ConeGeometry(0.18, 0.5, 8);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x228822, roughness: 0.5 });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0, 0.55, 0);
    leaf.rotation.z = 0.2;
    head.add(leaf);

    // Big stylized eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.2, 0.08, 0.42);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(-0.2, 0.08, 0.42);
    head.add(eyeL, eyeR);

    // Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0x449933, roughness: 0.7 });
    const armGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.7, 8);

    const leftArm = new THREE.Group();
    leftArm.position.set(0.65, 1.4, 0);
    const lMesh = new THREE.Mesh(armGeo, armMat);
    lMesh.position.y = -0.35;
    leftArm.add(lMesh);

    const rightArm = new THREE.Group();
    rightArm.position.set(-0.65, 1.4, 0);
    const rMesh = new THREE.Mesh(armGeo, armMat);
    rMesh.position.y = -0.35;
    rightArm.add(rMesh);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.75, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x336622, roughness: 0.8 });

    const leftLeg = new THREE.Group();
    leftLeg.position.set(0.26, 0.75, 0);
    const llMesh = new THREE.Mesh(legGeo, legMat);
    llMesh.position.y = -0.35;
    leftLeg.add(llMesh);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(-0.26, 0.75, 0);
    const rlMesh = new THREE.Mesh(legGeo, legMat);
    rlMesh.position.y = -0.35;
    rightLeg.add(rlMesh);

    // Cody's Sap Cannon Weapon
    const weapon = new THREE.Group();
    weapon.position.set(0.4, 1.1, 0.4);

    const tankGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.8, 12);
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 0.3,
      roughness: 0.2,
      emissive: 0x774400,
    });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.rotation.x = Math.PI / 2;
    weapon.add(tank);

    const nozzleGeo = new THREE.ConeGeometry(0.14, 0.35, 12);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.z = 0.55;
    nozzle.rotation.x = Math.PI / 2;
    weapon.add(nozzle);

    return { torso, head, leftArm, rightArm, leftLeg, rightLeg, weapon };
  }

  private buildMay() {
    const yarnTex = TextureFactory.createYarnTexture();
    const woodTex = TextureFactory.createWoodTexture();

    // Torso (Denim fabric overalls with striped knit shirt)
    const torsoGeo = new THREE.CylinderGeometry(0.42, 0.38, 1.05, 16);
    const torsoMat = new THREE.MeshStandardMaterial({
      map: yarnTex,
      color: 0x2b4c8c,
      roughness: 0.8,
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.0;
    torso.castShadow = true;

    // Head
    const head = new THREE.Group();
    head.position.set(0, 1.75, 0);

    const headGeo = new THREE.SphereGeometry(0.44, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xddaa88,
      roughness: 0.6,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Blue yarn hair braids / ponytail loops
    const hairGeo = new THREE.TorusGeometry(0.28, 0.12, 8, 16);
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1f66d1,
      roughness: 0.85,
    });
    const braidL = new THREE.Mesh(hairGeo, hairMat);
    braidL.position.set(0.35, 0.3, -0.1);
    braidL.rotation.y = 0.4;
    const braidR = new THREE.Mesh(hairGeo, hairMat);
    braidR.position.set(-0.35, 0.3, -0.1);
    braidR.rotation.y = -0.4;
    head.add(braidL, braidR);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.18, 0.08, 0.39);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(-0.18, 0.08, 0.39);
    head.add(eyeL, eyeR);

    // Wooden jointed arms
    const woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xd29b68,
      roughness: 0.5,
    });
    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.65, 8);

    const leftArm = new THREE.Group();
    leftArm.position.set(0.55, 1.35, 0);
    const lMesh = new THREE.Mesh(armGeo, woodMat);
    lMesh.position.y = -0.32;
    leftArm.add(lMesh);

    const rightArm = new THREE.Group();
    rightArm.position.set(-0.55, 1.35, 0);
    const rMesh = new THREE.Mesh(armGeo, woodMat);
    rMesh.position.y = -0.32;
    rightArm.add(rMesh);

    // Wooden jointed legs
    const legGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.7, 8);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(0.24, 0.7, 0);
    const llMesh = new THREE.Mesh(legGeo, woodMat);
    llMesh.position.y = -0.35;
    leftLeg.add(llMesh);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(-0.24, 0.7, 0);
    const rlMesh = new THREE.Mesh(legGeo, woodMat);
    rlMesh.position.y = -0.35;
    rightLeg.add(rlMesh);

    // May's Match Rifle / Heavy Hammerhead
    const weapon = new THREE.Group();
    weapon.position.set(0.4, 1.05, 0.4);

    const barrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x884422, roughness: 0.4 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    weapon.add(barrel);

    const headHammerGeo = new THREE.BoxGeometry(0.3, 0.4, 0.3);
    const hammerMat = new THREE.MeshStandardMaterial({ color: 0x2288cc, metalness: 0.6, roughness: 0.3 });
    const hammer = new THREE.Mesh(headHammerGeo, hammerMat);
    hammer.position.z = 0.55;
    weapon.add(hammer);

    return { torso, head, leftArm, rightArm, leftLeg, rightLeg, weapon };
  }

  public updateAnimation(dt: number): void {
    if (this.isMoving) {
      this.walkTime += dt * 10;
      const legSwing = Math.sin(this.walkTime) * 0.55;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      this.leftArm.rotation.x = -legSwing * 0.8;
      this.rightArm.rotation.x = legSwing * 0.8;
      this.torso.position.y = 1.0 + Math.abs(Math.sin(this.walkTime)) * 0.08;
    } else {
      this.leftLeg.rotation.x *= 0.85;
      this.rightLeg.rotation.x *= 0.85;
      this.leftArm.rotation.x *= 0.85;
      this.rightArm.rotation.x *= 0.85;
      this.torso.position.y = 1.0;
    }

    if (this.isJumping) {
      this.leftLeg.rotation.x = 0.3;
      this.rightLeg.rotation.x = 0.3;
      this.leftArm.rotation.x = -0.6;
      this.rightArm.rotation.x = -0.6;
    }

    this.group.position.copy(this.pos);
    this.group.rotation.y = this.facingAngle;
  }
}
