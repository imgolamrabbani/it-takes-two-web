export interface PlayerInputState {
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1
  jump: boolean;
  jumpPressed: boolean;
  action1: boolean;        // Cody: Throw Nail / May: Hammer Swing
  action1Pressed: boolean;
  action2: boolean;        // Cody: Recall Nails / May: Ground Pound
  action2Pressed: boolean;
  interact: boolean;
}

export interface InputBindings {
  p1Left: string[];
  p1Right: string[];
  p1Up: string[];
  p1Down: string[];
  p1Jump: string[];
  p1Action1: string[];
  p1Action2: string[];

  p2Left: string[];
  p2Right: string[];
  p2Up: string[];
  p2Down: string[];
  p2Jump: string[];
  p2Action1: string[];
  p2Action2: string[];

  pause: string[];
  debug: string[];
  swapSolo: string[];
}

export class InputManager {
  private keysDown = new Set<string>();
  private keysPressedThisFrame = new Set<string>();

  public isCoopMode = true; // true = separate P1 / P2 controls; false = solo dual/swap
  public soloActivePlayer: 'cody' | 'may' = 'cody';

  public bindings: InputBindings = {
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

  private isAnyDown(codes: string[]): boolean {
    return codes.some((code) => this.keysDown.has(code));
  }

  private isAnyPressed(codes: string[]): boolean {
    return codes.some((code) => this.keysPressedThisFrame.has(code));
  }

  public isDebugToggled(): boolean {
    return this.isAnyPressed(this.bindings.debug);
  }

  public isPauseToggled(): boolean {
    return this.isAnyPressed(this.bindings.pause);
  }

  public isSwapSoloToggled(): boolean {
    return this.isAnyPressed(this.bindings.swapSolo);
  }

  public getPlayerInputs(): { cody: PlayerInputState; may: PlayerInputState } {
    let p1MoveX = 0;
    if (this.isAnyDown(this.bindings.p1Left)) p1MoveX -= 1;
    if (this.isAnyDown(this.bindings.p1Right)) p1MoveX += 1;

    let p1MoveY = 0;
    if (this.isAnyDown(this.bindings.p1Up)) p1MoveY -= 1;
    if (this.isAnyDown(this.bindings.p1Down)) p1MoveY += 1;

    let p2MoveX = 0;
    if (this.isAnyDown(this.bindings.p2Left)) p2MoveX -= 1;
    if (this.isAnyDown(this.bindings.p2Right)) p2MoveX += 1;

    let p2MoveY = 0;
    if (this.isAnyDown(this.bindings.p2Up)) p2MoveY -= 1;
    if (this.isAnyDown(this.bindings.p2Down)) p2MoveY += 1;

    // Check Gamepad
    this.pollGamepad(1, (gx, gy, jump, act1, act2) => {
      if (Math.abs(gx) > 0.15) p1MoveX = gx;
      if (Math.abs(gy) > 0.15) p1MoveY = gy;
    });

    const codyInput: PlayerInputState = {
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

    const mayInput: PlayerInputState = {
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

  private pollGamepad(
    index: number,
    callback: (x: number, y: number, jump: boolean, act1: boolean, act2: boolean) => void
  ): void {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
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

  public endFrame(): void {
    this.keysPressedThisFrame.clear();
  }
}
