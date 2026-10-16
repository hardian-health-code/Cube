//	Hardian Cube embed loader.
//
//	Mounts a cube into every element marked with `data-hardian-cube`,
//	including ones added to the page later (Squarespace AJAX page loads).
//	Concatenated after cuber.js by embed/build.mjs; HARDIAN_CUBE_CSS is
//	defined by the build.
//
//	Options, as attributes on the target element:
//	  data-height="400px"      height of the cube area when the element has
//	                           no height of its own
//	  data-background="#fff"   background colour, white by default
//	  data-controls="false"    hide the Reshuffle and Solve buttons
//	  data-keyboard="true"     let letter keys twist the cube (off by default
//	                           so typing elsewhere on the page doesn't)
//	  data-shuffle="10"        moves in the scramble played when the cube
//	                           comes into view (10 by default, 0 for none)


var SELECTOR = '[data-hardian-cube]';
var STYLE_ID = 'hardian-cube-style';
var FONT_URL = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@600&display=swap';

var SHUFFLE_MOVES    = 20;
var LOAD_SHUFFLE_MOVES = 10;
var LOAD_SHUFFLE_DELAY = 400;	//	ms after the cube comes into view
var SHUFFLE_DURATION = 120;	//	ms per twist
var LOAD_SHUFFLE_DURATION = 220;
var SOLVE_DURATION   = 160;


function injectStyles(){

	if( document.getElementById( STYLE_ID )) return;

	var head = document.head || document.documentElement;

	var font = document.createElement( 'link' );
	font.rel = 'stylesheet';
	font.href = FONT_URL;
	head.appendChild( font );

	var style = document.createElement( 'style' );
	style.id = STYLE_ID;
	style.textContent = HARDIAN_CUBE_CSS;
	head.appendChild( style );
}


function makeButton( label, onClick ){

	var button = document.createElement( 'button' );
	button.type = 'button';
	button.className = 'hardian-cube-button';
	button.textContent = label;
	button.addEventListener( 'click', onClick );
	return button;
}


//	Shuffling and solving. The engine has no solver, so solve() plays back the
//	inverse of every move made since the cube was last solved, shuffles and the
//	visitor's own alike, while turning the whole cube back to the orientation
//	it started in (the H logo facing front).

function createPlayer( cube, onChange ){

	var moves = [],
		state = null,	//	null, 'shuffling' or 'solving'
		pending = 0,	//	parts of a solve still running
		defaultDuration = cube.twistDuration,
		home = cube.object3D.quaternion.clone();

	function busy(){

		return state !== null || cube.twistQueue.future.length > 0 || cube.isTweening() > 0;
	}

	function finish(){

		state = null;
		cube.twistDuration = defaultDuration;
		cube.mouseControlsEnabled = true;
		onChange();
	}

	function partDone(){

		if( --pending <= 0 ){
			moves = [];
			finish();
		}
	}

	function isHome(){

		var q = cube.object3D.quaternion;
		return Math.abs( q.x * home.x + q.y * home.y + q.z * home.z + q.w * home.w ) > 0.99999;
	}

	function turnHome( duration ){

		var from = cube.object3D.quaternion.clone(),
			started = null;

		function step( now ){

			if( started === null ) started = now;

			var t = Math.min( 1, ( now - started ) / duration ),
				eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow( -2 * t + 2, 3 ) / 2;

			cube.object3D.quaternion.copy( from ).slerp( home, eased );
			cube.requestRender();

			if( t < 1 ) requestAnimationFrame( step );
			else partDone();
		}

		requestAnimationFrame( step );
	}

	cube.addEventListener( 'onTwistComplete', function( event ){

		var twist = event.detail && event.detail.twist;
		if( !twist ) return;

		if( state === 'solving' ){
			partDone();
			return;
		}

		//	A twist straight after its own inverse cancels out.
		var last = moves[ moves.length - 1 ];
		if( last && last.command === twist.command.invert() && last.degrees === twist.degrees ) moves.pop();
		else moves.push( twist );

		if( state === null && cube.isSolved() ) moves = [];

		onChange();
	});

	cube.addEventListener( 'onShuffleComplete', function(){

		if( state === 'shuffling' ) finish();
	});

	return {

		isBusy: function(){ return state !== null; },

		shuffle: function( amount, duration ){

			if( busy() ) return;

			state = 'shuffling';
			cube.twistDuration = duration || SHUFFLE_DURATION;
			onChange();
			cube.shuffle( amount || SHUFFLE_MOVES );
		},

		solve: function(){

			if( busy() ) return;

			var turning = !isHome();
			if( moves.length === 0 && !turning ) return;

			state = 'solving';
			pending = moves.length + ( turning ? 1 : 0 );
			cube.twistDuration = SOLVE_DURATION;
			cube.mouseControlsEnabled = false;
			onChange();

			moves.slice().reverse().forEach( function( twist ){
				cube.twist( twist.getInverse() );
			});

			if( turning ) turnHome( Math.max( 900, moves.length * SOLVE_DURATION ));
		}
	};
}


function addControls( element, player ){

	var shuffleButton = makeButton( 'Reshuffle', function(){ player.shuffle(); }),
		solveButton   = makeButton( 'Solve', function(){ player.solve(); });

	var controls = document.createElement( 'div' );
	controls.className = 'hardian-cube-controls';
	controls.appendChild( shuffleButton );
	controls.appendChild( solveButton );
	element.appendChild( controls );

	return function refresh(){

		shuffleButton.disabled = solveButton.disabled = player.isBusy();
	};
}


//	Play the load-time shuffle once the cube scrolls into view, so visitors
//	actually see it being scrambled.

function whenVisible( element, callback ){

	if( !window.IntersectionObserver ) return setTimeout( callback, LOAD_SHUFFLE_DELAY );

	var observer = new IntersectionObserver( function( entries ){

		if( entries.some( function( entry ){ return entry.isIntersecting; })){
			observer.disconnect();
			setTimeout( callback, LOAD_SHUFFLE_DELAY );
		}

	}, { threshold: 0.4 });

	observer.observe( element );
}


//	Squarespace's editor shows the site inside an iframe. An interactive cube
//	there gets in the way of selecting and dragging blocks, so it shows a
//	placeholder instead.

function inSquarespaceEditor(){

	var framed;
	try { framed = window.self !== window.top; } catch( e ){ framed = true; }

	return framed && !!( window.Static && window.Static.SQUARESPACE_CONTEXT );
}


function mountPlaceholder( element ){

	element.classList.add( 'hardian-cube' );

	var placeholder = document.createElement( 'div' );
	placeholder.className = 'hardian-cube-placeholder';
	placeholder.style.height = element.getAttribute( 'data-height' ) || '400px';
	placeholder.textContent = 'Hardian Cube appears here on the live site';
	element.appendChild( placeholder );

	element.hardianCube = true;
	return null;
}


function mount( element ){

	if( element.hardianCube ) return element.hardianCube;

	injectStyles();

	if( inSquarespaceEditor() ) return mountPlaceholder( element );

	var hasOwnHeight = element.clientHeight > 0;

	element.classList.add( 'hardian-cube' );
	if( element.getAttribute( 'data-background' )) element.style.background = element.getAttribute( 'data-background' );


	//	The cube sizes itself to its parent, so it gets a stage of its own
	//	and the buttons sit underneath.

	var stage = document.createElement( 'div' );
	stage.className = 'hardian-cube-stage';
	if( !hasOwnHeight ) stage.style.height = element.getAttribute( 'data-height' ) || '400px';
	element.appendChild( stage );

	var cube = new ERNO.Cube({
		keyboardControlsEnabled: element.getAttribute( 'data-keyboard' ) === 'true'
	});

	stage.appendChild( cube.domElement );

	var refresh = function(){};
	var player = createPlayer( cube, function(){ refresh(); });
	if( element.getAttribute( 'data-controls' ) !== 'false' ) refresh = addControls( element, player );
	refresh();
	cube.player = player;

	var shuffle = element.hasAttribute( 'data-shuffle' ) ? parseInt( element.getAttribute( 'data-shuffle' ), 10 ) : LOAD_SHUFFLE_MOVES;
	if( shuffle > 0 ) whenVisible( stage, function(){ player.shuffle( shuffle, LOAD_SHUFFLE_DURATION ); });

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
