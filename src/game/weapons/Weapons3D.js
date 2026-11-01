import * as THREE from 'three';
export class Weapons3D {
    scene;
    sapGlobs = [];
    matchDarts = [];
    explosions = [];
    // Particle sparks
    sparkGeo;
    sparkMat;
    sparkPoints;
    sparkPositions;
    sparkVelocities;
    sparkCount = 300;
    constructor(scene) {
        this.scene = scene;
        // Initialize GPU spark particles
        this.sparkGeo = new THREE.BufferGeometry();
        this.sparkPositions = new Float32Array(this.sparkCount * 3);
        this.sparkVelocities = new Float32Array(this.sparkCount * 3);
        for (let i = 0; i < this.sparkCount; i++) {
            this.sparkPositions[i * 3 + 1] = -100; // inactive below floor
        }
        this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
        this.sparkMat = new THREE.PointsMaterial({
            color: 0xff8800,
            size: 0.25,
            blending: THREE.AdditiveBlending,
            transparent: true,
        });
        this.sparkPoints = new THREE.Points(this.sparkGeo, this.sparkMat);
        this.scene.add(this.sparkPoints);
    }
    fireSap(origin, dir) {
        const geo = new THREE.SphereGeometry(0.35, 12, 12);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            roughness: 0.1,
            metalness: 0.2,
            emissive: 0xff7700,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.9,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(origin);
        this.scene.add(mesh);
        const speed = 26;
        const vel = dir.clone().normalize().multiplyScalar(speed);
        vel.y += 2.0; // slight arc
        this.sapGlobs.push({
            mesh,
            pos: origin.clone(),
            vel,
            isStuck: false,
            size: 0.35,
        });
        if (this.sapGlobs.length > 20) {
            const old = this.sapGlobs.shift();
            if (old)
                this.scene.remove(old.mesh);
        }
    }
    fireMatch(origin, dir) {
        const geo = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xff2200,
            emissive: 0xff5500,
            emissiveIntensity: 0.9,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(origin);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        this.scene.add(mesh);
        const speed = 40;
        const vel = dir.clone().normalize().multiplyScalar(speed);
        this.matchDarts.push({
            mesh,
            pos: origin.clone(),
            vel,
            life: 2.5,
        });
    }
    triggerExplosion(pos) {
        // Glowing expanding fireball sphere
        const geo = new THREE.SphereGeometry(1.0, 16, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        this.scene.add(mesh);
        // Dynamic point light flash
        const light = new THREE.PointLight(0xff7700, 15, 25);
        light.position.copy(pos);
        this.scene.add(light);
        this.explosions.push({
            mesh,
            light,
            pos: pos.clone(),
            radius: 1.0,
            maxRadius: 6.5,
            life: 0.45,
        });
        // Spawn sparks
        for (let i = 0; i < 60; i++) {
            const idx = Math.floor(Math.random() * this.sparkCount);
            this.sparkPositions[idx * 3] = pos.x;
            this.sparkPositions[idx * 3 + 1] = pos.y;
            this.sparkPositions[idx * 3 + 2] = pos.z;
            this.sparkVelocities[idx * 3] = (Math.random() - 0.5) * 22;
            this.sparkVelocities[idx * 3 + 1] = Math.random() * 20 + 4;
            this.sparkVelocities[idx * 3 + 2] = (Math.random() - 0.5) * 22;
        }
    }
    update(dt, obstacleColliders) {
        let detonatedCount = 0;
        // Update Sap Globs
        for (let i = this.sapGlobs.length - 1; i >= 0; i--) {
            const sap = this.sapGlobs[i];
            if (!sap.isStuck) {
                sap.vel.y -= 14 * dt; // Gravity
                sap.pos.addScaledVector(sap.vel, dt);
                sap.mesh.position.copy(sap.pos);
                // Ground hit
                if (sap.pos.y <= 0.3) {
                    sap.pos.y = 0.3;
                    sap.isStuck = true;
                    sap.vel.set(0, 0, 0);
                    sap.mesh.scale.set(1.4, 0.4, 1.4); // flatten
                }
                // Collision with obstacles
                for (const box of obstacleColliders) {
                    if (box.containsPoint(sap.pos)) {
                        sap.isStuck = true;
                        sap.vel.set(0, 0, 0);
                        sap.mesh.scale.set(1.3, 0.5, 1.3);
                        break;
                    }
                }
            }
        }
        // Update Match Darts
        for (let i = this.matchDarts.length - 1; i >= 0; i--) {
            const dart = this.matchDarts[i];
            dart.life -= dt;
            dart.pos.addScaledVector(dart.vel, dt);
            dart.mesh.position.copy(dart.pos);
            let hit = false;
            // Check collision with any stuck or flying sap glob!
            for (let s = this.sapGlobs.length - 1; s >= 0; s--) {
                const sap = this.sapGlobs[s];
                if (dart.pos.distanceTo(sap.pos) < sap.size + 0.8) {
                    // DETONATE SAP!
                    this.triggerExplosion(sap.pos);
                    this.scene.remove(sap.mesh);
                    this.sapGlobs.splice(s, 1);
                    detonatedCount++;
                    hit = true;
                    break;
                }
            }
            // Check collision with obstacles or ground
            if (!hit) {
                if (dart.pos.y <= 0.1) {
                    hit = true;
                }
                else {
                    for (const box of obstacleColliders) {
                        if (box.containsPoint(dart.pos)) {
                            hit = true;
                            break;
                        }
                    }
                }
            }
            if (hit || dart.life <= 0) {
                this.scene.remove(dart.mesh);
                this.matchDarts.splice(i, 1);
            }
        }
        // Update Explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.life -= dt;
            exp.radius += (exp.maxRadius - exp.radius) * 8 * dt;
            exp.mesh.scale.setScalar(exp.radius);
            exp.mesh.material.opacity = Math.max(0, exp.life / 0.45);
            exp.light.intensity = (exp.life / 0.45) * 15;
            if (exp.life <= 0) {
                this.scene.remove(exp.mesh);
                this.scene.remove(exp.light);
                this.explosions.splice(i, 1);
            }
        }
        // Update sparks
        const posArr = this.sparkPositions;
        const velArr = this.sparkVelocities;
        for (let i = 0; i < this.sparkCount; i++) {
            if (posArr[i * 3 + 1] > -50) {
                velArr[i * 3 + 1] -= 22 * dt; // Gravity
                posArr[i * 3] += velArr[i * 3] * dt;
                posArr[i * 3 + 1] += velArr[i * 3 + 1] * dt;
                posArr[i * 3 + 2] += velArr[i * 3 + 2] * dt;
                if (posArr[i * 3 + 1] < 0) {
                    posArr[i * 3 + 1] = -100; // inactive
                }
            }
        }
        this.sparkGeo.attributes.position.needsUpdate = true;
        return { detonatedCount };
    }
}
