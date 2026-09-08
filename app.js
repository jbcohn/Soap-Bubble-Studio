/**
 * Bubble Surface Generator & Print Studio
 * Pure Client-Side HTML5 Canvas & Web Physics Simulation
 */

// =============================================================================
// 1. PALETTES & COLOR DEFINITIONS
// =============================================================================

const PALETTES = {
    "Iridescent Soap Film": {
        bg_top: [14, 18, 32],
        bg_bottom: [6, 8, 18],
        bubble_fill: [210, 230, 255, 0],
        bubble_rim: [220, 238, 255, 0.70],
        bubble_highlight: [255, 255, 255, 0.50],
        contact_line: [220, 238, 255, 0.70],
        iridescent: true,
        is_dark: true
    },
    "Glassy Water": {
        bg_top: [10, 30, 60],
        bg_bottom: [3, 12, 28],
        bubble_fill: [210, 240, 255, 0.14],
        bubble_rim: [180, 230, 255, 0.70],
        bubble_highlight: [255, 255, 255, 0.50],
        contact_line: [190, 235, 255, 0.75],
        iridescent: false,
        is_dark: true
    },
    "T-Shirt Linework (Light on Dark)": {
        bg_top: [18, 20, 24],
        bg_bottom: [12, 14, 18],
        bubble_fill: [255, 255, 255, 0.06],
        bubble_rim: [240, 245, 250, 0.85],
        bubble_highlight: [255, 255, 255, 0.50],
        contact_line: [240, 245, 250, 0.85],
        iridescent: false,
        is_dark: true
    },
    "T-Shirt Linework (Dark on Light)": {
        bg_top: [250, 250, 250],
        bg_bottom: [240, 240, 240],
        bubble_fill: [255, 255, 255, 0.85],
        bubble_rim: [25, 30, 38, 0.92],
        bubble_highlight: [25, 30, 38, 0.50],
        contact_line: [25, 30, 38, 0.92],
        iridescent: false,
        is_dark: false
    },
    "Neon Bioluminescence": {
        bg_top: [8, 12, 24],
        bg_bottom: [3, 4, 10],
        bubble_fill: [20, 255, 210, 0.10],
        bubble_rim: [0, 255, 200, 0.82],
        bubble_highlight: [220, 255, 250, 0.50],
        contact_line: [0, 255, 200, 0.82],
        iridescent: false,
        is_dark: true
    },
    "Champagne Gold": {
        bg_top: [36, 26, 14],
        bg_bottom: [18, 12, 6],
        bubble_fill: [255, 235, 170, 0.12],
        bubble_rim: [255, 220, 130, 0.78],
        bubble_highlight: [255, 250, 230, 0.50],
        contact_line: [255, 225, 140, 0.82],
        iridescent: false,
        is_dark: true
    }
};

const PRESETS = {
    "Latte Microfoam": {
        coverage: 0.65,
        mean_radius: 14.0,
        variation: 0.25,
        dist: "Log-Normal",
        attraction: 1.2,
        repulsion: 1.5,
        agitation: 0.02,
        palette: "Glassy Water",
        container: "Circular Dish",
        line_width: 1.2
    },
    "Sea Foam Raft": {
        coverage: 0.50,
        mean_radius: 22.0,
        variation: 0.60,
        dist: "Log-Normal",
        attraction: 1.8,
        repulsion: 1.2,
        agitation: 0.03,
        palette: "Iridescent Soap Film",
        container: "Open Surface",
        line_width: 1.6
    },
    "Champagne Fizz": {
        coverage: 0.25,
        mean_radius: 9.0,
        variation: 0.45,
        dist: "Gaussian",
        attraction: 0.7,
        repulsion: 1.0,
        agitation: 0.05,
        palette: "Champagne Gold",
        container: "Circular Dish",
        line_width: 1.0
    },
    "T-Shirt Screenprint": {
        coverage: 0.55,
        mean_radius: 28.0,
        variation: 0.50,
        dist: "Log-Normal",
        attraction: 1.5,
        repulsion: 1.4,
        agitation: 0.01,
        palette: "T-Shirt Linework (Light on Dark)",
        container: "Circular Dish",
        line_width: 2.8
    },
    "Bimodal Emulsion": {
        coverage: 0.72,
        mean_radius: 20.0,
        variation: 0.75,
        dist: "Bimodal",
        attraction: 1.4,
        repulsion: 1.6,
        agitation: 0.03,
        palette: "Neon Bioluminescence",
        container: "Rectangular Tank",
        line_width: 1.5
    },
    "Minimal Rings": {
        coverage: 0.40,
        mean_radius: 32.0,
        variation: 0.35,
        dist: "Gaussian",
        attraction: 1.6,
        repulsion: 1.5,
        agitation: 0.01,
        palette: "T-Shirt Linework (Light on Dark)",
        container: "Circular Dish",
        line_width: 2.0
    }
};

// =============================================================================
// 2. MICHEL-LÉVY THIN-FILM INTERFERENCE OPTICS & TEXTURE CACHE
// =============================================================================

const MICHEL_LEVY_KEYPOINTS = [
    [0.00, [225, 235, 245]], // 0nm: Neutral pearlescent silver
    [0.12, [245, 230, 180]], // 120nm: Straw-gold
    [0.25, [250, 185, 140]], // 250nm: Peach-coral
    [0.38, [235, 130, 185]], // 380nm: Rose-magenta
    [0.50, [150, 145, 235]], // 500nm: Violet-cobalt
    [0.63, [100, 205, 240]], // 630nm: Sky-cyan
    [0.75, [130, 235, 195]], // 750nm: Seafoam-emerald
    [0.88, [230, 215, 140]], // 880nm: Lime-gold
    [1.00, [245, 155, 175]]  // 1000nm: Second-order magenta
];

function interpolateMichelLevy(t, saturation) {
    t = ((t % 1.0) + 1.0) % 1.0;
    let idx = 0;
    for (let k = 0; k < MICHEL_LEVY_KEYPOINTS.length - 1; k++) {
        if (t >= MICHEL_LEVY_KEYPOINTS[k][0] && t <= MICHEL_LEVY_KEYPOINTS[k + 1][0]) {
            idx = k;
            break;
        }
    }
    const t0 = MICHEL_LEVY_KEYPOINTS[idx][0];
    const t1 = MICHEL_LEVY_KEYPOINTS[idx + 1][0];
    const f = (t - t0) / (t1 - t0);
    const c0 = MICHEL_LEVY_KEYPOINTS[idx][1];
    const c1 = MICHEL_LEVY_KEYPOINTS[idx + 1][1];

    let r = c0[0] + (c1[0] - c0[0]) * f;
    let g = c0[1] + (c1[1] - c0[1]) * f;
    let b = c0[2] + (c1[2] - c0[2]) * f;

    // Desaturate toward pearl white
    if (saturation < 1.0) {
        const pR = 235, pG = 240, pB = 248;
        r = pR + (r - pR) * saturation;
        g = pG + (g - pG) * saturation;
        b = pB + (b - pB) * saturation;
    }
    return [Math.round(r), Math.round(g), Math.round(b)];
}

// Bounded LRU Offscreen Texture Cache
const TEXTURE_CACHE = new Map();
const MAX_CACHE_ITEMS = 600;

function getHybridIridescentTexture(radiusPx, seed, saturation, transparency) {
    const rInt = Math.max(2, Math.round(radiusPx));
    const variant = seed % 12;
    const satQ = Math.round(saturation * 20);
    const transQ = Math.round(transparency * 20);
    const cacheKey = `${rInt}_${variant}_${satQ}_${transQ}`;

    if (TEXTURE_CACHE.has(cacheKey)) {
        return TEXTURE_CACHE.get(cacheKey);
    }

    const size = rInt * 2;
    const offCanvas = document.createElement("canvas");
    offCanvas.width = size;
    offCanvas.height = size;
    const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
    const imgData = offCtx.createImageData(size, size);
    const data = imgData.data;

    const cx = rInt;
    const cy = rInt;
    const rFloat = rInt;
    const seedOffset = variant * 0.523598; // 30 deg

    const centerAlpha = (1.0 - transparency) * 165.0;
    const rimAlpha = (1.0 - transparency * 0.70) * 255.0;

    for (let y = 0; y < size; y++) {
        const dy = y - cy;
        for (let x = 0; x < size; x++) {
            const dx = x - cx;
            const distSq = dx * dx + dy * dy;
            if (distSq > rFloat * rFloat) continue;

            const dist = Math.sqrt(distSq);
            const normDist = dist / rFloat; // 0 (center) to 1 (rim)

            // Viewing angle cos(theta)
            const cosTheta = Math.sqrt(Math.max(0.0, 1.0 - normDist * normDist));
            const angle = Math.atan2(dy, dx) + seedOffset;

            // Model 2: Marangoni convective eddies / fluid flow streamlines
            const swirl1 = Math.sin(angle * 2.0 + normDist * 5.0) * 0.08;
            const swirl2 = Math.cos(angle * 3.0 - normDist * 4.0) * 0.06;
            const eddy = Math.sin(dx * 0.08 + dy * 0.06) * 0.04;
            const fluidPerturb = swirl1 + swirl2 + eddy;

            // Model 3: Optical path length phase shift Delta = 2 n d cos(theta)
            const deltaPhase = 1.35 * (1.0 - cosTheta) + fluidPerturb;

            const [rgbR, rgbG, rgbB] = interpolateMichelLevy(deltaPhase, saturation);

            // Fresnel reflection intensity at rim
            const fresnelRefl = Math.pow(normDist, 2.5);
            const alphaVal = Math.min(255, Math.max(0, centerAlpha + (rimAlpha - centerAlpha) * fresnelRefl));

            const pIdx = (y * size + x) * 4;
            data[pIdx] = rgbR;
            data[pIdx + 1] = rgbG;
            data[pIdx + 2] = rgbB;
            data[pIdx + 3] = Math.round(alphaVal);
        }
    }

    offCtx.putImageData(imgData, 0, 0);

    if (TEXTURE_CACHE.size >= MAX_CACHE_ITEMS) {
        // Drop oldest entries
        const firstKey = TEXTURE_CACHE.keys().next().value;
        TEXTURE_CACHE.delete(firstKey);
    }
    TEXTURE_CACHE.set(cacheKey, offCanvas);
    return offCanvas;
}

// =============================================================================
// 3. RADII POPULATION GENERATOR
// =============================================================================

function generateRadii(targetCoverage, meanRadius, variance, distType, domainArea) {
    const targetBubbleArea = targetCoverage * domainArea;
    const radii = [];
    let currentArea = 0.0;
    const minRadius = 2.0;
    const maxRadius = 140.0;
    let attempts = 0;
    const maxAttempts = 150000;
    const maxBubbles = 650;

    // As variance increases, the proportion of interstitial satellite microbubbles rises steeply
    const v = Math.max(0.01, Math.min(1.0, variance));
    const microRatio = Math.pow(v, 1.35) * 0.88;

    while (currentArea < targetBubbleArea && attempts < maxAttempts && radii.length < maxBubbles) {
        attempts++;

        let r = meanRadius;
        if (Math.random() < microRatio) {
            // Satellite microbubbles: Pareto-skewed microbubble radius nestled between large bubbles
            const maxMicro = Math.max(minRadius + 0.8, meanRadius * (0.12 + 0.30 * (1.0 - v)));
            r = minRadius + (maxMicro - minRadius) * Math.pow(Math.random(), 1.8);
        } else {
            if (distType === "Gaussian") {
                const std = meanRadius * (0.15 + 0.90 * v);
                r = randGaussian(meanRadius, std);
            } else if (distType === "Log-Normal") {
                const sigmaLn = 0.25 + v * 1.25;
                const muLn = Math.log(meanRadius) - 0.5 * sigmaLn * sigmaLn;
                r = randLognormal(muLn, sigmaLn);
            } else if (distType === "Bimodal") {
                if (Math.random() < (0.55 + 0.35 * v)) {
                    const rMean = meanRadius * Math.max(0.18, 0.45 - 0.25 * v);
                    r = randGaussian(rMean, rMean * (0.2 + 0.2 * v));
                } else {
                    const rMean = meanRadius * (1.3 + 0.9 * v);
                    r = randGaussian(rMean, rMean * 0.25);
                }
            } else if (distType === "Power-Law (Fractal)") {
                const alpha = 1.3 + 1.7 * v;
                const u = Math.random();
                r = minRadius * Math.pow(1.0 - u, -1.0 / alpha);
            } else if (distType === "Uniform") {
                const span = meanRadius * v * Math.sqrt(3.0);
                r = (meanRadius - span) + Math.random() * (2.0 * span);
            }
        }

        r = Math.min(maxRadius, Math.max(minRadius, r));
        const bArea = Math.PI * r * r;

        if (currentArea + bArea > targetBubbleArea * 1.05 && radii.length > 8) {
            if (attempts > radii.length + 500) break;
            continue;
        }

        radii.push(r);
        currentArea += bArea;
    }

    return radii;
}

function randGaussian(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * std;
}

function randLognormal(mu, sigma) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return Math.exp(mu + z * sigma);
}

// =============================================================================
// 4. PHYSICS SIMULATION CORE
// =============================================================================

class BubbleSimulation {
    constructor(domainWidth, domainHeight, containerType = "Circular Dish", capillaryLength = 35.0) {
        this.w = domainWidth;
        this.h = domainHeight;
        this.center = [this.w / 2.0, this.h / 2.0];
        this.radiusContainer = Math.min(this.w, this.h) * 0.46;
        this.containerType = containerType;
        this.capillaryLength = capillaryLength;

        this.numBubbles = 0;
        this.pos = new Float32Array(0);
        this.vel = new Float32Array(0);
        this.force = new Float32Array(0);
        this.radii = new Float32Array(0);
        this.masses = new Float32Array(0);

        this.kAttraction = 1.4;
        this.kRepulsion = 1.3;
        this.damping = 0.90;
        this.agitation = 0.03;
        this.contactPairs = [];
        this.simTime = 0.0;

        // Bubble bursting / popping mechanics
        this.poppingEnabled = false;
        this.popAcuteAngleThreshold = 34.0; // degrees (stable Plateau triple junctions are 60°)
        this.popMaxOverlapRatio = 0.50;     // 50% radius compression limit
        this.lastAutoPopTime = 0.0;
        this.particles = [];
        this.onPopCallback = null;
    }

    resetWithRadii(radii) {
        this.numBubbles = radii.length;
        this.radii = new Float32Array(radii);
        this.masses = new Float32Array(this.numBubbles);
        for (let i = 0; i < this.numBubbles; i++) {
            this.masses[i] = 15.0 + Math.pow(this.radii[i], 1.6);
        }

        this.pos = new Float32Array(this.numBubbles * 2);
        this.vel = new Float32Array(this.numBubbles * 2);
        this.force = new Float32Array(this.numBubbles * 2);
        this.contactPairs = [];

        if (this.numBubbles === 0) return;

        if (this.containerType === "Circular Dish" || this.containerType === "Open Surface") {
            const maxR = this.radiusContainer * (this.containerType === "Circular Dish" ? 0.78 : 0.65);
            for (let i = 0; i < this.numBubbles; i++) {
                const angle = Math.random() * 2.0 * Math.PI;
                const dist = maxR * Math.sqrt(Math.random());
                this.pos[i * 2] = this.center[0] + dist * Math.cos(angle);
                this.pos[i * 2 + 1] = this.center[1] + dist * Math.sin(angle);
            }
        } else {
            const margin = 35.0;
            for (let i = 0; i < this.numBubbles; i++) {
                this.pos[i * 2] = margin + Math.random() * (this.w - 2 * margin);
                this.pos[i * 2 + 1] = margin + Math.random() * (this.h - 2 * margin);
            }
        }
    }

    addBubble(x, y, r, vx = 0, vy = 0) {
        const n = this.numBubbles + 1;
        const newRadii = new Float32Array(n);
        const newMasses = new Float32Array(n);
        const newPos = new Float32Array(n * 2);
        const newVel = new Float32Array(n * 2);
        const newForce = new Float32Array(n * 2);

        newRadii.set(this.radii);
        newRadii[n - 1] = r;

        newMasses.set(this.masses);
        newMasses[n - 1] = 15.0 + Math.pow(r, 1.6);

        newPos.set(this.pos);
        newPos[(n - 1) * 2] = x;
        newPos[(n - 1) * 2 + 1] = y;

        newVel.set(this.vel);
        newVel[(n - 1) * 2] = vx;
        newVel[(n - 1) * 2 + 1] = vy;

        this.radii = newRadii;
        this.masses = newMasses;
        this.pos = newPos;
        this.vel = newVel;
        this.force = newForce;
        this.numBubbles = n;
    }

    removeBubble(idx) {
        if (idx < 0 || idx >= this.numBubbles) return null;
        const popped = {
            x: this.pos[idx * 2],
            y: this.pos[idx * 2 + 1],
            r: this.radii[idx]
        };

        const n = this.numBubbles - 1;
        const newRadii = new Float32Array(n);
        const newMasses = new Float32Array(n);
        const newPos = new Float32Array(n * 2);
        const newVel = new Float32Array(n * 2);
        const newForce = new Float32Array(n * 2);

        let k = 0;
        for (let i = 0; i < this.numBubbles; i++) {
            if (i === idx) continue;
            newRadii[k] = this.radii[i];
            newMasses[k] = this.masses[i];
            newPos[k * 2] = this.pos[i * 2];
            newPos[k * 2 + 1] = this.pos[i * 2 + 1];
            newVel[k * 2] = this.vel[i * 2];
            newVel[k * 2 + 1] = this.vel[i * 2 + 1];
            k++;
        }

        this.numBubbles = n;
        this.radii = newRadii;
        this.masses = newMasses;
        this.pos = newPos;
        this.vel = newVel;
        this.force = newForce;

        // Synchronize contact pairs: remove any contacts involving the popped bubble,
        // and decrement all indices > idx so remaining pairs stay perfectly aligned with arrays
        const updatedPairs = [];
        for (let p = 0; p < this.contactPairs.length; p++) {
            const [i, j] = this.contactPairs[p];
            if (i === idx || j === idx) continue;
            const newI = i > idx ? i - 1 : i;
            const newJ = j > idx ? j - 1 : j;
            updatedPairs.push([newI, newJ]);
        }
        this.contactPairs = updatedPairs;

        return popped;
    }

    triggerPop(idx) {
        const popped = this.removeBubble(idx);
        if (!popped) return false;

        // Trigger sound callback
        if (this.onPopCallback) {
            try {
                this.onPopCallback(popped.r);
            } catch (err) {
                console.error("onPopCallback error:", err);
            }
        }

        // Spawn glistening iridescent droplet particles
        const count = Math.min(18, Math.max(8, Math.round(popped.r * 0.45)));
        const colors = [
            "rgba(165, 243, 252, 0.95)", // sky cyan
            "rgba(244, 114, 182, 0.95)", // rose magenta
            "rgba(253, 224, 71, 0.95)",  // gold
            "rgba(196, 181, 253, 0.95)", // soft violet
            "rgba(255, 255, 255, 0.98)"  // pearl highlight
        ];

        for (let k = 0; k < count; k++) {
            const angle = (k / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
            const speed = (popped.r * 1.8 + Math.random() * popped.r * 1.2) * 1.5;
            this.particles.push({
                x: popped.x + Math.cos(angle) * popped.r * 0.85,
                y: popped.y + Math.sin(angle) * popped.r * 0.85,
                vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 10.0,
                vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 10.0,
                r: Math.max(1.2, Math.min(3.5, popped.r * 0.08)),
                alpha: 1.0,
                decay: 2.8 + Math.random() * 1.2,
                color: colors[k % colors.length]
            });
        }
        return true;
    }

    checkAcuteAngleRupture(criticalAngleDeg = 55.0) {
        if (this.contactPairs.length < 2) return -1;
        const cutsPerBubble = new Map();
        for (const [i, j] of this.contactPairs) {
            if (i >= this.numBubbles || j >= this.numBubbles) continue;
            const dx = this.pos[j * 2] - this.pos[i * 2];
            const dy = this.pos[j * 2 + 1] - this.pos[i * 2 + 1];
            const d = Math.hypot(dx, dy);
            if (d < 1e-4) continue;
            const r1 = this.radii[i];
            const r2 = this.radii[j];
            if (d >= r1 + r2) continue;

            const ux = dx / d;
            const uy = dy / d;
            const a = (d * d - r2 * r2 + r1 * r1) / (2.0 * d);

            if (!cutsPerBubble.has(i)) cutsPerBubble.set(i, []);
            cutsPerBubble.get(i).push({ u: [ux, uy], a });

            if (!cutsPerBubble.has(j)) cutsPerBubble.set(j, []);
            cutsPerBubble.get(j).push({ u: [-ux, -uy], a: d - a });
        }

        const critRad = (criticalAngleDeg * Math.PI) / 180.0;

        for (const [idx, cuts] of cutsPerBubble.entries()) {
            if (cuts.length < 2) continue;
            const r = this.radii[idx];

            for (let m = 0; m < cuts.length; m++) {
                for (let n = m + 1; n < cuts.length; n++) {
                    const u1 = cuts[m].u;
                    const u2 = cuts[n].u;
                    const a1 = cuts[m].a;
                    const a2 = cuts[n].a;

                    const det = u1[0] * u2[1] - u1[1] * u2[0];
                    if (Math.abs(det) < 1e-4) continue;

                    const xInt = (a1 * u2[1] - a2 * u1[1]) / det;
                    const yInt = (u1[0] * a2 - u2[0] * a1) / det;
                    const dInt = Math.hypot(xInt, yInt);

                    if (dInt <= r * 1.02) {
                        const dot = Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]));
                        const phi = Math.acos(dot);
                        const cornerAngle = Math.PI - phi;
                        if (cornerAngle < critRad) {
                            return idx;
                        }
                    }
                }
            }
        }
        return -1;
    }

    checkOvercompressionRupture(maxOverlapRatio = 0.50) {
        for (const [i, j] of this.contactPairs) {
            if (i >= this.numBubbles || j >= this.numBubbles) continue;
            const dx = this.pos[j * 2] - this.pos[i * 2];
            const dy = this.pos[j * 2 + 1] - this.pos[i * 2 + 1];
            const dist = Math.hypot(dx, dy);
            const r1 = this.radii[i];
            const r2 = this.radii[j];
            const overlap = (r1 + r2) - dist;
            const minR = Math.min(r1, r2);
            if (overlap > minR * maxOverlapRatio) {
                return r1 <= r2 ? i : j;
            }
        }
        return -1;
    }

    step(dt = 0.6) {
        if (this.numBubbles === 0) return;

        this.force.fill(0.0);
        this.contactPairs = [];
        const contactCounts = new Int32Array(this.numBubbles);

        const capLen = this.capillaryLength;
        const capCutoff = capLen * 2.5;

        // Dual-tier spatial grid partitioning
        // Small/regular bubbles use a spatial hash grid (O(1) lookup per bubble)
        // Large bubbles check radially against all bubbles to prevent multi-cell collision misses
        const largeThresh = 22.0;
        const largeIndices = [];
        const regIndices = [];
        for (let i = 0; i < this.numBubbles; i++) {
            if (this.radii[i] > largeThresh) {
                largeIndices.push(i);
            } else {
                regIndices.push(i);
            }
        }

        const cellSize = 60.0;
        const grid = new Map();
        for (const idx of regIndices) {
            const cx = Math.floor(this.pos[idx * 2] / cellSize);
            const cy = Math.floor(this.pos[idx * 2 + 1] / cellSize);
            const key = `${cx},${cy}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key).push(idx);
        }

        const offsets = [[1, 0], [0, 1], [1, 1], [-1, 1]];

        const interact = (i, j) => {
            const dx = this.pos[j * 2] - this.pos[i * 2];
            const dy = this.pos[j * 2 + 1] - this.pos[i * 2 + 1];
            const distSq = dx * dx + dy * dy;
            if (distSq < 1e-6) return;

            const r1 = this.radii[i];
            const r2 = this.radii[j];
            const rSum = r1 + r2;
            const maxD = rSum + capCutoff;

            if (distSq > maxD * maxD) return;

            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;
            const surfaceGap = dist - rSum;

            let fx = 0.0;
            let fy = 0.0;

            if (surfaceGap < 0.0) {
                this.contactPairs.push([i, j]);
                contactCounts[i]++;
                contactCounts[j]++;
                const overlap = -surfaceGap;
                const repelMag = (this.kRepulsion * 48.0) * overlap + (overlap * overlap * 10.0);
                const dvx = this.vel[j * 2] - this.vel[i * 2];
                const dvy = this.vel[j * 2 + 1] - this.vel[i * 2 + 1];
                fx = -nx * repelMag + dvx * 0.45;
                fy = -ny * repelMag + dvy * 0.45;
            } else {
                // Physical Meniscus Scaling (Bond Number Attenuation)
                const baseG = (r1 * r2) / (r1 + r2);
                const microAtten = Math.min(1.0, (r1 * r2) / 80.0);
                const geomFactor = baseG * microAtten;
                const attractMag = (this.kAttraction * 2.2) * geomFactor * Math.exp(-surfaceGap / capLen);
                fx = nx * attractMag;
                fy = ny * attractMag;
            }

            this.force[i * 2] += fx;
            this.force[i * 2 + 1] += fy;
            this.force[j * 2] -= fx;
            this.force[j * 2 + 1] -= fy;
        };

        // 1. Regular vs Regular pairs (spatial hash cells)
        for (const [key, cellIndices] of grid.entries()) {
            const [cx, cy] = key.split(",").map(Number);
            const nm = cellIndices.length;
            for (let a = 0; a < nm; a++) {
                for (let b = a + 1; b < nm; b++) {
                    interact(cellIndices[a], cellIndices[b]);
                }
            }
            for (const [ox, oy] of offsets) {
                const nKey = `${cx + ox},${cy + oy}`;
                if (grid.has(nKey)) {
                    const nIndices = grid.get(nKey);
                    for (let a = 0; a < nm; a++) {
                        for (let b = 0; b < nIndices.length; b++) {
                            interact(cellIndices[a], nIndices[b]);
                        }
                    }
                }
            }
        }

        // 2. Large bubbles interact against all other bubbles
        if (largeIndices.length > 0) {
            for (const li of largeIndices) {
                const lpx = this.pos[li * 2];
                const lpy = this.pos[li * 2 + 1];
                const lr = this.radii[li];

                for (let j = 0; j < this.numBubbles; j++) {
                    if (j === li) continue;
                    // Avoid double check between two large bubbles
                    if (this.radii[j] > largeThresh && j < li) continue;

                    const dx = this.pos[j * 2] - lpx;
                    const dy = this.pos[j * 2 + 1] - lpy;
                    const cutoff = lr + this.radii[j] + capCutoff;
                    const dSq = dx * dx + dy * dy;
                    if (dSq < cutoff * cutoff && dSq > 1e-6) {
                        interact(li, j);
                    }
                }
            }
        }

        // 3. Container boundary confinement
        if (this.containerType === "Circular Dish") {
            const rBound = this.radiusContainer;
            for (let i = 0; i < this.numBubbles; i++) {
                const dx = this.center[0] - this.pos[i * 2];
                const dy = this.center[1] - this.pos[i * 2 + 1];
                const distCenter = Math.sqrt(dx * dx + dy * dy);
                const r = this.radii[i];
                const wallDist = rBound - (distCenter + r);
                const inwardX = dx / Math.max(distCenter, 1e-4);
                const inwardY = dy / Math.max(distCenter, 1e-4);

                if (wallDist < 0.0) {
                    const pen = -wallDist;
                    this.force[i * 2] += inwardX * (pen * 50.0);
                    this.force[i * 2 + 1] += inwardY * (pen * 50.0);

                    // Position clamp
                    const targetD = rBound - r;
                    this.pos[i * 2] = this.center[0] - inwardX * targetD;
                    this.pos[i * 2 + 1] = this.center[1] - inwardY * targetD;

                    // Damped restitution along boundary normal
                    const vRadial = this.vel[i * 2] * (-inwardX) + this.vel[i * 2 + 1] * (-inwardY);
                    if (vRadial > 0) {
                        this.vel[i * 2] -= 1.4 * vRadial * (-inwardX);
                        this.vel[i * 2 + 1] -= 1.4 * vRadial * (-inwardY);
                    }
                }
            }
        } else if (this.containerType === "Rectangular Tank") {
            const margin = 35.0;
            for (let i = 0; i < this.numBubbles; i++) {
                const r = this.radii[i];
                const left = margin + r;
                const right = this.w - margin - r;
                const top = margin + r;
                const bottom = this.h - margin - r;

                if (this.pos[i * 2] < left) {
                    this.force[i * 2] += (left - this.pos[i * 2]) * 45.0;
                    this.pos[i * 2] = left;
                } else if (this.pos[i * 2] > right) {
                    this.force[i * 2] -= (this.pos[i * 2] - right) * 45.0;
                    this.pos[i * 2] = right;
                }

                if (this.pos[i * 2 + 1] < top) {
                    this.force[i * 2 + 1] += (top - this.pos[i * 2 + 1]) * 45.0;
                    this.pos[i * 2 + 1] = top;
                } else if (this.pos[i * 2 + 1] > bottom) {
                    this.force[i * 2 + 1] -= (this.pos[i * 2 + 1] - bottom) * 45.0;
                    this.pos[i * 2 + 1] = bottom;
                }
            }
        } else {
            // Open Surface: Gentle soft centering only if raft drifts beyond 85% of viewport
            const maxDist = this.radiusContainer * 0.85;
            for (let i = 0; i < this.numBubbles; i++) {
                const dx = this.center[0] - this.pos[i * 2];
                const dy = this.center[1] - this.pos[i * 2 + 1];
                const distCenter = Math.sqrt(dx * dx + dy * dy);
                if (distCenter > maxDist) {
                    const inwardX = dx / (distCenter + 1e-4);
                    const inwardY = dy / (distCenter + 1e-4);
                    const excess = distCenter - maxDist;
                    this.force[i * 2] += inwardX * (excess * 0.08);
                    this.force[i * 2 + 1] += inwardY * (excess * 0.08);
                }
            }
        }

        // 4. Stokes hydrodynamic surface drag & overdamped dissipation
        this.simTime += dt;
        for (let i = 0; i < this.numBubbles; i++) {
            const r = this.radii[i];
            const m = this.masses[i];
            let ax = this.force[i * 2] / m;
            let ay = this.force[i * 2 + 1] / m;

            // Foam yield stress / capillary pinning
            const accMag = Math.sqrt(ax * ax + ay * ay);
            if (contactCounts[i] >= 1 && accMag < 0.40) {
                ax = 0.0;
                ay = 0.0;
            }

            // Stokes hydrodynamic drag scaling
            const dragRate = 14.0 / (r + 3.0) + 0.6;
            const dragDecay = Math.exp(-dragRate * dt);
            const clusterDamped = contactCounts[i] > 0 ? 0.70 : this.damping;

            this.vel[i * 2] = (this.vel[i * 2] + ax * dt) * dragDecay * clusterDamped;
            this.vel[i * 2 + 1] = (this.vel[i * 2 + 1] + ay * dt) * dragDecay * clusterDamped;

            // Fluid Brownian agitation & gentle coherent swell
            if (this.agitation > 0.001) {
                const swellX = Math.sin(this.pos[i * 2 + 1] * 0.015 + this.simTime * 1.5) * (this.agitation * 0.8);
                const swellY = Math.cos(this.pos[i * 2] * 0.015 + this.simTime * 1.2) * (this.agitation * 0.8);
                const pinningFactor = 1.0 / (1.0 + contactCounts[i] * 4.0);
                const shimmerX = (Math.random() - 0.5) * (this.agitation * 0.7);
                const shimmerY = (Math.random() - 0.5) * (this.agitation * 0.7);
                this.vel[i * 2] += (swellX * 0.25 + shimmerX * pinningFactor) * Math.sqrt(dt);
                this.vel[i * 2 + 1] += (swellY * 0.25 + shimmerY * pinningFactor) * Math.sqrt(dt);
            }

            // Static capillary pinning threshold
            const speed = Math.hypot(this.vel[i * 2], this.vel[i * 2 + 1]);
            if (contactCounts[i] >= 1 && speed < 0.15) {
                this.vel[i * 2] = 0.0;
                this.vel[i * 2 + 1] = 0.0;
            }

            // Physical speed limit proportional to bubble size (prevents tunneling & jitter)
            const maxSpeed = Math.max(3.5, r * 0.70);
            if (speed > maxSpeed) {
                const scaleSpeed = maxSpeed / speed;
                this.vel[i * 2] *= scaleSpeed;
                this.vel[i * 2 + 1] *= scaleSpeed;
            }

            this.pos[i * 2] += this.vel[i * 2] * dt;
            this.pos[i * 2 + 1] += this.vel[i * 2 + 1] * dt;
        }

        // 5. Update burst droplet particles
        if (this.particles.length > 0) {
            for (let k = this.particles.length - 1; k >= 0; k--) {
                const p = this.particles[k];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= Math.pow(0.86, dt);
                p.vy *= Math.pow(0.86, dt);
                p.alpha -= p.decay * dt * 0.25;
                if (p.alpha <= 0.02) {
                    this.particles.splice(k, 1);
                }
            }
        }

        // 6. Automatic bubble popping when enabled (acute pinch & compression strain)
        // Rate-limited to an organic ~7 pops/sec max so ruptures look natural rather than an instant cascade
        if (this.poppingEnabled && this.numBubbles > 2) {
            if (this.simTime - this.lastAutoPopTime >= 5.5) {
                let popIdx = this.checkAcuteAngleRupture(this.popAcuteAngleThreshold);
                if (popIdx < 0) {
                    popIdx = this.checkOvercompressionRupture(this.popMaxOverlapRatio);
                }
                if (popIdx >= 0) {
                    this.triggerPop(popIdx);
                    this.lastAutoPopTime = this.simTime;
                }
            }
        }
    }

    fastSettle(iterations = 85) {
        const origAgitation = this.agitation;
        const origDamping = this.damping;
        const origPopping = this.poppingEnabled;
        this.agitation = 0.0;
        this.damping = 0.50;
        this.poppingEnabled = false; // Never pop during instant geometric settling
        const actualIters = Math.min(iterations, Math.max(35, Math.floor(20000 / Math.max(1, this.numBubbles))));

        for (let it = 0; it < actualIters; it++) {
            const dt = 0.55 * (1.0 - 0.65 * (it / actualIters));
            this.step(dt);
        }

        this.agitation = origAgitation;
        this.damping = origDamping;
        this.poppingEnabled = origPopping;
        this.vel.fill(0.0);
    }

    stirWater(mx, my, vx, vy, radius = 90.0) {
        if (this.numBubbles === 0) return;
        const rSq = radius * radius;
        for (let i = 0; i < this.numBubbles; i++) {
            const dx = this.pos[i * 2] - mx;
            const dy = this.pos[i * 2 + 1] - my;
            const distSq = dx * dx + dy * dy;
            if (distSq < rSq) {
                const factor = (1.0 - Math.sqrt(distSq) / radius);
                this.vel[i * 2] += vx * factor * 0.40;
                this.vel[i * 2 + 1] += vy * factor * 0.40;
            }
        }
    }
}

// =============================================================================
// 5. HTML5 CANVAS RENDERER & EXPORTER
// =============================================================================

class BubbleRenderer {
    static renderScene(
        ctx,
        sim,
        options = {}
    ) {
        const {
            paletteName = "Iridescent Soap Film",
            scale = 1.0,
            offset = [0, 0],
            lineWidth = 1.8,
            transparentBg = false,
            filmSaturation = 0.75,
            filmTransparency = 0.60
        } = options;

        const palette = PALETTES[paletteName] || PALETTES["Iridescent Soap Film"];
        const isIridescent = palette.iridescent;
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        // 1. Background
        if (!transparentBg) {
            const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
            bgGrad.addColorStop(0, `rgb(${palette.bg_top.join(",")})`);
            bgGrad.addColorStop(1, `rgb(${palette.bg_bottom.join(",")})`);
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Container dish boundary
            if (sim.containerType === "Circular Dish") {
                const cx = sim.center[0] * scale + offset[0];
                const cy = sim.center[1] * scale + offset[1];
                const cr = sim.radiusContainer * scale;
                ctx.beginPath();
                ctx.arc(cx, cy, cr, 0, Math.PI * 2);
                ctx.strokeStyle = palette.is_dark ? "rgba(100, 140, 190, 0.28)" : "rgba(10, 20, 30, 0.20)";
                ctx.lineWidth = Math.max(1, 2.0 * scale);
                ctx.stroke();
            }
        } else {
            ctx.clearRect(0, 0, width, height);
        }

        if (sim.numBubbles === 0) return;

        // 2. Precompute contact chords and half-plane cuts
        const cutsPerBubble = new Map();
        const chordsToDraw = [];

        for (const [i, j] of sim.contactPairs) {
            if (i >= sim.numBubbles || j >= sim.numBubbles) continue;
            const p1 = [sim.pos[i * 2] * scale + offset[0], sim.pos[i * 2 + 1] * scale + offset[1]];
            const p2 = [sim.pos[j * 2] * scale + offset[0], sim.pos[j * 2 + 1] * scale + offset[1]];
            const r1 = sim.radii[i] * scale;
            const r2 = sim.radii[j] * scale;

            const dx = p2[0] - p1[0];
            const dy = p2[1] - p1[1];
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 1e-4 || d >= r1 + r2) continue;

            const ux = dx / d;
            const uy = dy / d;
            const perp = [-uy, ux];
            const a = (d * d - r2 * r2 + r1 * r1) / (2.0 * d);
            const contactPt = [p1[0] + ux * a, p1[1] + uy * a];
            const hSq = Math.max(0.0, r1 * r1 - a * a);
            const chordHalf = Math.sqrt(hSq);

            if (chordHalf > 0.5) {
                chordsToDraw.push({ i, j, contactPt, perp, chordHalf, p1, p2 });
                if (!cutsPerBubble.has(i)) cutsPerBubble.set(i, []);
                cutsPerBubble.get(i).push({ u: [ux, uy], a, perp, other: j });

                if (!cutsPerBubble.has(j)) cutsPerBubble.set(j, []);
                cutsPerBubble.get(j).push({ u: [-ux, -uy], a: d - a, perp: [-perp[0], -perp[1]], other: i });
            }
        }

        const rimWidth = lineWidth <= 0.05 ? 0 : Math.max(1, Math.round(lineWidth * scale));
        const [rimR, rimG, rimB, rimA] = palette.bubble_rim;
        const [fillR, fillG, fillB, fillA] = palette.bubble_fill;

        // Render larger bubbles first
        const sortedIndices = Array.from({ length: sim.numBubbles }, (_, idx) => idx)
            .sort((a, b) => sim.radii[b] - sim.radii[a]);

        // 3. Render Bubble Bodies & Iridescent Domes
        if (!BubbleRenderer._scratchCanvas && typeof document !== "undefined") {
            BubbleRenderer._scratchCanvas = document.createElement("canvas");
            BubbleRenderer._scratchCtx = BubbleRenderer._scratchCanvas.getContext("2d");
        }
        const scratchCanvas = BubbleRenderer._scratchCanvas;
        const sctx = BubbleRenderer._scratchCtx;

        for (const idx of sortedIndices) {
            const bx = sim.pos[idx * 2] * scale + offset[0];
            const by = sim.pos[idx * 2 + 1] * scale + offset[1];
            const br = sim.radii[idx] * scale;
            if (br < 0.5) continue;

            const hasCuts = cutsPerBubble.has(idx);

            // Microbubbles (br < 5.0) render via the ultra-fast direct path (chord indentation is < 1px)
            if (hasCuts && br >= 5.0 * scale && scratchCanvas && sctx) {
                const cuts = cutsPerBubble.get(idx);
                const size = Math.ceil(br * 2 + 16);
                if (scratchCanvas.width < size || scratchCanvas.height < size) {
                    scratchCanvas.width = Math.max(scratchCanvas.width, size + 32);
                    scratchCanvas.height = Math.max(scratchCanvas.height, size + 32);
                }
                sctx.clearRect(0, 0, size, size);

                const icx = Math.round(size / 2);
                const icy = Math.round(size / 2);

                // A: Base fill
                if (fillA > 0) {
                    sctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillA})`;
                    sctx.beginPath();
                    sctx.arc(icx, icy, br, 0, Math.PI * 2);
                    sctx.fill();
                }

                // B: Iridescent soap film texture
                if (isIridescent) {
                    if (br >= 2.0) {
                        const tex = getHybridIridescentTexture(br, idx, filmSaturation, filmTransparency);
                        sctx.drawImage(tex, icx - br, icy - br, br * 2, br * 2);
                    } else {
                        // Soft pearlescent luminous tint for microbubbles
                        const microAlpha = Math.max(0.12, 0.40 * (1.0 - filmTransparency));
                        sctx.fillStyle = `rgba(215, 235, 255, ${microAlpha})`;
                        sctx.beginPath();
                        sctx.arc(icx, icy, br, 0, Math.PI * 2);
                        sctx.fill();
                    }
                } else if (br > 8 * scale && rimWidth > 0) {
                    const innerR = Math.max(1, Math.round(br - Math.max(1, lineWidth * 1.1 * scale)));
                    const fresnelAlpha = Math.max(0.04, rimA * 0.35);
                    sctx.strokeStyle = `rgba(${rimR}, ${rimG}, ${rimB}, ${fresnelAlpha})`;
                    sctx.lineWidth = Math.max(1, lineWidth * 0.65 * scale);
                    sctx.beginPath();
                    sctx.arc(icx, icy, innerR, 0, Math.PI * 2);
                    sctx.stroke();
                }

                // C: Outer rim membrane
                if (rimWidth > 0) {
                    sctx.strokeStyle = `rgba(${rimR}, ${rimG}, ${rimB}, ${rimA})`;
                    sctx.lineWidth = rimWidth;
                    sctx.beginPath();
                    sctx.arc(icx, icy, br, 0, Math.PI * 2);
                    sctx.stroke();

                    // D: TIR rim fringe (thin bright ring just inside membrane)
                    if (br >= 6 * scale) {
                        const tirR = Math.min(255, rimR + 45);
                        const tirG = Math.min(255, rimG + 45);
                        const tirB = Math.min(255, rimB + 45);
                        const tirA = rimA * 0.55;
                        const tirRad = Math.max(1, br - rimWidth - 1);
                        sctx.strokeStyle = `rgba(${tirR}, ${tirG}, ${tirB}, ${tirA})`;
                        sctx.lineWidth = 1;
                        sctx.beginPath();
                        sctx.arc(icx, icy, tirRad, 0, Math.PI * 2);
                        sctx.stroke();
                    }
                }

                // E: Erase everything beyond contact chords using destination-out
                sctx.save();
                sctx.globalCompositeOperation = "destination-out";
                sctx.fillStyle = "#000000";

                for (const { u, a, perp } of cuts) {
                    const csx = icx + u[0] * a;
                    const csy = icy + u[1] * a;
                    const polyDist = br * 2.5;
                    const dU = br * 4.0;

                    sctx.beginPath();
                    sctx.moveTo(csx + perp[0] * polyDist, csy + perp[1] * polyDist);
                    sctx.lineTo(csx - perp[0] * polyDist, csy - perp[1] * polyDist);
                    sctx.lineTo(csx - perp[0] * polyDist + u[0] * dU, csy - perp[1] * polyDist + u[1] * dU);
                    sctx.lineTo(csx + perp[0] * polyDist + u[0] * dU, csy + perp[1] * polyDist + u[1] * dU);
                    sctx.closePath();
                    sctx.fill();
                }
                sctx.restore();

                // Blit cut bubble to main context
                ctx.drawImage(scratchCanvas, 0, 0, size, size, bx - icx, by - icy, size, size);

            } else {
                // Direct rendering for uncut bubbles (fastest path)
                if (fillA > 0) {
                    ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillA})`;
                    ctx.beginPath();
                    ctx.arc(bx, by, br, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (isIridescent) {
                    if (br >= 2.0) {
                        const tex = getHybridIridescentTexture(br, idx, filmSaturation, filmTransparency);
                        ctx.drawImage(tex, bx - br, by - br, br * 2, br * 2);
                    } else {
                        const microAlpha = Math.max(0.12, 0.40 * (1.0 - filmTransparency));
                        ctx.fillStyle = `rgba(215, 235, 255, ${microAlpha})`;
                        ctx.beginPath();
                        ctx.arc(bx, by, br, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (br > 8 * scale && rimWidth > 0) {
                    const innerR = Math.max(1, Math.round(br - Math.max(1, lineWidth * 1.1 * scale)));
                    const fresnelAlpha = Math.max(0.04, rimA * 0.35);
                    ctx.strokeStyle = `rgba(${rimR}, ${rimG}, ${rimB}, ${fresnelAlpha})`;
                    ctx.lineWidth = Math.max(1, lineWidth * 0.65 * scale);
                    ctx.beginPath();
                    ctx.arc(bx, by, innerR, 0, Math.PI * 2);
                    ctx.stroke();
                }

                if (rimWidth > 0) {
                    ctx.strokeStyle = `rgba(${rimR}, ${rimG}, ${rimB}, ${rimA})`;
                    ctx.lineWidth = rimWidth;
                    ctx.beginPath();
                    ctx.arc(bx, by, br, 0, Math.PI * 2);
                    ctx.stroke();

                    if (br >= 6 * scale) {
                        const tirR = Math.min(255, rimR + 45);
                        const tirG = Math.min(255, rimG + 45);
                        const tirB = Math.min(255, rimB + 45);
                        const tirA = rimA * 0.55;
                        const tirRad = Math.max(1, br - rimWidth - 1);
                        ctx.strokeStyle = `rgba(${tirR}, ${tirG}, ${tirB}, ${tirA})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(bx, by, tirRad, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
            }
        }

        // 4. Contact Plateau Borders (Chords) - Batched into a single stroke call for high FPS
        if (rimWidth > 0 && chordsToDraw.length > 0) {
            const [cR, cG, cB, cA] = palette.contact_line;
            ctx.strokeStyle = `rgba(${cR}, ${cG}, ${cB}, ${cA})`;
            ctx.lineWidth = rimWidth;
            ctx.lineCap = "round";
            ctx.beginPath();

            for (const { i, j, contactPt, perp, chordHalf, p1, p2 } of chordsToDraw) {
                let tMin = -chordHalf;
                let tMax = chordHalf;

                // Clamp against other cuts of bubble i
                const cutsI = cutsPerBubble.get(i) || [];
                for (const { u, a, other } of cutsI) {
                    if (other === j) continue;
                    const uProj = perp[0] * u[0] + perp[1] * u[1];
                    const val = a - ((contactPt[0] - p1[0]) * u[0] + (contactPt[1] - p1[1]) * u[1]);
                    if (Math.abs(uProj) > 1e-5) {
                        const bound = val / uProj;
                        if (uProj > 0) tMax = Math.min(tMax, bound);
                        else tMin = Math.max(tMin, bound);
                    }
                }

                // Clamp against other cuts of bubble j
                const cutsJ = cutsPerBubble.get(j) || [];
                for (const { u, a, other } of cutsJ) {
                    if (other === i) continue;
                    const uProj = perp[0] * u[0] + perp[1] * u[1];
                    const val = a - ((contactPt[0] - p2[0]) * u[0] + (contactPt[1] - p2[1]) * u[1]);
                    if (Math.abs(uProj) > 1e-5) {
                        const bound = val / uProj;
                        if (uProj > 0) tMax = Math.min(tMax, bound);
                        else tMin = Math.max(tMin, bound);
                    }
                }

                if (tMin < tMax) {
                    const sx = contactPt[0] + perp[0] * tMin;
                    const sy = contactPt[1] + perp[1] * tMin;
                    const ex = contactPt[0] + perp[0] * tMax;
                    const ey = contactPt[1] + perp[1] * tMax;
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(ex, ey);
                }
            }
            ctx.stroke();
        }

        // 5. Specular Highlights / Light Glints (50% Opacity)
        const [hlR, hlG, hlB, hlA] = palette.bubble_highlight;
        for (const idx of sortedIndices) {
            const bx = sim.pos[idx * 2] * scale + offset[0];
            const by = sim.pos[idx * 2 + 1] * scale + offset[1];
            const br = sim.radii[idx] * scale;
            if (br < 4.0 * scale) continue;

            const hlDx = -br * 0.36;
            const hlDy = -br * 0.36;
            const hlRVal = Math.max(1.5, br * 0.26);

            // Primary Gaussian glint
            const grad = ctx.createRadialGradient(
                bx + hlDx, by + hlDy, 0,
                bx + hlDx, by + hlDy, hlRVal
            );
            grad.addColorStop(0.0, `rgba(${hlR}, ${hlG}, ${hlB}, ${hlA})`);
            grad.addColorStop(0.4, `rgba(${hlR}, ${hlG}, ${hlB}, ${hlA * 0.7})`);
            grad.addColorStop(0.8, `rgba(${hlR}, ${hlG}, ${hlB}, ${hlA * 0.15})`);
            grad.addColorStop(1.0, `rgba(${hlR}, ${hlG}, ${hlB}, 0.0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(bx + hlDx, by + hlDy, hlRVal, 0, Math.PI * 2);
            ctx.fill();

            // Secondary subtle glint
            if (br > 12 * scale) {
                const secDx = br * 0.40;
                const secDy = br * 0.40;
                const secR = Math.max(1.0, br * 0.11);
                const gradSec = ctx.createRadialGradient(
                    bx + secDx, by + secDy, 0,
                    bx + secDx, by + secDy, secR
                );
                gradSec.addColorStop(0.0, `rgba(${hlR}, ${hlG}, ${hlB}, ${hlA * 0.28})`);
                gradSec.addColorStop(1.0, `rgba(${hlR}, ${hlG}, ${hlB}, 0.0)`);

                ctx.fillStyle = gradSec;
                ctx.beginPath();
                ctx.arc(bx + secDx, by + secDy, secR, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 6. Popping Droplet Particles
        if (sim.particles && sim.particles.length > 0) {
            ctx.save();
            for (const p of sim.particles) {
                if (p.alpha <= 0.01) continue;
                const px = p.x * scale + offset[0];
                const py = p.y * scale + offset[1];
                const pr = Math.max(0.8, p.r * scale);
                ctx.beginPath();
                ctx.arc(px, py, pr, 0, Math.PI * 2);
                ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
                ctx.fillStyle = p.color;
                ctx.fill();
            }
            ctx.restore();
        }
    }

    static exportPNG(sim, options = {}) {
        const width = 4500;
        const height = 5400;
        const offCanvas = document.createElement("canvas");
        offCanvas.width = width;
        offCanvas.height = height;
        const offCtx = offCanvas.getContext("2d");

        const scaleX = width / sim.w;
        const scaleY = height / sim.h;
        const scale = Math.min(scaleX, scaleY) * 0.95;
        const offsetX = (width - sim.w * scale) / 2.0;
        const offsetY = (height - sim.h * scale) / 2.0;

        BubbleRenderer.renderScene(offCtx, sim, {
            ...options,
            scale,
            offset: [offsetX, offsetY],
            transparentBg: true
        });

        offCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
            a.download = `bubble_surface_4500x5400_${ts}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, "image/png");
    }

    static exportSVG(sim, options = {}) {
        const width = 1200;
        const height = 1200;
        const scale = Math.min(width / sim.w, height / sim.h);
        const ox = (width - sim.w * scale) / 2.0;
        const oy = (height - sim.h * scale) / 2.0;

        const lineWidth = options.lineWidth ?? 1.8;
        const strokeC = lineWidth <= 0.05 ? 0.0 : Math.max(0.5, lineWidth * scale);
        const strokeL = strokeC;

        const cutsPerBubble = new Map();
        const chordsToDraw = [];

        for (const [i, j] of sim.contactPairs) {
            if (i >= sim.numBubbles || j >= sim.numBubbles) continue;
            const p1 = [sim.pos[i * 2] * scale + ox, sim.pos[i * 2 + 1] * scale + oy];
            const p2 = [sim.pos[j * 2] * scale + ox, sim.pos[j * 2 + 1] * scale + oy];
            const r1 = sim.radii[i] * scale;
            const r2 = sim.radii[j] * scale;

            const dx = p2[0] - p1[0];
            const dy = p2[1] - p1[1];
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 1e-4 || d >= r1 + r2) continue;

            const ux = dx / d;
            const uy = dy / d;
            const perp = [-uy, ux];
            const a = (d * d - r2 * r2 + r1 * r1) / (2.0 * d);
            const contactPt = [p1[0] + ux * a, p1[1] + uy * a];
            const hSq = Math.max(0.0, r1 * r1 - a * a);
            const chordHalf = Math.sqrt(hSq);

            if (chordHalf > 0.5) {
                chordsToDraw.push({ i, j, contactPt, perp, chordHalf, p1, p2 });
                if (!cutsPerBubble.has(i)) cutsPerBubble.set(i, []);
                cutsPerBubble.get(i).push({ contactPt, u: [ux, uy], perp, other: j });

                if (!cutsPerBubble.has(j)) cutsPerBubble.set(j, []);
                cutsPerBubble.get(j).push({ contactPt, u: [-ux, -uy], perp: [-perp[0], -perp[1]], other: i });
            }
        }

        const svgLines = [
            `<?xml version="1.0" encoding="UTF-8"?>`,
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
            `  <rect width="${width}" height="${height}" fill="none"/>`
        ];

        // Clip path defs
        if (cutsPerBubble.size > 0) {
            svgLines.push(`  <defs>`);
            for (const [i, cuts] of cutsPerBubble.entries()) {
                cuts.forEach(({ contactPt: c, u, perp }, k) => {
                    const r = sim.radii[i] * scale;
                    const p1 = [c[0] + perp[0] * (r * 2.5), c[1] + perp[1] * (r * 2.5)];
                    const p2 = [c[0] - perp[0] * (r * 2.5), c[1] - perp[1] * (r * 2.5)];
                    const p3 = [p2[0] - u[0] * (r * 3.5), p2[1] - u[1] * (r * 3.5)];
                    const p4 = [p1[0] - u[0] * (r * 3.5), p1[1] - u[1] * (r * 3.5)];
                    svgLines.push(`    <clipPath id="cut_${i}_${k}">`);
                    svgLines.push(`      <polygon points="${p1[0].toFixed(2)},${p1[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)} ${p3[0].toFixed(2)},${p3[1].toFixed(2)} ${p4[0].toFixed(2)},${p4[1].toFixed(2)}"/>`);
                    svgLines.push(`    </clipPath>`);
                });
            }
            svgLines.push(`  </defs>`);
        }

        const strokeAttr = strokeC > 0 ? `stroke="#0F172A" stroke-width="${strokeC.toFixed(2)}"` : `stroke="none"`;
        svgLines.push(`  <g ${strokeAttr} fill="none">`);

        for (let i = 0; i < sim.numBubbles; i++) {
            const cx = sim.pos[i * 2] * scale + ox;
            const cy = sim.pos[i * 2 + 1] * scale + oy;
            const cr = sim.radii[i] * scale;
            const cTag = `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${cr.toFixed(2)}" fill="#FFFFFF" fill-opacity="0.85"/>`;

            if (cutsPerBubble.has(i)) {
                const cuts = cutsPerBubble.get(i);
                const openTags = cuts.map((_, k) => `<g clip-path="url(#cut_${i}_${k})">`).join("");
                const closeTags = "</g>".repeat(cuts.length);
                svgLines.push(`    ${openTags}${cTag}${closeTags}`);
            } else {
                svgLines.push(`    ${cTag}`);
            }
        }

        if (strokeL > 0) {
            for (const { i, j, contactPt, perp, chordHalf } of chordsToDraw) {
                let tMin = -chordHalf;
                let tMax = chordHalf;

                const cutsI = cutsPerBubble.get(i) || [];
                for (const { contactPt: c, u, other } of cutsI) {
                    if (other === j) continue;
                    const uProj = perp[0] * u[0] + perp[1] * u[1];
                    const val = (c[0] - contactPt[0]) * u[0] + (c[1] - contactPt[1]) * u[1];
                    if (Math.abs(uProj) > 1e-5) {
                        const bound = val / uProj;
                        if (uProj > 0) tMax = Math.min(tMax, bound);
                        else tMin = Math.max(tMin, bound);
                    }
                }

                const cutsJ = cutsPerBubble.get(j) || [];
                for (const { contactPt: c, u, other } of cutsJ) {
                    if (other === i) continue;
                    const uProj = perp[0] * u[0] + perp[1] * u[1];
                    const val = (c[0] - contactPt[0]) * u[0] + (c[1] - contactPt[1]) * u[1];
                    if (Math.abs(uProj) > 1e-5) {
                        const bound = val / uProj;
                        if (uProj > 0) tMax = Math.min(tMax, bound);
                        else tMin = Math.max(tMin, bound);
                    }
                }

                if (tMin < tMax) {
                    const sPt = [contactPt[0] + perp[0] * tMin, contactPt[1] + perp[1] * tMin];
                    const ePt = [contactPt[0] + perp[0] * tMax, contactPt[1] + perp[1] * tMax];
                    svgLines.push(`    <line x1="${sPt[0].toFixed(2)}" y1="${sPt[1].toFixed(2)}" x2="${ePt[0].toFixed(2)}" y2="${ePt[1].toFixed(2)}" stroke="#0F172A" stroke-width="${strokeL.toFixed(2)}"/>`);
                }
            }
        }

        svgLines.push(`  </g>`);
        svgLines.push(`</svg>`);

        const blob = new Blob([svgLines.join("\n")], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
        a.download = `bubble_surface_${ts}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// =============================================================================
// 5.5 PROCEDURAL AUDIO SYNTHESIS ENGINE (WEB AUDIO API)
// =============================================================================

class BubbleAudioEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 1.0;
        this.masterGain = null;
        this.popBus = null;
        this.wandBus = null;
        this.nextPopTime = 0;
        this.noiseBuffer = null;
    }

    init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();

        // 1. Master Gain directly connected to destination (no compressor, no waveshaper)
        // Direct floating-point routing gives 100% transparent dynamics, zero ducking,
        // and zero volume attenuation regardless of bubble count or event rate!
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // 2. Independent Buses for Pops and Wand Spawns
        // Dedicated headroom so wand chimes and bubble pops never interfere with each other
        this.popBus = this.ctx.createGain();
        this.popBus.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.popBus.connect(this.masterGain);

        this.wandBus = this.ctx.createGain();
        this.wandBus.gain.setValueAtTime(0.65, this.ctx.currentTime);
        this.wandBus.connect(this.masterGain);

        // Pre-bake a 120ms white noise buffer for crisp surfactant film snaps
        const sampleRate = this.ctx.sampleRate;
        const noiseLen = Math.floor(sampleRate * 0.12);
        this.noiseBuffer = this.ctx.createBuffer(1, noiseLen, sampleRate);
        const ch = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
            ch[i] = (Math.random() * 2.0 - 1.0);
        }
    }

    resume() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {});
        }
    }

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    setEnabled(enabled) {
        this.enabled = !!enabled;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playPop(radius = 24) {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx) return;

        // Generous 38ms lookahead window: ensures CoreAudio / hardware thread ALWAYS
        // receives audio graph instructions ahead of time, even under heavy multi-bubble rendering loads.
        const now = this.ctx.currentTime;
        const baseTime = now + 0.038;
        if (this.nextPopTime < baseTime) {
            this.nextPopTime = baseTime;
        }

        const startTime = this.nextPopTime;
        // Advance cascade queue by 14ms per pop, capping queue backlog to +220ms max
        // so dense pops create a rich, distinct bubble-wrap crackle without overlapping backwards
        this.nextPopTime = Math.min(this.nextPopTime + 0.014, baseTime + 0.22);

        const r = Math.max(4, Math.min(90, radius));

        // Pitch inversely proportional to bubble radius (Helmholtz cavity resonance):
        const f0 = Math.max(160, Math.min(1150, 500.0 * Math.pow(24.0 / r, 0.52)));
        const f1 = f0 * 0.35;
        const dur = Math.max(0.050, Math.min(0.095, 0.055 + (r / 100.0) * 0.040));

        // 1. Primary cavity impulse: Sine wave downward frequency swoop
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(f0, startTime);
        osc1.frequency.exponentialRampToValueAtTime(Math.max(25, f1), startTime + dur * 0.75);

        gain1.gain.setValueAtTime(0.0001, startTime);
        gain1.gain.linearRampToValueAtTime(0.85, startTime + 0.006);
        gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        osc1.connect(gain1);
        gain1.connect(this.popBus);
        osc1.start(startTime);
        osc1.stop(startTime + dur + 0.005);

        // 2. Harmonic overtone (triangle wave at 1.5x freq): gives punch & snap
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(f0 * 1.5, startTime);
        osc2.frequency.exponentialRampToValueAtTime(Math.max(35, f1 * 1.3), startTime + dur * 0.45);

        gain2.gain.setValueAtTime(0.0001, startTime);
        gain2.gain.linearRampToValueAtTime(0.35, startTime + 0.004);
        gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + dur * 0.50);

        osc2.connect(gain2);
        gain2.connect(this.popBus);
        osc2.start(startTime);
        osc2.stop(startTime + dur * 0.55);

        // 3. Surfactant liquid droplet snap: punchy bandpass noise burst
        let noiseSrc = null;
        let bq = null;
        let noiseGain = null;

        if (this.noiseBuffer) {
            noiseSrc = this.ctx.createBufferSource();
            noiseSrc.buffer = this.noiseBuffer;

            bq = this.ctx.createBiquadFilter();
            bq.type = "bandpass";
            bq.frequency.setValueAtTime(Math.min(5000, f0 * 3.0 + 1400), startTime);
            bq.Q.setValueAtTime(2.2, startTime);

            noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.50, startTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.022);

            noiseSrc.connect(bq);
            bq.connect(noiseGain);
            noiseGain.connect(this.popBus);

            noiseSrc.start(startTime);
            noiseSrc.stop(startTime + 0.025);
        }

        // Guaranteed leak-free cleanup: timer runs on main thread after playback finishes
        const cleanupMs = Math.ceil((startTime - now + dur + 0.08) * 1000);
        setTimeout(() => {
            try {
                osc1.disconnect();
                gain1.disconnect();
                osc2.disconnect();
                gain2.disconnect();
                if (noiseSrc) {
                    noiseSrc.disconnect();
                    bq.disconnect();
                    noiseGain.disconnect();
                }
            } catch (e) {}
        }, cleanupMs);
    }

    playWandSpawn(radius = 20) {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx) return;

        // Generous 38ms lookahead window: shields audio synthesis from main-thread
        // rendering or GPU compositing load, guaranteeing full transient volume at all bubble populations.
        const startTime = this.ctx.currentTime + 0.038;
        const r = Math.max(6, Math.min(80, radius));
        // Upward bubbling chime freq
        const freq = 680 + Math.random() * 180 + (24.0 / r) * 85;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq * 0.88, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.32, startTime + 0.055);

        // Rich, warm water chime envelope: 16ms attack to full peak (0.52), gentle 90ms decay
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.52, startTime + 0.016);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.095);

        osc.connect(gain);
        gain.connect(this.wandBus);

        osc.start(startTime);
        osc.stop(startTime + 0.105);

        // Guaranteed leak-free cleanup: timer runs on main thread after playback finishes
        setTimeout(() => {
            try {
                osc.disconnect();
                gain.disconnect();
            } catch (e) {}
        }, 160);
    }
}

// =============================================================================
// 6. APPLICATION CONTROLLER & USER INTERACTION
// =============================================================================

class BubbleApp {
    constructor() {
        this.canvas = document.getElementById("viewport-canvas");
        this.ctx = this.canvas.getContext("2d");

        this.sim = new BubbleSimulation(900, 900, "Circular Dish");
        this.audio = new BubbleAudioEngine();
        this.sim.onPopCallback = (r) => this.audio.playPop(r);

        this.isPlaying = true;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;
        this.fpsTimer = performance.now();

        // Parameters
        this.coverage = 0.60;
        this.meanRadius = 24.0;
        this.variation = 0.55;
        this.distType = "Log-Normal";
        this.paletteName = "Iridescent Soap Film";
        this.lineWidth = 1.8;
        this.filmSaturation = 0.75;
        this.filmTransparency = 0.60;

        // Interaction Tools: "stir" | "wand" | "pin"
        this.interactionMode = "stir";
        this.wandRadius = 22.0;
        this.isDragging = false;
        this.lastMouse = [0, 0];
        this.dragStart = [0, 0];
        this.lastWandSpawnPos = [0, 0];
        this.lastWandSpawnTime = 0;
        this.pinTrail = [];

        this.initUI();
        this.initCanvas();
        this.regenerate();
        this.animate();
    }

    initCanvas() {
        const resize = () => {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            const dpr = Math.min(2.0, window.devicePixelRatio || 1.0);
            this.canvas.width = Math.round(rect.width * dpr);
            this.canvas.height = Math.round(rect.height * dpr);
            this.canvas.style.width = `${rect.width}px`;
            this.canvas.style.height = `${rect.height}px`;

            // Adjust simulation domain and smoothly recenter bubble raft on resize
            const oldCenter = this.sim.center ? [this.sim.center[0], this.sim.center[1]] : [rect.width / 2.0, rect.height / 2.0];
            const newCenter = [rect.width / 2.0, rect.height / 2.0];
            const dx = newCenter[0] - oldCenter[0];
            const dy = newCenter[1] - oldCenter[1];

            if (this.sim.numBubbles > 0 && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
                for (let i = 0; i < this.sim.numBubbles; i++) {
                    this.sim.pos[i * 2] += dx;
                    this.sim.pos[i * 2 + 1] += dy;
                }
            }

            const simDim = Math.min(rect.width, rect.height);
            this.sim.w = rect.width;
            this.sim.h = rect.height;
            this.sim.center = newCenter;
            this.sim.radiusContainer = simDim * 0.44;
        };

        this.resizeCanvas = resize;
        window.addEventListener("resize", resize);
        resize();

        // Unlock audio on initial user gesture
        const unlockAudio = () => {
            this.audio.resume();
            window.removeEventListener("pointerdown", unlockAudio);
            window.removeEventListener("keydown", unlockAudio);
        };
        window.addEventListener("pointerdown", unlockAudio, { passive: true });
        window.addEventListener("keydown", unlockAudio, { passive: true });

        // Mouse & Touch interaction
        const getCanvasCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return [clientX - rect.left, clientY - rect.top];
        };

        const onDown = (e) => {
            this.audio.resume();
            this.isDragging = true;
            this.lastMouse = getCanvasCoords(e);
            this.dragStart = [...this.lastMouse];

            if (this.interactionMode === "wand") {
                this.lastWandSpawnPos = [...this.lastMouse];
                this.lastWandSpawnTime = performance.now();
                this.spawnWandBubble(this.lastMouse[0], this.lastMouse[1], 0, 0);
            } else if (this.interactionMode === "pin") {
                this.pinTrail = [{ x: this.lastMouse[0], y: this.lastMouse[1], time: performance.now() }];
                this.popBubblesAlongSegment(this.lastMouse[0], this.lastMouse[1], this.lastMouse[0], this.lastMouse[1]);
            }
        };

        const onMove = (e) => {
            if (!this.isDragging) return;
            const curr = getCanvasCoords(e);

            if (this.interactionMode === "stir") {
                const vx = (curr[0] - this.lastMouse[0]) * 1.5;
                const vy = (curr[1] - this.lastMouse[1]) * 1.5;
                this.sim.stirWater(curr[0], curr[1], vx, vy, 100.0);
            } else if (this.interactionMode === "wand") {
                const dx = curr[0] - this.lastWandSpawnPos[0];
                const dy = curr[1] - this.lastWandSpawnPos[1];
                const dist = Math.hypot(dx, dy);
                const now = performance.now();
                const dt = now - this.lastWandSpawnTime;
                const minSpacing = Math.max(12, this.wandRadius * 0.70);

                if (dist >= minSpacing || (dt >= 45 && dist >= 8)) {
                    const vx = (curr[0] - this.lastWandSpawnPos[0]) * 0.35;
                    const vy = (curr[1] - this.lastWandSpawnPos[1]) * 0.35;
                    this.spawnWandBubble(curr[0], curr[1], vx, vy);
                    this.lastWandSpawnPos = [...curr];
                    this.lastWandSpawnTime = now;
                }
            } else if (this.interactionMode === "pin") {
                this.pinTrail.push({ x: curr[0], y: curr[1], time: performance.now() });
                if (this.pinTrail.length > 15) this.pinTrail.shift();
                this.popBubblesAlongSegment(this.lastMouse[0], this.lastMouse[1], curr[0], curr[1]);
            }

            this.lastMouse = curr;
        };

        const onUp = (e) => {
            if (this.isDragging) {
                const curr = this.lastMouse;
                const distMoved = this.dragStart
                    ? Math.hypot(curr[0] - this.dragStart[0], curr[1] - this.dragStart[1])
                    : 0;

                if (this.interactionMode === "stir") {
                    // Quick tap/click (< 6px movement)
                    if (distMoved < 6.0) {
                        const clickedIdx = this.findBubbleAt(curr[0], curr[1]);
                        if (clickedIdx >= 0) {
                            this.sim.triggerPop(clickedIdx);
                            this.updateStats();
                            this.showToast("Pop! 💥");
                        } else {
                            // Clicked in open water -> spawn new bubble
                            const distCenter = Math.hypot(curr[0] - this.sim.center[0], curr[1] - this.sim.center[1]);
                            if (this.sim.containerType !== "Circular Dish" || distCenter < this.sim.radiusContainer) {
                                const r = Math.max(6, Math.round(this.meanRadius * (0.6 + Math.random() * 0.8)));
                                this.sim.addBubble(curr[0], curr[1], r);
                                this.audio.playWandSpawn(r);
                                this.updateStats();
                            }
                        }
                    }
                } else if (this.interactionMode === "pin") {
                    this.pinTrail = [];
                }
            }
            this.isDragging = false;
        };

        this.canvas.addEventListener("mousedown", onDown);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);

        this.canvas.addEventListener("touchstart", onDown, { passive: true });
        window.addEventListener("touchmove", onMove, { passive: true });
        window.addEventListener("touchend", onUp);
    }

    setInteractionMode(mode) {
        if (!["stir", "wand", "pin"].includes(mode)) return;
        this.interactionMode = mode;

        // Update canvas container styling
        const container = document.getElementById("canvas-container");
        container.classList.remove("mode-stir", "mode-wand", "mode-pin");
        container.classList.add(`mode-${mode}`);

        // Update sidebar tool buttons
        document.querySelectorAll(".tool-select-btn").forEach(b => {
            b.classList.toggle("active", b.getAttribute("data-mode") === mode);
        });

        // Update badge
        const badge = document.getElementById("val-active-tool");

        if (mode === "stir") {
            if (badge) badge.textContent = "🌊 Stir Fluid";
            this.showToast("Stir / Swirl Mode Active 🌊");
        } else if (mode === "wand") {
            if (badge) badge.textContent = "🪄 Bubble Wand";
            this.showToast("Bubble Wand Mode Active 🪄");
        } else if (mode === "pin") {
            if (badge) badge.textContent = "📍 Pin Needle";
            this.showToast("Pin / Needle Mode Active 📍");
        }
    }

    spawnWandBubble(x, y, vx = 0, vy = 0) {
        // Population safety cap
        if (this.sim.numBubbles >= 650) {
            this.showToast("Maximum bubble capacity reached (650)");
            return;
        }

        // Boundary constraint for circular dish
        if (this.sim.containerType === "Circular Dish") {
            const dist = Math.hypot(x - this.sim.center[0], y - this.sim.center[1]);
            if (dist > this.sim.radiusContainer * 0.96) return;
        }

        // Discrete radius variants (4 steps) guarantee 100% texture cache hits during continuous wand dragging
        const wandScales = [0.80, 0.92, 1.05, 1.18];
        const scale = wandScales[Math.floor(Math.random() * wandScales.length)];
        const r = Math.max(5, Math.round(this.wandRadius * scale));

        // Slight orthogonal puff velocity
        const perpX = -vy * 0.25 + (Math.random() - 0.5) * 2.0;
        const perpY = vx * 0.25 + (Math.random() - 0.5) * 2.0;

        this.sim.addBubble(x, y, r, vx + perpX, vy + perpY);
        this.audio.playWandSpawn(r);
        this.updateStats();
    }

    popBubblesAlongSegment(x0, y0, x1, y1) {
        const vx = x1 - x0;
        const vy = y1 - y0;
        const lenSq = vx * vx + vy * vy;
        let poppedAny = false;

        // Iterate backwards so removeBubble index shifting never misses or double-checks
        for (let i = this.sim.numBubbles - 1; i >= 0; i--) {
            const bx = this.sim.pos[i * 2];
            const by = this.sim.pos[i * 2 + 1];
            const br = this.sim.radii[i];

            let dist;
            if (lenSq < 1e-4) {
                dist = Math.hypot(x0 - bx, y0 - by);
            } else {
                const t = Math.max(0, Math.min(1, ((bx - x0) * vx + (by - y0) * vy) / lenSq));
                const qx = x0 + t * vx;
                const qy = y0 + t * vy;
                dist = Math.hypot(bx - qx, by - qy);
            }

            // Needle tip hits bubble membrane
            if (dist <= br + 1.5) {
                this.sim.triggerPop(i);
                poppedAny = true;
            }
        }

        if (poppedAny) {
            this.updateStats();
        }
    }

    findBubbleAt(x, y) {
        // Test topmost bubbles first
        for (let i = this.sim.numBubbles - 1; i >= 0; i--) {
            const bx = this.sim.pos[i * 2];
            const by = this.sim.pos[i * 2 + 1];
            const br = this.sim.radii[i];
            if (Math.hypot(x - bx, y - by) <= br) {
                return i;
            }
        }
        return -1;
    }

    initUI() {
        const bindSlider = (id, badgeId, prop, fmt, postUpdate = null) => {
            const slider = document.getElementById(id);
            const badge = document.getElementById(badgeId);
            slider.addEventListener("input", (e) => {
                const val = parseFloat(e.target.value);
                this[prop] = val;
                badge.textContent = fmt(val);
                if (postUpdate) postUpdate(val);
            });
        };

        // Tool mode buttons (Sidebar)
        document.querySelectorAll(".tool-select-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const mode = btn.getAttribute("data-mode");
                this.setInteractionMode(mode);
            });
        });

        // Wand size slider
        bindSlider("slider-wand-size", "val-wand-size", "wandRadius", v => `${Math.round(v)} px`);

        // Sound toggle and floating sound button
        const checkSound = document.getElementById("check-sound");
        const btnFloatingSound = document.getElementById("btn-floating-sound");
        const iconSoundOn = document.getElementById("icon-sound-on");
        const iconSoundOff = document.getElementById("icon-sound-off");

        const updateSoundUI = (enabled) => {
            if (checkSound) checkSound.checked = enabled;
            if (iconSoundOn) iconSoundOn.classList.toggle("hidden", !enabled);
            if (iconSoundOff) iconSoundOff.classList.toggle("hidden", enabled);
        };

        if (checkSound) {
            checkSound.addEventListener("change", (e) => {
                this.audio.setEnabled(e.target.checked);
                updateSoundUI(e.target.checked);
                this.showToast(e.target.checked ? "Sound Enabled 🔊" : "Sound Muted 🔇");
            });
        }

        if (btnFloatingSound) {
            btnFloatingSound.addEventListener("click", () => {
                const enabled = this.audio.toggle();
                updateSoundUI(enabled);
                this.showToast(enabled ? "Sound Enabled 🔊" : "Sound Muted 🔇");
            });
        }

        // Sound volume slider
        bindSlider("slider-sound-volume", "val-sound-volume", "soundVolume", v => `${Math.round(v * 100)}%`, v => this.audio.setVolume(v));

        bindSlider("slider-coverage", "val-coverage", "coverage", v => `${Math.round(v * 100)}%`, () => this.regenerate());
        bindSlider("slider-mean-radius", "val-mean-radius", "meanRadius", v => `${v} px`, () => this.regenerate());
        bindSlider("slider-variation", "val-variation", "variation", v => `${Math.round(v * 100)}%`, () => this.regenerate());

        document.getElementById("select-dist").addEventListener("change", (e) => {
            this.distType = e.target.value;
            this.regenerate();
        });

        bindSlider("slider-attraction", "val-attraction", "attraction", v => v.toFixed(2), v => this.sim.kAttraction = v);
        bindSlider("slider-repulsion", "val-repulsion", "repulsion", v => v.toFixed(2), v => this.sim.kRepulsion = v);
        bindSlider("slider-agitation", "val-agitation", "agitation", v => v.toFixed(2), v => this.sim.agitation = v);

        // Popping toggle & acute sensitivity
        const checkPopping = document.getElementById("check-popping");
        const rowPopAngle = document.getElementById("row-pop-angle");
        if (checkPopping) {
            checkPopping.checked = this.sim.poppingEnabled;
            checkPopping.addEventListener("change", (e) => {
                this.sim.poppingEnabled = e.target.checked;
                if (rowPopAngle) {
                    rowPopAngle.style.display = e.target.checked ? "flex" : "none";
                }
                this.showToast(e.target.checked ? "Bubble Popping Enabled (Click or Pinch)" : "Bubbles are now indestructible!");
            });
        }

        bindSlider("slider-pop-angle", "val-pop-angle", "popAngle", v => `${Math.round(v)}°`, v => this.sim.popAcuteAngleThreshold = v);

        document.getElementById("select-container").addEventListener("change", (e) => {
            this.sim.containerType = e.target.value;
            this.regenerate();
        });

        document.getElementById("select-palette").addEventListener("change", (e) => {
            this.paletteName = e.target.value;
        });

        bindSlider("slider-line-width", "val-line-width", "lineWidth", v => `${v.toFixed(1)} px`);
        bindSlider("slider-film-saturation", "val-film-saturation", "filmSaturation", v => `${Math.round(v * 100)}%`);
        bindSlider("slider-film-transparency", "val-film-transparency", "filmTransparency", v => `${Math.round(v * 100)}%`);

        // Presets
        document.getElementById("select-preset").addEventListener("change", (e) => {
            this.loadPreset(e.target.value);
        });

        // Action buttons
        document.getElementById("btn-regen").addEventListener("click", () => this.regenerate());
        document.getElementById("btn-settle").addEventListener("click", () => this.fastSettle());
        document.getElementById("btn-floating-settle").addEventListener("click", () => this.fastSettle());

        // Pause / Play
        const btnPause = document.getElementById("btn-floating-pause");
        const iconPause = document.getElementById("icon-pause");
        const iconPlay = document.getElementById("icon-play");
        const togglePlay = () => {
            this.isPlaying = !this.isPlaying;
            iconPause.classList.toggle("hidden", !this.isPlaying);
            iconPlay.classList.toggle("hidden", this.isPlaying);
            this.showToast(this.isPlaying ? "Simulation Resumed" : "Simulation Paused");
        };
        btnPause.addEventListener("click", togglePlay);

        // Keyboard shortcuts
        window.addEventListener("keydown", (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
            if (e.code === "Space") {
                e.preventDefault();
                togglePlay();
            } else if (e.code === "KeyR") {
                this.regenerate();
            } else if (e.code === "KeyS") {
                this.fastSettle();
            } else if (e.code === "Digit1" || e.code === "KeyT") {
                this.setInteractionMode("stir");
            } else if (e.code === "Digit2" || e.code === "KeyW") {
                this.setInteractionMode("wand");
            } else if (e.code === "Digit3" || e.code === "KeyP") {
                this.setInteractionMode("pin");
            } else if (e.code === "KeyM") {
                const enabled = this.audio.toggle();
                updateSoundUI(enabled);
                this.showToast(enabled ? "Sound Enabled 🔊" : "Sound Muted 🔇");
            }
        });

        // Fullscreen & Sidebar Hiding State Management
        this.isFullscreen = false;
        const appContainer = document.getElementById("app-container");
        const controlPanel = document.getElementById("control-panel");
        const btnFullscreen = document.getElementById("btn-floating-fullscreen");
        const btnCollapseSidebar = document.getElementById("btn-collapse-sidebar");

        const setFullscreenState = (active) => {
            this.isFullscreen = active;
            document.body.classList.toggle("is-fullscreen", active);
            if (appContainer) {
                appContainer.classList.toggle("fullscreen-active", active);
                appContainer.classList.toggle("sidebar-hidden", active);
            }
            if (controlPanel) {
                controlPanel.classList.toggle("hidden-fullscreen", active);
                // Guaranteed inline style fallback in case of cached CSS
                controlPanel.style.display = active ? "none" : "";
            }
            if (btnFullscreen) {
                btnFullscreen.title = active ? "Show Menu / Exit Fullscreen (F or Esc)" : "Hide Menu / Enter Fullscreen (F)";
            }
            if (this.resizeCanvas) {
                requestAnimationFrame(() => this.resizeCanvas());
                setTimeout(() => this.resizeCanvas(), 50);
                setTimeout(() => this.resizeCanvas(), 200);
            }
        };

        const toggleFullscreen = () => {
            const isNative = !!(document.fullscreenElement || document.webkitFullscreenElement);
            const shouldBeFull = !this.isFullscreen && !isNative;

            setFullscreenState(shouldBeFull);

            if (shouldBeFull) {
                const target = appContainer || document.documentElement;
                if (target.requestFullscreen) {
                    target.requestFullscreen().catch(() => {});
                } else if (target.webkitRequestFullscreen) {
                    target.webkitRequestFullscreen();
                }
                this.showToast("Fullscreen Active (Press Esc or F to exit)");
            } else {
                if (isNative) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch(() => {});
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                }
            }
        };

        if (btnFullscreen) {
            btnFullscreen.addEventListener("click", toggleFullscreen);
        }

        if (btnCollapseSidebar) {
            btnCollapseSidebar.addEventListener("click", toggleFullscreen);
        }

        const onNativeFullscreenChange = () => {
            const isNative = !!(document.fullscreenElement || document.webkitFullscreenElement);
            setFullscreenState(isNative);
        };
        document.addEventListener("fullscreenchange", onNativeFullscreenChange);
        document.addEventListener("webkitfullscreenchange", onNativeFullscreenChange);

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.isFullscreen) {
                setFullscreenState(false);
            } else if ((e.key === "f" || e.key === "F") && !e.target.matches("input, select, textarea")) {
                toggleFullscreen();
            }
        });

        // Export PNG & SVG
        document.getElementById("btn-export-png").addEventListener("click", () => {
            this.showToast("Rendering Master 4500×5400 PNG...");
            setTimeout(() => {
                BubbleRenderer.exportPNG(this.sim, {
                    paletteName: this.paletteName,
                    lineWidth: this.lineWidth,
                    filmSaturation: this.filmSaturation,
                    filmTransparency: this.filmTransparency
                });
                this.showToast("4500×5400 PNG Downloaded!");
            }, 100);
        });

        document.getElementById("btn-export-svg").addEventListener("click", () => {
            this.showToast("Generating Vector SVG...");
            setTimeout(() => {
                BubbleRenderer.exportSVG(this.sim, {
                    lineWidth: this.lineWidth
                });
                this.showToast("Vector SVG Downloaded!");
            }, 50);
        });
    }

    loadPreset(name) {
        const p = PRESETS[name];
        if (!p) return;

        this.coverage = p.coverage;
        this.meanRadius = p.mean_radius;
        this.variation = p.variation;
        this.distType = p.dist;
        this.paletteName = p.palette;
        this.lineWidth = p.line_width;
        this.sim.kAttraction = p.attraction;
        this.sim.kRepulsion = p.repulsion ?? 1.3;
        this.sim.agitation = p.agitation;
        this.sim.containerType = p.container ?? "Circular Dish";

        // Update form controls
        document.getElementById("slider-coverage").value = this.coverage;
        document.getElementById("val-coverage").textContent = `${Math.round(this.coverage * 100)}%`;

        document.getElementById("slider-mean-radius").value = this.meanRadius;
        document.getElementById("val-mean-radius").textContent = `${this.meanRadius} px`;

        document.getElementById("slider-variation").value = this.variation;
        document.getElementById("val-variation").textContent = `${Math.round(this.variation * 100)}%`;

        document.getElementById("select-dist").value = this.distType;
        document.getElementById("select-palette").value = this.paletteName;
        document.getElementById("select-container").value = this.sim.containerType;

        document.getElementById("slider-line-width").value = this.lineWidth;
        document.getElementById("val-line-width").textContent = `${this.lineWidth.toFixed(1)} px`;

        document.getElementById("slider-attraction").value = this.sim.kAttraction;
        document.getElementById("val-attraction").textContent = this.sim.kAttraction.toFixed(2);

        document.getElementById("slider-repulsion").value = this.sim.kRepulsion;
        document.getElementById("val-repulsion").textContent = this.sim.kRepulsion.toFixed(2);

        document.getElementById("slider-agitation").value = this.sim.agitation;
        document.getElementById("val-agitation").textContent = this.sim.agitation.toFixed(2);

        this.regenerate();
        this.fastSettle();
        this.showToast(`Preset: ${name}`);
    }

    regenerate() {
        const domainArea = this.sim.containerType === "Circular Dish"
            ? Math.PI * this.sim.radiusContainer * this.sim.radiusContainer
            : this.sim.w * this.sim.h * 0.70;

        const radii = generateRadii(
            this.coverage,
            this.meanRadius,
            this.variation,
            this.distType,
            domainArea
        );

        this.sim.resetWithRadii(radii);
        this.updateStats();
    }

    fastSettle() {
        this.sim.fastSettle(85);
        this.showToast("Fast Settle Complete");
    }

    updateStats() {
        document.getElementById("stat-bubbles").textContent = `${this.sim.numBubbles} bubbles`;
    }

    showToast(msg) {
        const toast = document.getElementById("toast");
        toast.textContent = msg;
        toast.classList.remove("hidden");
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.add("hidden");
        }, 2200);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const dtMs = now - this.lastTime;
        this.lastTime = now;

        // FPS counter
        this.frameCount++;
        if (now - this.fpsTimer >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = now;
            document.getElementById("stat-fps").textContent = `${this.fps} FPS`;
        }

        // Advance physics simulation
        if (this.isPlaying) {
            this.sim.step(0.65);
        }

        // Render viewport
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1.0;
        this.ctx.save();
        this.ctx.scale(dpr, dpr);

        BubbleRenderer.renderScene(this.ctx, this.sim, {
            paletteName: this.paletteName,
            scale: 1.0,
            offset: [0, 0],
            lineWidth: this.lineWidth,
            filmSaturation: this.filmSaturation,
            filmTransparency: this.filmTransparency
        });

        // Pin needle slash visual trail
        if (this.interactionMode === "pin" && this.pinTrail.length > 1) {
            const cutOffTime = now - 180;
            while (this.pinTrail.length > 0 && this.pinTrail[0].time < cutOffTime) {
                this.pinTrail.shift();
            }
            if (this.pinTrail.length > 1) {
                this.ctx.save();
                this.ctx.lineCap = "round";
                this.ctx.lineJoin = "round";
                for (let k = 1; k < this.pinTrail.length; k++) {
                    const age = (now - this.pinTrail[k].time) / 180.0;
                    const alpha = Math.max(0, 1.0 - age);
                    this.ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.85})`;
                    this.ctx.lineWidth = Math.max(1.5, 3.5 * (1.0 - age));
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = "rgba(56, 189, 248, 0.9)";
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.pinTrail[k - 1].x, this.pinTrail[k - 1].y);
                    this.ctx.lineTo(this.pinTrail[k].x, this.pinTrail[k].y);
                    this.ctx.stroke();
                }
                this.ctx.restore();
            }
        }

        this.ctx.restore();
    }
}

// Launch application on DOM load
window.addEventListener("DOMContentLoaded", () => {
    window.app = new BubbleApp();
});
