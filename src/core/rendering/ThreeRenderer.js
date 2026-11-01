import * as THREE from 'three';
export class ThreeRenderer {
    renderer;
    cameraMay;
    cameraCody;
    cameraShared;
    isSplitScreen = true;
    // Camera lerp positions
    mayCamPos = new THREE.Vector3(-5, 3.5, 6.5);
    codyCamPos = new THREE.Vector3(5, 3.5, 6.5);
    sharedCamPos = new THREE.Vector3(0, 6.0, 14.0);
    // Screen shake trauma
    trauma = 0;
    constructor(canvas) {
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
        this.renderer.toneMappingExposure = 1.25;
        this.renderer.autoClear = false; // essential for multi-viewport split-screen rendering
        // May's camera (Left)
        this.cameraMay = new THREE.PerspectiveCamera(55, (canvas.width / 2) / canvas.height, 0.1, 200);
        // Cody's camera (Right)
        this.cameraCody = new THREE.PerspectiveCamera(55, (canvas.width / 2) / canvas.height, 0.1, 200);
        // Cinematic Shared Camera (when toggled via V key)
        this.cameraShared = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.1, 200);
    }
    addTrauma(amount) {
        this.trauma = Math.min(1.0, this.trauma + amount);
    }
    toggleViewMode() {
        this.isSplitScreen = !this.isSplitScreen;
        return this.isSplitScreen;
    }
    render(scene, may, cody, dt) {
        // 1. Shake calculation
        let shakeX = 0;
        let shakeY = 0;
        if (this.trauma > 0) {
            const mag = this.trauma * this.trauma * 0.35;
            shakeX = (Math.random() - 0.5) * mag;
            shakeY = (Math.random() - 0.5) * mag;
            this.trauma = Math.max(0, this.trauma - 2.0 * dt);
        }
        const canvasW = this.renderer.domElement.width;
        const canvasH = this.renderer.domElement.height;
        // Clear entire frame once
        this.renderer.clear();
        if (this.isSplitScreen) {
            const halfW = Math.floor(canvasW / 2);
            // --- LEFT SCREEN: MAY (Behind May, looking towards -Z into the level) ---
            const mayTarget = new THREE.Vector3(may.pos.x + 0.4, may.pos.y + 2.8, may.pos.z + 5.8);
            this.mayCamPos.lerp(mayTarget, Math.min(1, 12 * dt));
            this.cameraMay.position.copy(this.mayCamPos);
            this.cameraMay.position.x += shakeX;
            this.cameraMay.position.y += shakeY;
            const mayLook = new THREE.Vector3(may.pos.x, may.pos.y + 1.8, may.pos.z - 12.0);
            this.cameraMay.lookAt(mayLook);
            this.renderer.setScissorTest(true);
            this.renderer.setViewport(0, 0, halfW, canvasH);
            this.renderer.setScissor(0, 0, halfW, canvasH);
            this.cameraMay.aspect = halfW / canvasH;
            this.cameraMay.updateProjectionMatrix();
            this.renderer.render(scene, this.cameraMay);
            // --- RIGHT SCREEN: CODY (Behind Cody, looking towards -Z into the level) ---
            const codyTarget = new THREE.Vector3(cody.pos.x + 0.4, cody.pos.y + 2.8, cody.pos.z + 5.8);
            this.codyCamPos.lerp(codyTarget, Math.min(1, 12 * dt));
            this.cameraCody.position.copy(this.codyCamPos);
            this.cameraCody.position.x += shakeX;
            this.cameraCody.position.y += shakeY;
            const codyLook = new THREE.Vector3(cody.pos.x, cody.pos.y + 1.8, cody.pos.z - 12.0);
            this.cameraCody.lookAt(codyLook);
            this.renderer.setViewport(halfW, 0, halfW, canvasH);
            this.renderer.setScissor(halfW, 0, halfW, canvasH);
            this.cameraCody.aspect = halfW / canvasH;
            this.cameraCody.updateProjectionMatrix();
            this.renderer.render(scene, this.cameraCody);
            this.renderer.setScissorTest(false);
        }
        else {
            // --- CINEMATIC SHARED CAMERA (Frames both Cody and May simultaneously) ---
            const midX = (may.pos.x + cody.pos.x) / 2;
            const midY = (may.pos.y + cody.pos.y) / 2;
            const dist = Math.max(10, may.pos.distanceTo(cody.pos));
            const sharedTarget = new THREE.Vector3(midX, midY + 4.5 + dist * 0.15, Math.max(may.pos.z, cody.pos.z) + 8.0 + dist * 0.4);
            this.sharedCamPos.lerp(sharedTarget, Math.min(1, 8 * dt));
            this.cameraShared.position.copy(this.sharedCamPos);
            this.cameraShared.position.x += shakeX;
            this.cameraShared.position.y += shakeY;
            this.cameraShared.lookAt(midX, midY + 1.5, -4.0);
            this.renderer.setViewport(0, 0, canvasW, canvasH);
            this.cameraShared.aspect = canvasW / canvasH;
            this.cameraShared.updateProjectionMatrix();
            this.renderer.render(scene, this.cameraShared);
        }
    }
    resize(width, height) {
        this.renderer.setSize(width, height, false);
    }
}
