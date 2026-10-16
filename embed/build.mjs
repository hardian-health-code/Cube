//	Builds dist/hardian-cube.js: one self-contained script (cube engine,
//	styles and logo inlined) that can be dropped onto any page.
//
//	  npm run build   (or node embed/build.mjs after npm install)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { transformSync } from 'esbuild';
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

const embedCss = read( 'embed/embed.css' ).toString().replace( /\/\*[\s\S]*?\*\//g, '' );


//	cuber.js sets window._, which would clobber a lodash or underscore the host
//	site already has, so put the previous value back afterwards. The guard stops
//	a second copy of the script (say a site-wide one plus a block one) running.

const source = `(function(){
if( window.HardianCube ) return;
var previousUnderscore = window._;
${ read( 'js/cube/cuber.js' ) }
if( previousUnderscore !== undefined ) window._ = previousUnderscore;
var HARDIAN_CUBE_CSS = ${ JSON.stringify( css + embedCss ) };
${ read( 'embed/loader.js' ) }
})();
`;

const minified = transformSync( source, { minify: true, loader: 'js', target: 'es2015', legalComments: 'none' }).code;

mkdirSync( join( root, 'dist' ), { recursive: true });
writeFileSync( join( root, 'dist/hardian-cube.js' ), minified );
console.log( `dist/hardian-cube.js ${ ( minified.length / 1024 ).toFixed( 0 ) } KB` );
