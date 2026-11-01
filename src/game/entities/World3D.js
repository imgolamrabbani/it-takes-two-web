import * as THREE from 'three';
import { TextureFactory } from '../../core/rendering/TextureFactory.js';
export class World3D {
    scene;
    colliders = [];
    gears = [];
    pendulumGroup = null;
    boss = null;
    constructor(scene, stage) {
        this.scene = scene;
        this.buildLighting();
        if (stage === 1 || stage === 2) {
            this.buildClockworkStage();
        }
        else {
            this.buildSapBossArena();
        }
    }
    buildLighting() {
        // Ambient light with warm copper tone
        const ambient = new THREE.AmbientLight(0xffeedd, 0.65);
        this.scene.add(ambient);
        // Warm Sun / Clock Face directional backlight
        const dirLight = new THREE.DirectionalLight(0xffb703, 1.8);
        dirLight.position.set(0, 25, -20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 80;
        dirLight.shadow.camera.left = -25;
        dirLight.shadow.camera.right = 25;
        dirLight.shadow.camera.top = 25;
        dirLight.shadow.camera.bottom = -25;
        this.scene.add(dirLight);
        // Atmospheric Fog
        this.scene.fog = new THREE.FogExp2(0x110c08, 0.018);
    }
    buildClockworkStage() {
        const woodTex = TextureFactory.createWoodTexture();
        const brassTex = TextureFactory.createBrassTexture();
        // 1. Massive Floor Planks
        const floorGeo = new THREE.BoxGeometry(60, 1.5, 40);
        const floorMat = new THREE.MeshStandardMaterial({
            map: woodTex,
            roughness: 0.8,
            metalness: 0.1,
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(0, -0.75, 0);
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.colliders.push(new THREE.Box3().setFromObject(floor));
        // 2. Giant Backlit Clock Face (Direct from User Reference 3)
        const clockFaceGeo = new THREE.CylinderGeometry(14, 14, 0.8, 32);
        const clockFaceMat = new THREE.MeshStandardMaterial({
            color: 0xffe082,
            emissive: 0xffaa00,
            emissiveIntensity: 0.7,
            roughness: 0.3,
        });
        const clockFace = new THREE.Mesh(clockFaceGeo, clockFaceMat);
        clockFace.position.set(0, 18, -18);
        clockFace.rotation.x = Math.PI / 2;
        this.scene.add(clockFace);
        // 3. Rotating Giant Brass Clockwork Gears
        const gear1 = this.createGear(5.5, 16, brassTex);
        gear1.position.set(-12, 16, -14);
        this.scene.add(gear1);
        this.gears.push({ mesh: gear1, speed: 0.4 });
        const gear2 = this.createGear(4.0, 12, brassTex);
        gear2.position.set(12, 14, -13);
        this.scene.add(gear2);
        this.gears.push({ mesh: gear2, speed: -0.6 });
        const gear3 = this.createGear(7.0, 20, brassTex);
        gear3.position.set(0, 26, -15);
        this.scene.add(gear3);
        this.gears.push({ mesh: gear3, speed: 0.25 });
        // 4. Giant Swinging Pendulum with Lyre Structure (User Reference 3)
        this.pendulumGroup = new THREE.Group();
        this.pendulumGroup.position.set(0, 24, -12);
        const shaftGeo = new THREE.CylinderGeometry(0.2, 0.2, 18, 12);
        const shaftMat = new THREE.MeshStandardMaterial({ map: brassTex, metalness: 0.8, roughness: 0.3 });
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        shaft.position.y = -9;
        this.pendulumGroup.add(shaft);
        const bobGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.8, 24);
        const bob = new THREE.Mesh(bobGeo, shaftMat);
        bob.position.y = -17;
        bob.rotation.x = Math.PI / 2;
        this.pendulumGroup.add(bob);
        this.scene.add(this.pendulumGroup);
        // 5. Stepping Bridges & Platforms
        const bridge1Geo = new THREE.BoxGeometry(10, 0.8, 6);
        const bridge1 = new THREE.Mesh(bridge1Geo, floorMat);
        bridge1.position.set(-8, 3.5, -4);
        bridge1.castShadow = true;
        bridge1.receiveShadow = true;
        this.scene.add(bridge1);
        this.colliders.push(new THREE.Box3().setFromObject(bridge1));
        const bridge2Geo = new THREE.BoxGeometry(12, 0.8, 6);
        const bridge2 = new THREE.Mesh(bridge2Geo, floorMat);
        bridge2.position.set(8, 6.5, -4);
        bridge2.castShadow = true;
        bridge2.receiveShadow = true;
        this.scene.add(bridge2);
        this.colliders.push(new THREE.Box3().setFromObject(bridge2));
        // Wooden targets for Cody's Sap & May's Matches
        this.createTargetWall(new THREE.Vector3(-14, 4.5, -8));
        this.createTargetWall(new THREE.Vector3(14, 7.5, -8));
    }
    buildSapBossArena() {
        const woodTex = TextureFactory.createWoodTexture();
        const brassTex = TextureFactory.createBrassTexture();
        // Cavern Arena Floor
        const floorGeo = new THREE.CylinderGeometry(26, 26, 1.5, 32);
        const floorMat = new THREE.MeshStandardMaterial({
            map: woodTex,
            roughness: 0.85,
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(0, -0.75, 0);
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.colliders.push(new THREE.Box3().setFromObject(floor));
        // Arena Perimeter Fence / Splintered Wood
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const px = Math.cos(angle) * 23;
            const pz = Math.sin(angle) * 23;
            const postGeo = new THREE.BoxGeometry(0.6, 3.5, 0.6);
            const post = new THREE.Mesh(postGeo, floorMat);
            post.position.set(px, 1.5, pz);
            this.scene.add(post);
            this.colliders.push(new THREE.Box3().setFromObject(post));
        }
        // Target Bulls-eyes around arena
        this.createTargetWall(new THREE.Vector3(-15, 3, -12));
        this.createTargetWall(new THREE.Vector3(15, 3, -12));
        // 3D Boss: The Deranged Toolbox
        this.buildBossToolbox(brassTex, woodTex);
    }
    buildBossToolbox(brassTex, woodTex) {
        const bossGroup = new THREE.Group();
        bossGroup.position.set(0, 0, -14);
        // Main Heavy Timber Toolbox Body
        const bodyGeo = new THREE.BoxGeometry(10, 7, 6);
        const bodyMat = new THREE.MeshStandardMaterial({
            map: woodTex,
            color: 0x803a18,
            roughness: 0.7,
            metalness: 0.2,
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 3.5;
        bodyMesh.castShadow = true;
        bossGroup.add(bodyMesh);
        // Brass Corner Plates & Hinges
        const hingeGeo = new THREE.BoxGeometry(10.4, 0.6, 6.4);
        const hingeMat = new THREE.MeshStandardMaterial({ map: brassTex, metalness: 0.8, roughness: 0.3 });
        const hinge = new THREE.Mesh(hingeGeo, hingeMat);
        hinge.position.y = 5.5;
        bossGroup.add(hinge);
        // Menacing Glowing Red Eyes
        const eyeGeo = new THREE.BoxGeometry(1.6, 0.8, 0.3);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
        const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
        eyeLeft.position.set(-2.2, 4.2, 3.05);
        const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
        eyeRight.position.set(2.2, 4.2, 3.05);
        bossGroup.add(eyeLeft, eyeRight);
        // Articulated Wooden Slamming Fist / Arm
        const slammingArm = new THREE.Group();
        slammingArm.position.set(0, 6, 4);
        const armSegmentGeo = new THREE.BoxGeometry(2.5, 2.5, 9);
        const armSegment = new THREE.Mesh(armSegmentGeo, bodyMat);
        armSegment.position.z = 4.5;
        armSegment.castShadow = true;
        slammingArm.add(armSegment);
        // Glowing Power Module on Arm (Target for May & Cody!)
        const moduleGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.6, 16);
        const moduleMat = new THREE.MeshStandardMaterial({
            color: 0x00f5d4,
            emissive: 0x00f5d4,
            emissiveIntensity: 0.9,
        });
        const armTargetModule = new THREE.Mesh(moduleGeo, moduleMat);
        armTargetModule.position.set(0, 1.4, 6.5);
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
    createGear(radius, teethCount, brassTex) {
        const gear = new THREE.Group();
        // Central disc
        const discGeo = new THREE.CylinderGeometry(radius, radius, 0.6, 32);
        const mat = new THREE.MeshStandardMaterial({
            map: brassTex,
            metalness: 0.85,
            roughness: 0.25,
        });
        const disc = new THREE.Mesh(discGeo, mat);
        disc.rotation.x = Math.PI / 2;
        disc.castShadow = true;
        gear.add(disc);
        // Teeth
        const toothGeo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
        for (let i = 0; i < teethCount; i++) {
            const angle = (i / teethCount) * Math.PI * 2;
            const tooth = new THREE.Mesh(toothGeo, mat);
            tooth.position.set(Math.cos(angle) * (radius + 0.4), Math.sin(angle) * (radius + 0.4), 0);
            tooth.rotation.z = angle;
            gear.add(tooth);
        }
        return gear;
    }
    createTargetWall(pos) {
        const targetGroup = new THREE.Group();
        targetGroup.position.copy(pos);
        const boardGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.4, 24);
        const boardMat = new THREE.MeshStandardMaterial({
            color: 0xcc8833,
            roughness: 0.8,
        });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.rotation.x = Math.PI / 2;
        targetGroup.add(board);
        // Bullseye Ring
        const ringGeo = new THREE.TorusGeometry(1.4, 0.2, 8, 24);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xff0044, roughness: 0.5 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        targetGroup.add(ring);
        this.scene.add(targetGroup);
        this.colliders.push(new THREE.Box3().setFromObject(targetGroup));
    }
    update(dt, time) {
        // 1. Rotate clockwork gears
        for (const g of this.gears) {
            g.mesh.rotation.z += g.speed * dt;
        }
        // 2. Swing pendulum
        if (this.pendulumGroup) {
            this.pendulumGroup.rotation.z = Math.sin(time * 1.8) * 0.45;
        }
        // 3. Update Boss Animation
        if (this.boss && this.boss.hp > 0) {
            this.boss.armTimer -= dt;
            const { slammingArm } = this.boss;
            switch (this.boss.armState) {
                case 'idle':
                    slammingArm.rotation.x = Math.sin(time * 2.0) * 0.1;
                    if (this.boss.armTimer <= 0) {
                        this.boss.armState = 'raising';
                        this.boss.armTimer = 1.0;
                    }
                    break;
                case 'raising':
                    slammingArm.rotation.x += 1.6 * dt;
                    if (this.boss.armTimer <= 0) {
                        this.boss.armState = 'slamming';
                        this.boss.armTimer = 0.3;
                    }
                    break;
                case 'slamming':
                    slammingArm.rotation.x -= 5.0 * dt;
                    if (slammingArm.rotation.x <= -0.5 || this.boss.armTimer <= 0) {
                        slammingArm.rotation.x = -0.5;
                        this.boss.armState = 'recovering';
                        this.boss.armTimer = 2.4;
                    }
                    break;
                case 'recovering':
                    slammingArm.rotation.x += (0 - slammingArm.rotation.x) * 2.5 * dt;
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
