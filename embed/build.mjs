//	Builds dist/hardian-cube.js: one self-contained script (cube engine,
//	styles and logo inlined) that can be dropped onto any page.
//
//	  node embed/build.mjs
//
//	Minifies with esbuild, fetched through npx if it isn't installed.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join( dirname( fileURLToPath( import.meta.url )), '..' );
const read = path => readFileSync( join( root, path ));


//	Scope every rule under .hardian-cube so the cube's styles can't leak into
//	the host site. The logo is inlined so the bundle needs no other files, and
//	the @font-face is dropped: its font files aren't in the repo and the text
//	it styles is hidden.

const logo = 'data:image/png;base64,' + read( 'media/Hardian.png' ).toString( 'base64' );

const css = read( 'styles/cube.css' ).toString()
	.replace( /\/\*[\s\S]*?\*\//g, '' )
	.replace( /@font-face\s*{[^}]*}/g, '' )
	.replace( /url\(\s*"\.\.\/media\/Hardian\.png"\s*\)/g, `url("${ logo }")` )
	.replace( /([^{}]+){/g, ( match, selectors ) => selectors.split( ',' )
		.map( selector => '.hardian-cube ' + selector.trim().replace( /\s+/g, ' ' ))
		.join( ',' ) + '{' );

const baseCss = '.hardian-cube{position:relative;overflow:hidden;width:100%;touch-action:none;user-select:none;-webkit-user-select:none}';


//	cuber.js sets window._, which would clobber a lodash or underscore the host
//	site already has, so put the previous value back afterwards. The guard stops
//	a second copy of the script (say a site-wide one plus a block one) running.

const source = `(function(){
if( window.HardianCube ) return;
var previousUnderscore = window._;
${ read( 'js/cube/cuber.js' ) }
if( previousUnderscore !== undefined ) window._ = previousUnderscore;
var HARDIAN_CUBE_CSS = ${ JSON.stringify( baseCss + css ) };
${ read( 'embed/loader.js' ) }
})();
`;

const minified = execFileSync( 'npx', [ '--yes', 'esbuild@0.24.2', '--minify', '--loader=js', '--target=es2015', '--legal-comments=none' ], {
	input: source,
	maxBuffer: 64 * 1024 * 1024
});

mkdirSync( join( root, 'dist' ), { recursive: true });
writeFileSync( join( root, 'dist/hardian-cube.js' ), minified );
console.log( `dist/hardian-cube.js ${ ( minified.length / 1024 ).toFixed( 0 ) } KB` );
