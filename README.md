# Bubble Surface Studio & Generator (Web App)

An interactive, high-fidelity physical simulation and generator of 2D capillary bubble rafts, soap foam, and thin-film interference patterns for apparel design, print-on-demand, and generative art.

---

## Features
- **Client-Side Physics Engine**: Simulates capillary meniscus deformation (Cheerios effect), Stokes microbubble hydrodynamic drag, viscous squeeze-film collision damping, and static capillary yield stress.
- **Michel-Lévy Thin-Film Interference**: Continuous optical path length phase shifts ($\Delta = 2 n d \cos\theta$) with Marangoni fluid convection streamlines and real-time Saturation & Transparency controls.
- **Authentic Plateau Border Chords**: Planar contact clipping with single-width chord lines matching circular walls 1:1, clean $120^\circ$ triple-junction clamping, and seamless borderless modes ($0.0\text{ px}$).
- **Procedural Acoustic Sound Effects**: Physical Helmholtz cavity resonance pop synthesizer with surfactant film rupture snaps, dynamically pitch-scaled by bubble radius ($160\text{--}1400\text{Hz}$) with zero audio asset downloads.
- **Interactive Tool Modes**:
  - 🌊 **Stir / Swirl Mode (`1` / `T`)**: Drag to stir fluid vortices; click bubbles to pop / water to spawn.
  - 🪄 **Bubble Wand Mode (`2` / `W`)**: Click & drag across the water to continuously blow an effervescent stream of iridescent bubbles with velocity inertia.
  - 📍 **Pin / Needle Mode (`3` / `P`)**: Slice through bubble rafts to pop them instantly on contact like bubble wrap.
- **Foam Rupture & Popping Mechanics**: Plateau law triple-junction stress monitoring (acute angles $< 55^\circ$) and overcompression bursting with droplet particle explosions.
- **Export Studio**:
  - **4500×5400 Merch by Amazon Transparent PNG**: Rendered client-side onto high-resolution offscreen canvases at 300 DPI.
  - **Vector SVG Export**: Export clean vector `<circle>`, `<polygon>`, and `<clipPath>` definitions with zero server dependencies.

---

## How to Preview Locally

To run the web app on your local machine:
```bash
# Navigate to the bubble-web-app directory
cd bubble-web-app

# Start a simple Python HTTP server
python3 -m http.server 8000
```
Then open your browser and navigate to:
```
http://localhost:8000
```

---

## How to Publish on GitHub Pages

### Option A: Subdirectory on your existing GitHub repository
If this repository (`T-Shirt Designs`) is pushed to GitHub:
1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Pages** (in the left sidebar).
3. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
4. Select `main` branch.
5. If GitHub Pages allows choosing `/docs`, you can symlink or copy `bubble-web-app` to `docs`, or deploy directly via a GitHub Actions workflow:
   ```yaml
   # .github/workflows/deploy-pages.yml
   name: Deploy Bubble Studio to Pages
   on:
     push:
       branches: [main]
   permissions:
     contents: read
     pages: write
     id-token: write
   concurrency:
     group: "pages"
     cancel-in-progress: false
   jobs:
     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/configure-pages@v4
         - uses: actions/upload-pages-artifact@v3
           with:
             path: 'bubble-web-app'
         - uses: actions/deploy-pages@v4
           id: deployment
   ```

### Option B: Dedicated Standalone Repository
1. Create a new repository on GitHub named `Bubble-Surface-Generator` (or similar).
2. Inside the `bubble-web-app` folder:
   ```bash
   cd bubble-web-app
   git init
   git add .
   git commit -m "Initial commit of Bubble Surface Studio"
   git branch -M main
   git remote add origin git@github.com:jbcohn/Bubble-Surface-Generator.git
   git push -u origin main
   ```
3. In **Settings** > **Pages**, select **Deploy from a branch** (`main` / `/ root`).
4. Your web app will be live at `https://jbcohn.github.io/Bubble-Surface-Generator`!
