const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const W = canvas.width;
const H = canvas.height;

let zoom = 200;        
let offsetX = -2.5;    
let offsetY = -1.5;   
const MAX_ITERATIONS = 100;

/**
 *  MANDELBROT SET
 * 
 * Z_next = Z**2 + c
 * where Z = a + bi (Z is a complex number)
 * 
 */

function render() {
  const imageData = ctx.createImageData(W, H);
  const data = imageData.data;
  let idx = 0;

  // Loop pixels
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      // Map to complex plane
      const cx = px / zoom + offsetX;
      const cy = py / zoom + offsetY;
      
      let a = 0, b = 0;
      let iter = 0;
      
      // The core loop, inlined for speed
      while (iter < MAX_ITER) {
        const aSq = a * a;
        const bSq = b * b;
        if (aSq + bSq > 4.0) break; // Escaped
        
        const newA = aSq - bSq + cx;
        const newB = 2 * a * b + cy;
        a = newA;
        b = newB;
        iter++;
      }

      // Colorize
      let r, g, bColor;
      if (iter === MAX_ITER) {
        r = g = bColor = 0; // Black inside
      } else {
        // Smooth color mapping using trig functions
        const v = iter / MAX_ITERATIONS;
        r = 255 * (0.5 + 0.5 * Math.cos(v * 3.0));
        g = 255 * (0.5 + 0.5 * Math.cos(v * 3.0 + 2.0));
        bColor = 255 * (0.5 + 0.5 * Math.cos(v * 3.0 + 4.0));
      }

      data[idx] = r;
      data[idx+1] = g;
      data[idx+2] = bColor;
      data[idx+3] = 255;
      idx += 4;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// Zoom logic
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  
  const mathX = mx / zoom + offsetX;
  const mathY = my / zoom + offsetY;
  
  const factor = e.shiftKey ? 0.5 : 2.0;
  zoom *= factor;
  
  offsetX = mathX - (mx / zoom);
  offsetY = mathY - (my / zoom);
  
  render();
});

render();

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Recalculate dimensions for W/H (they are const, so we use let instead)
  // To keep it simple, just reload the page manually or refresh the browser.
  location.reload(); 
});


function getIterations(px, py) {

    const cx = px / zoom + offsetX;
    const cy = py / zoom + offsetY;

    let a = 0; // Real part
    let b = 0; // Imaginary part

    let iteration = 0;
    const MAX_ITERATIONS = 80;

    while (iteration < MAX_ITERATIONS) {
        // Z^2
        const aSquared = a * a;
        const bSquared = b * b;

        // new_a = a^2 - b^2 + c_x
        // new_b = 2ab + c_y
        const newA = aSquared - bSquared + cx;
        const newB = 2 * a * b + cy;

        a = newA;
        b = newB;

        // If a^2 + b^2 > 4, 
        // (2^2 = 4, if it's further than 2 units from origin).
        if (aSquared + bSquared > 4) {
            return iteration; 
        }

        iteration++;
    }
    return MAX_ITERATIONS;
}

function getColor(iterations) {
    if (iterations === MAX_ITERATIONS) {
        return 'black'; // Inside the set
    }
    
    const hue = (iterations / MAX_ITERATIONS) * 360;
    return `hsl(${hue}, 100%, 60%)`; 
}

function render() {
    // Create a blank pixel buffer
    const imageData = ctx.createImageData(W, H);
    const data = imageData.data; // This is a massive 1D array of RGBA values

    let index = 0;
    for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
            // Get the math result
            const iter = getIterations(px, py);
            
            // Convert to a color (HSL -> RGB manually or just use a lookup)
            // To save time, we use the "hsl" string in a loop? Too slow for pixels.
            // We will map the iteration to a greyscale or simple RGB quickly.
            
            let r, g, b;
            if (iter === MAX_ITERATIONS) {
                r = 0; g = 0; b = 0;
            } else {
                // Quick and dirty rainbow using sine waves
                const value = iter / MAX_ITERATIONS;
                r = Math.floor(255 * (0.5 + 0.5 * Math.cos(value * 3.0)));
                g = Math.floor(255 * (0.5 + 0.5 * Math.cos(value * 3.0 + 2.0)));
                b = Math.floor(255 * (0.5 + 0.5 * Math.cos(value * 3.0 + 4.0)));
            }

            data[index] = r;     // Red
            data[index+1] = g;   // Green
            data[index+2] = b;   // Blue
            data[index+3] = 255; // Alpha (opacity)
            index += 4;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

render();

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Where did we click in math space?
    const mathX = mouseX / zoom + offsetX;
    const mathY = mouseY / zoom + offsetY;

    // Zoom factor (2x)
    const factor = e.shiftKey ? 0.5 : 2.0; // Shift+click to zoom out

    // Update zoom
    zoom = zoom * factor;

    // Recalculate offset so that the mathX/mathY point ends up exactly at the mouse pixel
    offsetX = mathX - (mouseX / zoom);
    offsetY = mathY - (mouseY / zoom);

    render();
});