

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

This rewrites `js/cube/cuber.min.js` and `js/cube/cuber.min.js.map`; commit
both alongside your change to `cuber.js`.
