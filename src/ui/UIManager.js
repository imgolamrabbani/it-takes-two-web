export class UIManager {
    root;
    callbacks;
    currentState = 'TITLE';
    selectedMode = 'coop';
    sfxVolume = 0.8;
    musicVolume = 0.5;
    constructor(rootElement, callbacks) {
        this.root = rootElement;
        this.callbacks = callbacks;
        this.render();
    }
    setState(state) {
        this.currentState = state;
        this.render();
    }
    render() {
        this.root.innerHTML = '';
        if (this.currentState === 'PLAYING') {
            return; // Canvas HUD is rendering
        }
        const overlay = document.createElement('div');
        overlay.className = 'pointer-events-auto';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = 'rgba(7, 9, 19, 0.88)';
        overlay.style.backdropFilter = 'blur(6px)';
        overlay.style.zIndex = '100';
        switch (this.currentState) {
            case 'TITLE':
                this.renderTitle(overlay);
                break;
            case 'SETTINGS':
                this.renderSettings(overlay);
                break;
            case 'LEVEL_SELECT':
                this.renderLevelSelect(overlay);
                break;
            case 'PAUSED':
                this.renderPaused(overlay);
                break;
            case 'STAGE_CLEAR':
                this.renderStageClear(overlay);
                break;
            case 'VICTORY':
                this.renderVictory(overlay);
                break;
        }
        this.root.appendChild(overlay);
    }
    createButton(text, onClick, isPrimary = true) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.padding = '14px 32px';
        btn.style.margin = '8px';
        btn.style.fontSize = '16px';
        btn.style.fontWeight = 'bold';
        btn.style.borderRadius = '8px';
        btn.style.border = isPrimary ? '2px solid #00f5d4' : '2px solid #3a86ff';
        btn.style.background = isPrimary ? '#00f5d4' : '#11162b';
        btn.style.color = isPrimary ? '#070913' : '#f1f5f9';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'transform 0.1s, box-shadow 0.1s';
        btn.onmouseenter = () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 0 16px rgba(0, 245, 212, 0.4)';
        };
        btn.onmouseleave = () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = 'none';
        };
        btn.onclick = onClick;
        return btn;
    }
    renderTitle(container) {
        const title = document.createElement('h1');
        title.textContent = 'IT TAKES TWO';
        title.style.fontSize = '48px';
        title.style.letterSpacing = '4px';
        title.style.color = '#fee440';
        title.style.textShadow = '0 0 20px rgba(254, 228, 64, 0.5)';
        title.style.marginBottom = '6px';
        const subtitle = document.createElement('h3');
        subtitle.textContent = 'CHAPTER: THE SHED (Clean-Room Procedural Co-op Reconstruction)';
        subtitle.style.fontSize = '14px';
        subtitle.style.color = '#2ec4b6';
        subtitle.style.letterSpacing = '2px';
        subtitle.style.marginBottom = '32px';
        const controlsBox = document.createElement('div');
        controlsBox.style.background = '#11162b';
        controlsBox.style.padding = '18px 26px';
        controlsBox.style.borderRadius = '8px';
        controlsBox.style.border = '1px solid #2b3650';
        controlsBox.style.marginBottom = '28px';
        controlsBox.style.lineHeight = '1.7';
        controlsBox.style.fontSize = '13px';
        controlsBox.style.color = '#cbd5e1';
        controlsBox.innerHTML = `
      <b style="color:#2ec4b6">P1 (CODY):</b> WASD = Move | Space = Jump | F = Throw Nail | R = Recall Nails<br/>
      <b style="color:#3a86ff">P2 (MAY):</b> Arrow Keys = Move | Enter/Numpad0 = Jump | L = Hammer Swing / Hook | Down = Ground Pound<br/>
      <span style="color:#fee440">Toggle Debug:</span> Backquote (\`) or F3 | <span style="color:#fee440">Pause:</span> ESC
    `;
        const playCoopBtn = this.createButton('PLAY 2-PLAYER CO-OP', () => {
            this.selectedMode = 'coop';
            this.callbacks.onStartGame('coop', 1);
        });
        const playSoloBtn = this.createButton('PLAY SOLO (DUAL CONTROLS)', () => {
            this.selectedMode = 'solo';
            this.callbacks.onStartGame('solo', 1);
        }, false);
        const chapterBtn = this.createButton('CHAPTER SELECT', () => {
            this.setState('LEVEL_SELECT');
        }, false);
        const settingsBtn = this.createButton('SETTINGS', () => {
            this.setState('SETTINGS');
        }, false);
        container.appendChild(title);
        container.appendChild(subtitle);
        container.appendChild(controlsBox);
        container.appendChild(playCoopBtn);
        container.appendChild(playSoloBtn);
        container.appendChild(chapterBtn);
        container.appendChild(settingsBtn);
    }
    renderLevelSelect(container) {
        const title = document.createElement('h2');
        title.textContent = 'SELECT CHAPTER SECTOR';
        title.style.color = '#fee440';
        title.style.marginBottom = '24px';
        const levels = [
            { id: 1, name: 'Stage 1: The Shed Awakening (Pressure Plates)' },
            { id: 2, name: 'Stage 2: The Nails & Hammer Traverse (Swinging)' },
            { id: 3, name: 'Stage 3: The Clashing Conduit (Piston Pinning)' },
            { id: 4, name: 'Boss Encounter: The Deranged Tool Box' },
        ];
        container.appendChild(title);
        levels.forEach((lvl) => {
            const btn = this.createButton(lvl.name, () => {
                this.callbacks.onStartGame(this.selectedMode, lvl.id);
            }, lvl.id === 1);
            container.appendChild(btn);
        });
        const backBtn = this.createButton('BACK TO TITLE', () => this.setState('TITLE'), false);
        backBtn.style.marginTop = '20px';
        container.appendChild(backBtn);
    }
    renderSettings(container) {
        const title = document.createElement('h2');
        title.textContent = 'SETTINGS & ACCESSIBILITY';
        title.style.color = '#fee440';
        title.style.marginBottom = '24px';
        const panel = document.createElement('div');
        panel.style.background = '#11162b';
        panel.style.padding = '24px';
        panel.style.borderRadius = '8px';
        panel.style.border = '1px solid #2b3650';
        panel.style.width = '360px';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.gap = '16px';
        // SFX Volume Slider
        const sfxLabel = document.createElement('label');
        sfxLabel.textContent = `SFX Volume: ${Math.round(this.sfxVolume * 100)}%`;
        sfxLabel.style.fontSize = '14px';
        const sfxSlider = document.createElement('input');
        sfxSlider.type = 'range';
        sfxSlider.min = '0';
        sfxSlider.max = '1';
        sfxSlider.step = '0.05';
        sfxSlider.value = String(this.sfxVolume);
        sfxSlider.oninput = () => {
            this.sfxVolume = parseFloat(sfxSlider.value);
            sfxLabel.textContent = `SFX Volume: ${Math.round(this.sfxVolume * 100)}%`;
            this.callbacks.onVolumeChange(this.sfxVolume, this.musicVolume);
        };
        // Music Volume Slider
        const musicLabel = document.createElement('label');
        musicLabel.textContent = `Music Volume: ${Math.round(this.musicVolume * 100)}%`;
        musicLabel.style.fontSize = '14px';
        const musicSlider = document.createElement('input');
        musicSlider.type = 'range';
        musicSlider.min = '0';
        musicSlider.max = '1';
        musicSlider.step = '0.05';
        musicSlider.value = String(this.musicVolume);
        musicSlider.oninput = () => {
            this.musicVolume = parseFloat(musicSlider.value);
            musicLabel.textContent = `Music Volume: ${Math.round(this.musicVolume * 100)}%`;
            this.callbacks.onVolumeChange(this.sfxVolume, this.musicVolume);
        };
        panel.appendChild(sfxLabel);
        panel.appendChild(sfxSlider);
        panel.appendChild(musicLabel);
        panel.appendChild(musicSlider);
        const backBtn = this.createButton('SAVE & RETURN', () => this.setState('TITLE'), true);
        container.appendChild(title);
        container.appendChild(panel);
        container.appendChild(backBtn);
    }
    renderPaused(container) {
        const title = document.createElement('h2');
        title.textContent = 'GAME PAUSED';
        title.style.color = '#fee440';
        title.style.marginBottom = '24px';
        const resumeBtn = this.createButton('RESUME', () => this.callbacks.onResume(), true);
        const restartBtn = this.createButton('RESTART STAGE', () => this.callbacks.onRestartStage(), false);
        const titleBtn = this.createButton('EXIT TO MENU', () => this.callbacks.onReturnTitle(), false);
        container.appendChild(title);
        container.appendChild(resumeBtn);
        container.appendChild(restartBtn);
        container.appendChild(titleBtn);
    }
    renderStageClear(container) {
        const title = document.createElement('h2');
        title.textContent = 'SECTOR CLEARED!';
        title.style.color = '#00f5d4';
        title.style.fontSize = '36px';
        title.style.marginBottom = '12px';
        const sub = document.createElement('p');
        sub.textContent = 'Cooperative harmony achieved! Both Cody and May reached the pneumatic exit.';
        sub.style.color = '#f1f5f9';
        sub.style.marginBottom = '28px';
        const nextBtn = this.createButton('NEXT SECTOR', () => this.callbacks.onNextStage(), true);
        container.appendChild(title);
        container.appendChild(sub);
        container.appendChild(nextBtn);
    }
    renderVictory(container) {
        const title = document.createElement('h1');
        title.textContent = 'VICTORY: THE SHED CONQUERED!';
        title.style.color = '#fee440';
        title.style.fontSize = '42px';
        title.style.marginBottom = '12px';
        const sub = document.createElement('p');
        sub.textContent = 'The Deranged Toolbox has been repaired and pacified through mechanical synergy!';
        sub.style.color = '#00f5d4';
        sub.style.marginBottom = '32px';
        const returnBtn = this.createButton('MAIN MENU', () => this.callbacks.onReturnTitle(), true);
        container.appendChild(title);
        container.appendChild(sub);
        container.appendChild(returnBtn);
    }
}
