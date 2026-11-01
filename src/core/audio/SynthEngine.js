export class SynthEngine {
    ctx = null;
    masterGain = null;
    sfxGain = null;
    musicGain = null;
    bgmTimer = null;
    bgmStep = 0;
    isMuted = false;
    sfxVolume = 0.8;
    musicVolume = 0.5;
    ensureContext() {
        if (this.isMuted)
            return false;
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 1.0;
                this.masterGain.connect(this.ctx.destination);
                this.sfxGain = this.ctx.createGain();
                this.sfxGain.gain.value = this.sfxVolume;
                this.sfxGain.connect(this.masterGain);
                this.musicGain = this.ctx.createGain();
                this.musicGain.gain.value = this.musicVolume;
                this.musicGain.connect(this.masterGain);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            void this.ctx.resume();
        }
        return !!this.ctx;
    }
    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        }
    }
    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, val));
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        }
    }
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
        }
        return this.isMuted;
    }
    sfxJump() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }
    sfxDoubleJump() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.13);
    }
    sfxNailThrow() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(840, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.11);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.13);
    }
    sfxNailEmbed() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        // High metal ping
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
        oscGain.gain.setValueAtTime(0.25, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
        // Thud
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'triangle';
        sub.frequency.setValueAtTime(160, now);
        sub.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        subGain.gain.setValueAtTime(0.3, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(now);
        sub.stop(now + 0.11);
    }
    sfxNailRecall() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(960, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.17);
    }
    sfxHammerSwing() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.14);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.16);
    }
    sfxHammerSmash() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        // Heavy bass punch
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        oscGain.gain.setValueAtTime(0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
        // Noise crunch
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        noise.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.19);
    }
    sfxGroundPound() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'triangle';
        sub.frequency.setValueAtTime(95, now);
        sub.frequency.exponentialRampToValueAtTime(20, now + 0.35);
        subGain.gain.setValueAtTime(0.5, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(now);
        sub.stop(now + 0.4);
    }
    sfxSwitch() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.11);
    }
    sfxFanfare() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
            if (!this.ctx || !this.sfxGain)
                return;
            const t = now + idx * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.35);
        });
    }
    sfxBossHit() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.23);
    }
    sfxRespawn() {
        if (!this.ensureContext() || !this.ctx || !this.sfxGain)
            return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }
    startProceduralMusic() {
        if (this.bgmTimer)
            return;
        this.ensureContext();
        const scale = [146.83, 164.81, 174.61, 220.00, 261.63, 293.66]; // D-minor pentatonic
        this.bgmTimer = window.setInterval(() => {
            if (!this.ensureContext() || !this.ctx || !this.musicGain || this.isMuted)
                return;
            const now = this.ctx.currentTime;
            const noteFreq = scale[this.bgmStep % scale.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(noteFreq, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start(now);
            osc.stop(now + 0.48);
            // Bass pulse on measure head
            if (this.bgmStep % 4 === 0) {
                const bass = this.ctx.createOscillator();
                const bassGain = this.ctx.createGain();
                bass.type = 'triangle';
                bass.frequency.setValueAtTime(73.42, now); // D2
                bassGain.gain.setValueAtTime(0.12, now);
                bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
                bass.connect(bassGain);
                bassGain.connect(this.musicGain);
                bass.start(now);
                bass.stop(now + 0.85);
            }
            this.bgmStep++;
        }, 250);
    }
    stopProceduralMusic() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}
