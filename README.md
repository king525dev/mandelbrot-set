# The Mandelbrot Set

Check out the [Live Demo](#) 

a mathematical object defined by a recursive formula:

```
Z_{n+1} = Z_n² + C
```

where, 
- `C` is a coordinate on the complex plane.
- `Z` is your starting point (usually `0`).
- You plug `C` into the formula, get a new `Z`, then plug that `Z` back in

So, if `Z` stays close to the origin (stays within a circle of radius 2) forever, `C` is inside the set (colored black).  
If `Z` runs away to infinity, `C` is outside (colored based on how fast it escaped). The tiny loop of addition and multiplication produces infinite, non-repeating detail. Zoom in anywhere on the edge and you’ll find spirals, seahorse tails, and miniature copies of the whole set.

## The Math in JS
```
while (iter < MAX_ITER) {
    const aSq = a * a;
    const bSq = b * b;
    if (aSq + bSq > 4.0) break;      // Escaped!
    const newA = aSq - bSq + cx;     // Real part
    const newB = 2 * a * b + cy;     // Imaginary part
    a = newA;
    b = newB;
    iter++;
}
```