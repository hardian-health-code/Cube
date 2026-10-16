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
//	  data-shuffle="20"        scramble with this many moves on load


var SELECTOR = '[data-hardian-cube]';
var STYLE_ID = 'hardian-cube-style';
var FONT_URL = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@600&display=swap';

var SHUFFLE_MOVES    = 20;
var SHUFFLE_DURATION = 120;	//	ms per twist
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


//	The engine has no solver, so Solve plays back the inverse of every move
//	made since the cube was last solved, shuffles and the visitor's own alike.

function addControls( element, cube ){

	var moves = [],
		state = null,	//	null, 'shuffling' or 'solving'
		remaining = 0,
		defaultDuration = cube.twistDuration,
		shuffleButton, solveButton;

	function busy(){

		return state !== null || cube.twistQueue.future.length > 0 || cube.isTweening() > 0;
	}

	function refresh(){

		shuffleButton.disabled = state !== null;
		solveButton.disabled   = state !== null || moves.length === 0;
	}

	function finish(){

		state = null;
		cube.twistDuration = defaultDuration;
		cube.mouseControlsEnabled = true;
		refresh();
	}

	cube.addEventListener( 'onTwistComplete', function( event ){

		var twist = event.detail && event.detail.twist;
		if( !twist ) return;

		if( state === 'solving' ){

			if( --remaining <= 0 ){
				moves = [];
				finish();
			}
			return;
		}

		//	A twist straight after its own inverse cancels out.
		var last = moves[ moves.length - 1 ];
		if( last && last.command === twist.command.invert() && last.degrees === twist.degrees ) moves.pop();
		else moves.push( twist );

		if( state === null && cube.isSolved() ) moves = [];

		refresh();
	});

	cube.addEventListener( 'onShuffleComplete', function(){

		if( state === 'shuffling' ) finish();
	});

	shuffleButton = makeButton( 'Reshuffle', function(){

		if( busy() ) return;

		state = 'shuffling';
		cube.twistDuration = SHUFFLE_DURATION;
		refresh();
		cube.shuffle( SHUFFLE_MOVES );
	});

	solveButton = makeButton( 'Solve', function(){

		if( busy() || moves.length === 0 ) return;

		state = 'solving';
		remaining = moves.length;
		cube.twistDuration = SOLVE_DURATION;
		cube.mouseControlsEnabled = false;
		refresh();

		moves.slice().reverse().forEach( function( twist ){
			cube.twist( twist.getInverse() );
		});
	});

	var controls = document.createElement( 'div' );
	controls.className = 'hardian-cube-controls';
	controls.appendChild( shuffleButton );
	controls.appendChild( solveButton );
	element.appendChild( controls );

	refresh();

	return {
		shuffle: function(){ shuffleButton.click(); },
		solve:   function(){ solveButton.click(); }
	};
}


function mount( element ){

	if( element.hardianCube ) return element.hardianCube;

	injectStyles();

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

	if( element.getAttribute( 'data-controls' ) !== 'false' ) cube.embedControls = addControls( element, cube );

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
