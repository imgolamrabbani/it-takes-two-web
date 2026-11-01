# It Takes Two: The Shed (Clean-Room Browser Reconstruction)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Engine: TypeScript 5 + Vite](https://img.shields.io/badge/Engine-TypeScript_5_+_Vite-green.svg)](https://vitejs.dev/)
[![Physics: 120Hz Deterministic Semi-Implicit Euler](https://img.shields.io/badge/Physics-120Hz_Euler-cyan.svg)](src/core/physics/Kinematics.ts)
[![Audio: Real-Time WebAudio Synth](https://img.shields.io/badge/Audio-Procedural_WebAudio-orange.svg)](src/core/audio/SynthEngine.ts)
[![Security: Clean--Room Zero Binary Assets](https://img.shields.io/badge/Security-Clean--Room_Verified-brightgreen.svg)](evidence/06_security_oss_audit.json)

A 100% clean-room, studio-grade, browser-based cooperative puzzle platformer reconstructed autonomously by **OMNI-GAME FOUNDRY (REA-G)**. Replicates the iconic mechanics of Hazelight Studios' *It Takes Two* (Chapter: The Shed) with **zero proprietary binary assets** (procedurally synthesized vector graphics and WebAudio soundscapes).

---

## 🎮 Play Live
- **Cloudflare Pages Global CDN:** [https://it-takes-two-web.pages.dev](https://it-takes-two-web.pages.dev)
- **GitHub Repository:** [https://github.com/imgolamrabbani/it-takes-two-web](https://github.com/imgolamrabbani/it-takes-two-web)

---

## 👥 Asymmetric Character Mechanics

```mermaid
graph TD
    subgraph Cody["Cody (Green Figurine)"]
        C1["Aim & Throw Steel Nails (Up to 3)"]
        C2["Embed into Wooden Targets & Machinery"]
        C3["Magnetic Remote Recall"]
        C4["Pin Crushing Pistons & Moving Platforms"]
    end

    subgraph May["May (Blue Figurine)"]
        M1["Heavy Forged Hammerhead Swing"]
        M2["Latch & Swing onto Cody's Embedded Nails"]
        M3["Mid-Air Ground Pound Shockwave"]
        M4["Shatter Boss Cores & Toggle Spring Buttons"]
    end

    C2 -.->|Creates Hook Anchor| M2
    C4 -.->|Secures Arena Arm| M4
```

### Controls

| Action | Player 1: Cody (Left) | Player 2: May (Right) |
| :--- | :--- | :--- |
| **Move Horizontal** | `A` / `D` | `Left` / `Right` Arrow |
| **Aim Upwards / Downwards** | `W` / `S` | `Up` / `Down` Arrow |
| **Jump / Wall Jump** | `Space` | `Enter` or `Numpad 0` |
| **Primary Action** | `F` (Throw Steel Nail) | `L` (Hammer Swing / Hook onto Nail) |
| **Secondary Action** | `R` (Magnetic Recall Nails) | `K` or `Down` (Ground Pound Slam) |
| **Debug Overlay** | Backquote (`` ` ``) or `F3` | Backquote (`` ` ``) or `F3` |
| **Pause Game** | `Escape` or `P` | `Escape` or `P` |

*Supports both **2-Player Co-op** on a single keyboard / gamepads, and **Solo Dual-Control** mode.*

---

## 🔬 Mathematical Physics & Engine Architecture

1. **Deterministic Fixed-Timestep Integrator (120Hz):**
   $$\Delta t = \frac{1}{120}\text{s} \approx 0.008333\text{s}$$
   Platforming trajectories are identical across 60Hz, 120Hz, and 240Hz monitors with zero tunneling.

2. **Pendulum Swing Constrained Kinematics:**
   $$\ddot{\theta} = -\frac{g}{L}\sin\theta - c\dot{\theta} + F_{\text{pump}}\cos\theta$$
   May hooks onto Cody's embedded nails and swings with momentum-conserving tangential dismount boosts.

3. **Spring-Damper Dynamic Framing Camera:**
   $$\ddot{x}_{\text{cam}} = -k(x_{\text{cam}} - M_x) - c\dot{x}_{\text{cam}}$$
   Seamlessly centers between Cody and May with adaptive zooming based on player separation.

---

## 🛠 Local Development & Build

```bash
# Clone the repository
git clone https://github.com/imgolamrabbani/it-takes-two-web.git
cd it-takes-two-web

# Install dependencies
npm install

# Start Vite live development server
npm run dev

# Build production bundle with COOP/COEP headers
npm run build

# Preview production build locally
npm run preview
```

---

## 📜 Clean-Room Open Source License
Distributed under the **MIT License**. All game code, procedural synthesizers, and procedural shaders were constructed cleanly without proprietary decompiled assets.
