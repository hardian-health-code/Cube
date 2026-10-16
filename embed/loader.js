//	Hardian Cube embed loader.
//
//	Mounts a cube into every element marked with `data-hardian-cube`,
//	including ones added to the page later (Squarespace AJAX page loads).
//	Concatenated after cuber.js by embed/build.mjs; HARDIAN_CUBE_CSS is
//	defined by the build.
//
//	Options, as attributes on the target element:
//	  data-height="400px"      height when the element has none of its own
//	  data-background="#fff"   background colour, transparent by default
//	  data-keyboard="true"     let letter keys twist the cube (off by default
//	                           so typing elsewhere on the page doesn't)
//	  data-shuffle="20"        scramble with this many moves on load


var SELECTOR = '[data-hardian-cube]';
var STYLE_ID = 'hardian-cube-style';


function injectStyles(){

	if( document.getElementById( STYLE_ID )) return;

	var style = document.createElement( 'style' );
	style.id = STYLE_ID;
	style.textContent = HARDIAN_CUBE_CSS;
	( document.head || document.documentElement ).appendChild( style );
}


function mount( element ){

	if( element.hardianCube ) return element.hardianCube;

	injectStyles();
	element.classList.add( 'hardian-cube' );

	if( element.getAttribute( 'data-background' )) element.style.background = element.getAttribute( 'data-background' );
	if( !element.clientHeight ) element.style.height = element.getAttribute( 'data-height' ) || '400px';

	var cube = new ERNO.Cube({
		keyboardControlsEnabled: element.getAttribute( 'data-keyboard' ) === 'true'
	});

	element.appendChild( cube.domElement );

	var shuffle = parseInt( element.getAttribute( 'data-shuffle' ), 10 );
	if( shuffle > 0 ) cube.shuffle( shuffle );

	element.hardianCube = cube;
	return cube;
}


function mountAll( root ){

	if( root.matches && root.matches( SELECTOR )) mount( root );
	if( root.querySelectorAll ) Array.prototype.forEach.call( root.querySelectorAll( SELECTOR ), mount );
}


function start(){

	mountAll( document );

	if( window.MutationObserver ){

		new MutationObserver( function( mutations ){

			mutations.forEach( function( mutation ){
				Array.prototype.forEach.call( mutation.addedNodes, mountAll );
			});

		}).observe( document.documentElement, { childList: true, subtree: true });
	}
}


window.HardianCube = { mount: mount, mountAll: mountAll };

if( document.readyState === 'loading' ) document.addEventListener( 'DOMContentLoaded', start );
else start();
