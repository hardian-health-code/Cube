

Hardian cube 
==============================================================================


![hardian-large](https://github.com/HardianHealth/Cube/assets/95474781/79d57f1a-b0da-4a4e-bb76-afbeb80ec710)




Install
------------------------------------------------------------------------------

__From the desktop__  
Simply drop the `index.html` file onto a Chrome browser window.

__From an ad-hoc server__  
From the command line type the following to create a server, where `8000` 
(the default) is an optional port number argument:
`python -m SimpleHTTPServer 8000`

__From Apache__  
The file `/.htaccess` is configured to require a valid login which you will 
need to configure on your own server. Alternatively this file can be removed
from the package entirely.





Building
------------------------------------------------------------------------------

`js/cube/cuber.min.js` and its source map are built from `js/cube/cuber.js`
with [esbuild](https://esbuild.github.io/). After editing `cuber.js`, run:

```
npm install
npm run build
```

This rewrites `js/cube/cuber.min.js`, `js/cube/cuber.min.js.map` and the
embed bundle `dist/hardian-cube.js`; commit them alongside your change to
`cuber.js`.



Embed on another site (Squarespace etc.)
------------------------------------------------------------------------------

`dist/hardian-cube.js` is a single self-contained script: the cube engine,
its styles (scoped under `.hardian-cube`) and the logo are all inlined. It
mounts a cube into every element with a `data-hardian-cube` attribute,
including ones that appear later, so it can be loaded once site-wide.

Paste this into a Squarespace Code Block (or any HTML):

```html
<div data-hardian-cube data-height="500px"></div>
<script defer src="https://cdn.jsdelivr.net/gh/hardian-health-code/Cube@main/dist/hardian-cube.js"></script>
```

To use it on many pages, put the `<script>` line in Settings → Advanced →
Code Injection → Footer instead, and add just the `<div>` in a Code Block
wherever a cube should appear. Loading the script twice is harmless.

Options, as attributes on the `<div>`:

| Attribute | Default | |
|---|---|---|
| `data-height` | `400px` | Height of the cube area, if the element has none from CSS |
| `data-background` | `#fff` | Background colour |
| `data-controls` | `true` | Show the Reshuffle and Solve buttons under the cube |
| `data-hint` | `true` | Show the faint looped arrow by the cube that hints it can be dragged around |
| `data-keyboard` | `false` | Let letter keys twist the cube |
| `data-shuffle` | `10` | Moves in the scramble played when the cube scrolls into view (`0` for none) |

`window.HardianCube.mount(element)` mounts one by hand and returns the cube.

Solve plays back every move since the cube was last solved, in reverse, and
turns the whole cube back to its starting orientation with the logo facing
front. In the Squarespace editor a placeholder shows instead of the cube.

After changing `js/cube/cuber.js`, `styles/cube.css` or anything in `embed/`,
run `npm run build` and commit `dist/hardian-cube.js`.
jsDelivr caches `@main` for up to a day; pin a tag (`@v1.0.0`) for a stable
URL or purge it at `https://purge.jsdelivr.net/gh/hardian-health-code/Cube@main/dist/hardian-cube.js`.
