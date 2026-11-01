export class InputManager {
    keysDown = new Set();
    keysPressedThisFrame = new Set();
    isCoopMode = true; // true = separate P1 / P2 controls; false = solo dual/swap
    soloActivePlayer = 'cody';
    bindings = {
        p1Left: ['KeyA'],
        p1Right: ['KeyD'],
        p1Up: ['KeyW'],
        p1Down: ['KeyS'],
        p1Jump: ['Space'],
        p1Action1: ['KeyF'],
        p1Action2: ['KeyR'],
        p2Left: ['ArrowLeft'],
        p2Right: ['ArrowRight'],
        p2Up: ['ArrowUp'],
        p2Down: ['ArrowDown'],
        p2Jump: ['Enter', 'Numpad0', 'ShiftRight'],
        p2Action1: ['KeyL', 'KeyM'],
        p2Action2: ['KeyK', 'ArrowDown'],
        pause: ['Escape', 'KeyP'],
        debug: ['Backquote', 'F3'],
        swapSolo: ['Tab'],
    };
    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', (e) => {
                if (!this.keysDown.has(e.code)) {
                    this.keysPressedThisFrame.add(e.code);
                }
                this.keysDown.add(e.code);
                // Prevent scrolling with arrows/space during game
                if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                    e.preventDefault();
                }
            });
            window.addEventListener('keyup', (e) => {
                this.keysDown.delete(e.code);
            });
        }
    }
    isAnyDown(codes) {
        return codes.some((code) => this.keysDown.has(code));
    }
    isAnyPressed(codes) {
        return codes.some((code) => this.keysPressedThisFrame.has(code));
    }
    isDebugToggled() {
        return this.isAnyPressed(this.bindings.debug);
    }
    isPauseToggled() {
        return this.isAnyPressed(this.bindings.pause);
    }
    isSwapSoloToggled() {
        return this.isAnyPressed(this.bindings.swapSolo);
    }
    getPlayerInputs() {
        let p1MoveX = 0;
        if (this.isAnyDown(this.bindings.p1Left))
            p1MoveX -= 1;
        if (this.isAnyDown(this.bindings.p1Right))
            p1MoveX += 1;
        let p1MoveY = 0;
        if (this.isAnyDown(this.bindings.p1Up))
            p1MoveY -= 1;
        if (this.isAnyDown(this.bindings.p1Down))
            p1MoveY += 1;
        let p2MoveX = 0;
        if (this.isAnyDown(this.bindings.p2Left))
            p2MoveX -= 1;
        if (this.isAnyDown(this.bindings.p2Right))
            p2MoveX += 1;
        let p2MoveY = 0;
        if (this.isAnyDown(this.bindings.p2Up))
            p2MoveY -= 1;
        if (this.isAnyDown(this.bindings.p2Down))
            p2MoveY += 1;
        // Check Gamepad
        this.pollGamepad(1, (gx, gy, jump, act1, act2) => {
            if (Math.abs(gx) > 0.15)
                p1MoveX = gx;
            if (Math.abs(gy) > 0.15)
                p1MoveY = gy;
        });
        const codyInput = {
            moveX: p1MoveX,
            moveY: p1MoveY,
            jump: this.isAnyDown(this.bindings.p1Jump),
            jumpPressed: this.isAnyPressed(this.bindings.p1Jump),
            action1: this.isAnyDown(this.bindings.p1Action1),
            action1Pressed: this.isAnyPressed(this.bindings.p1Action1),
            action2: this.isAnyDown(this.bindings.p1Action2),
            action2Pressed: this.isAnyPressed(this.bindings.p1Action2),
            interact: this.isAnyPressed(this.bindings.p1Up),
        };
        const mayInput = {
            moveX: p2MoveX,
            moveY: p2MoveY,
            jump: this.isAnyDown(this.bindings.p2Jump),
            jumpPressed: this.isAnyPressed(this.bindings.p2Jump),
            action1: this.isAnyDown(this.bindings.p2Action1),
            action1Pressed: this.isAnyPressed(this.bindings.p2Action1),
            action2: this.isAnyDown(this.bindings.p2Action2),
            action2Pressed: this.isAnyPressed(this.bindings.p2Action2),
            interact: this.isAnyPressed(this.bindings.p2Up),
        };
        return { cody: codyInput, may: mayInput };
    }
    pollGamepad(index, callback) {
        if (typeof navigator === 'undefined' || !navigator.getGamepads)
            return;
        const gamepads = navigator.getGamepads();
        const gp = gamepads[index - 1];
        if (gp && gp.connected) {
            const x = gp.axes[0] || 0;
            const y = gp.axes[1] || 0;
            const jump = gp.buttons[0]?.pressed || false;
            const act1 = gp.buttons[2]?.pressed || gp.buttons[7]?.pressed || false;
            const act2 = gp.buttons[1]?.pressed || false;
            callback(x, y, jump, act1, act2);
        }
    }
    endFrame() {
        this.keysPressedThisFrame.clear();
    }
}
