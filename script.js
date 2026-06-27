const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

/**
 * 
 * A number `c` is in the MANDELBROT set when:
 * Z_{n+1} = Z_n² + C
 * 
 * where, 
 *  Z_n = starting point
 *  Z_{n+1} = next point
 *  c = set of all numbers (real and imaginary)
 * 
 */

// --- Sizing ---
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();
const W = canvas.width,
    H = canvas.height;

// --- Camera State ---
let zoom = 280;
let offsetX = -2.5;
let offsetY = -1.5;
const MAX_ITER = 120;

// --- Touch State ---
let lastTouchDist = 0;
let lastTouchX = 0;
let lastTouchY = 0;
let isDragging = false;
let isPinching = false;

// ============================================================
//  COLOR PALETTES
// ============================================================
const PALETTES = [
    {
        name: 'Psychedelic',
        fn: (iter, maxIter) => {
            if (iter === maxIter) return { r: 0, g: 0, b: 0 };
            const v = iter / maxIter;
            const r1 = 128 + 127 * Math.sin(v * 8.0 + 0.0);
            const g1 = 128 + 127 * Math.sin(v * 8.0 + 2.09);
            const b1 = 128 + 127 * Math.sin(v * 8.0 + 4.18);
            const r2 = 128 + 127 * Math.cos(v * 13.0 + 1.5);
            const g2 = 128 + 127 * Math.cos(v * 13.0 + 3.6);
            const b2 = 128 + 127 * Math.cos(v * 13.0 + 5.7);
            let r = Math.floor((r1 + r2) % 256);
            let g = Math.floor((g1 + g2) % 256);
            let b = Math.floor((b1 + b2) % 256);
            return {
                r: Math.min(255, Math.max(0, r)),
                g: Math.min(255, Math.max(0, g)),
                b: Math.min(255, Math.max(0, b))
            };
        }
    },
    {
        name: 'Monochrome (Teal)',
        fn: (iter, maxIter) => {
            if (iter === maxIter) return { r: 0, g: 0, b: 0 };
            const v = iter / maxIter;
            const brightness = Math.floor(255 * (1 - v * v));
            // Teal tint: #5BA8A0
            return {
                r: Math.floor(brightness * 0.36),
                g: Math.floor(brightness * 0.66),
                b: Math.floor(brightness * 0.63)
            };
        }
    },
    {
        name: 'Fire',
        fn: (iter, maxIter) => {
            if (iter === maxIter) return { r: 0, g: 0, b: 0 };
            const v = iter / maxIter;
            const r = Math.floor(255 * (1 - Math.exp(-v * 4)));
            const g = Math.floor(255 * (1 - Math.exp(-v * 2)));
            const b = Math.floor(255 * (1 - Math.exp(-v * 0.8)));
            return {
                r: Math.min(255, r),
                g: Math.min(255, g * 0.5),
                b: Math.min(255, b * 0.2)
            };
        }
    },
    {
        name: 'Ocean (Blue/Cyan)',
        fn: (iter, maxIter) => {
            if (iter === maxIter) return { r: 0, g: 0, b: 0 };
            const v = iter / maxIter;
            const r = 128 + 127 * Math.sin(v * 6.0 + 1.2);
            const g = 128 + 127 * Math.sin(v * 6.0 + 0.5);
            const b = 128 + 127 * Math.sin(v * 8.0 + 0.0);
            return {
                r: Math.floor(Math.max(0, r * 0.3)),
                g: Math.floor(Math.min(255, g)),
                b: Math.floor(Math.min(255, b * 1.2))
            };
        }
    },
    {
        name: 'Pastel',
        fn: (iter, maxIter) => {
            if (iter === maxIter) return { r: 0, g: 0, b: 0 };
            const v = iter / maxIter;
            const r = 128 + 127 * Math.sin(v * 5.0 + 0.0);
            const g = 128 + 127 * Math.sin(v * 5.0 + 2.0);
            const b = 128 + 127 * Math.sin(v * 5.0 + 4.0);
            return {
                r: Math.floor(128 + (r - 128) * 0.6),
                g: Math.floor(128 + (g - 128) * 0.6),
                b: Math.floor(128 + (b - 128) * 0.6)
            };
        }
    }
];

let currentPaletteIndex = 0;

// --- The Render Engine ---
function render() {
    const imageData = ctx.createImageData(W, H);
    const data = imageData.data;
    let idx = 0;
    const palette = PALETTES[currentPaletteIndex].fn;

    for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
            const cx = px / zoom + offsetX;
            const cy = py / zoom + offsetY;

            let a = 0,
                b = 0;
            let iter = 0;

            while (iter < MAX_ITER) {
                const aSq = a * a;
                const bSq = b * b;
                if (aSq + bSq > 4.0) break;
                const newA = aSq - bSq + cx;
                const newB = 2 * a * b + cy;
                a = newA;
                b = newB;
                iter++;
            }

            const color = palette(iter, MAX_ITER);

            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
            idx += 4;
        }
    }
    ctx.putImageData(imageData, 0, 0);

    const infoSpan = document.querySelector('#info span');
    if (infoSpan) {
        infoSpan.textContent = `Zoom: ${zoom.toFixed(1)}x | Drag to pan`;
    }
}

// --- ZOOM LOGIC ---
function applyZoom(factor, anchorX, anchorY) {
    const mathX = anchorX / zoom + offsetX;
    const mathY = anchorY / zoom + offsetY;

    let newZoom = zoom * factor;
    if (newZoom > 1e14) newZoom = 1e14;
    if (newZoom < 1) newZoom = 1;
    zoom = newZoom;

    offsetX = mathX - (anchorX / zoom);
    offsetY = mathY - (anchorY / zoom);

    render();
}

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 1 / 1.1 : 1.1;
    applyZoom(factor, mx, my);
}, { passive: false });

let isMouseDown = false;
let lastMouseX = 0,
    lastMouseY = 0;

canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    offsetX -= dx / zoom;
    offsetY -= dy / zoom;
    render();
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touches = e.touches;
    if (touches.length === 1) {
        isDragging = true;
        isPinching = false;
        lastTouchX = touches[0].clientX;
        lastTouchY = touches[0].clientY;
    } else if (touches.length === 2) {
        isPinching = true;
        isDragging = false;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
        lastTouchX = (touches[0].clientX + touches[1].clientX) / 2;
        lastTouchY = (touches[0].clientY + touches[1].clientY) / 2;
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touches = e.touches;

    if (touches.length === 1 && isDragging) {
        const dx = touches[0].clientX - lastTouchX;
        const dy = touches[0].clientY - lastTouchY;
        lastTouchX = touches[0].clientX;
        lastTouchY = touches[0].clientY;

        offsetX -= dx / zoom;
        offsetY -= dy / zoom;
        render();

    } else if (touches.length === 2 && isPinching) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        const midX = (touches[0].clientX + touches[1].clientX) / 2;
        const midY = (touches[0].clientY + touches[1].clientY) / 2;
        const rect = canvas.getBoundingClientRect();
        const anchorX = midX - rect.left;
        const anchorY = midY - rect.top;
        const factor = currentDist / lastTouchDist;
        applyZoom(factor, anchorX, anchorY);
        lastTouchDist = currentDist;
        lastTouchX = midX;
        lastTouchY = midY;
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    isDragging = false;
    isPinching = false;
});

// --- Palette Toggle ---
const toggleBtn = document.getElementById('paletteToggle');

function cyclePalette() {
    currentPaletteIndex = (currentPaletteIndex + 1) % PALETTES.length;
    toggleBtn.textContent = `🎨 ${PALETTES[currentPaletteIndex].name}`;
    render();
}

toggleBtn.addEventListener('click', cyclePalette);

// --- Initial Render ---
render();

// --- Handle resize without reloading (dynamically update W/H) ---
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    location.reload();
});