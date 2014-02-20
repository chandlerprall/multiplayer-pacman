// requestAnimationFrame polyfill from http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
(function() {
	var lastTime = 0;
	var vendors = ['webkit', 'moz'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame =
			window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); },
				timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());

(function(){
	var Game = {
		screens: {} // Map of loaded screens

	};
var Actor = function( hitboxSize, speed )
{
	this.x = 0;
	this.y = 0;
	this.hitboxSize = hitboxSize;
	this.speed = speed;
	this.direction = 'down';
};
Actor.prototype = {
	render: function( ctx, x, y )
	{
		ctx.fillStyle = '#ffff00';
		ctx.beginPath();
		ctx.arc(
			x,
			y,
			24,
			0,
			Math.PI * 2
		);
		ctx.fill();
	}
};
var Audio = (function(){
	var audio_context = window.AudioContext ? new AudioContext() : new webkitAudioContext(),
		_id = 0;

	var AudioTrack = function( name, src ) {
		this.id = _id++;
		this.name = name;
		this.uri = typeof src === 'string' ? src : null;
		this.buffer = null;
		this.dependencies = [];

		if ( this.uri !== null ) {
			ajax( 'get', 'resources/sounds/' + src, this.onload, this, 'arraybuffer' );
		} else {
			this.buffer = src;
		}
	};
	AudioTrack.prototype.onload = function( request ) {
		var self = this;

		audio_context.decodeAudioData(
			request.response,
			function( buffer ) {
				self.buffer = buffer;
				for ( var i = 0; i < self.dependencies.length; i++ ) {
					self.dependencies[i].assignAudioBuffer( self.buffer );
				}
			},
			function() {
				throw 'Error decoding audio data for ' + self.uri;
			}
		);
	};
	AudioTrack.prototype.addDependancy = function( who ) {
		this.dependencies.push( who );
		if ( this.buffer ) {
			who.assignAudioBuffer( this.buffer );
		}
	};

	var AudioSource = function( audio_track, position ) {
		this.volume = audio_context.createGain();
		this.source = audio_context.createBufferSource();

		if ( position ) {
			this.panner = audio_context.createPanner();
			this.panner.setPosition( position.x, position.y, position.z );

			this.source.connect( this.panner );
			this.panner.connect( this.volume );
		} else {
			this.panner = null;
			this.source.connect( this.volume );
		}
		this.volume.connect( Audio.output );

		audio_track.addDependancy( this );
	};
	AudioSource.prototype.assignAudioBuffer = function( buffer ) {
		this.source.buffer = buffer;
	};
	AudioSource.prototype.play = function() {
		this.source.start( audio_context.currentTime );
	};
	Object.defineProperty(
		AudioSource.prototype,
		'loop',
		{
			get: function() {
				return this.source.loop;
			},
			set: function ( value ) {
				this.source.loop = value;
			}
		}
	);

	var microphone_sample_rate = 256,
		microphone_node = audio_context.createScriptProcessor( microphone_sample_rate, 2, 1 );

	return {
		microphone: (function(){
			var is_recording = false,
				recording_buffers = [],
				buffer_length;

			microphone_node.onaudioprocess = function ( ev ) {
				var channel_l = ev.inputBuffer.getChannelData( 0 ),
					channel_r = ev.inputBuffer.getChannelData( 1 );

				ev.outputBuffer.getChannelData( 0 ).set( channel_l, 0 );

				if ( is_recording ) {
					buffer_length += channel_l.length;

					var new_buffer = new Float32Array( ev.inputBuffer.getChannelData( 0 ).length ),
						i;
					for ( i = 0; i < new_buffer.length; i++ ) {
						new_buffer[i] = 0.5 * ( channel_l[i] + channel_r[i] );
					}
					recording_buffers.push( new_buffer );
				}
			};

			return {
				isRecording: function() {
					return is_recording;
				},

				record: function() {
					recording_buffers.length = 0;
					buffer_length = 0;
					is_recording = true;
				},

				stop: function() {
					is_recording = false;
					if ( recording_buffers.length > 0 ) {
						var buffer = new Float32Array( buffer_length ),
							offset = 0,
							i;

						for ( i = 0; i < recording_buffers.length; i++ ) {
							buffer.set( recording_buffers[i], offset );
							offset += recording_buffers[i].length;
						}

						var audio_buffer = audio_context.createBuffer( 1, buffer_length, 44100 );
						audio_buffer.getChannelData( 0 ).set( buffer, 0 );
						return audio_buffer;
					}
				}
			};
		})(),

		output: (function(){
			var output = audio_context.createGain();

			// Connect output to speakers
			output.connect( audio_context.destination );

			// Set up the microphone input
			//microphone_node.connect( audio_context.destination );
			output.connect( microphone_node );

			// The microphone *has to be* connected to destination for it to process anything. That's stupid
			var microphone_gain = audio_context.createGain();
			microphone_node.connect( microphone_gain );
			microphone_gain.connect( audio_context.destination );
			microphone_gain.gain.value = 0;

			return output;
		})(),

		tracks: {},

		Track: AudioTrack,
		Source: AudioSource,

		setListenerPosition: function( position ) {
			audio_context.listener.setPosition( position.x, position.y, position.z );
		},

		setListenerOrientation: function( orientation ) {
			audio_context.listener.setOrientation( orientation.x, orientation.y, orientation.z, 0, 1, 0 );
		},

		load: function( name, src ) {
			var track = new AudioTrack( name, src );
			Audio.tracks[name] = track;
		}
	};
})();
var Events = (function(){
	var _events = {};

	document.body.addEventListener(
		'click',
		function( evt ) {
			var target = evt.target,
				event = target.getAttribute( 'data-event' ),
				on = target.getAttribute( 'data-on' ) || 'click';

			if ( event != null && on === 'click' && event in _events ) {
				_events[event]( evt );
			}
		}
	);

	return {
		attach: function( event_name, handler ) {
			if ( event_name in _events ) {
				throw 'Event "' + event_name + '" already bound.';
			}
			_events[event_name] = handler;
		}
	};
})();
var Map = function()
{
	this.width = 20;
	this.height = 20;

	this.tiles = [
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
		1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
	];
};

Map.prototype = {
	nextToWall: function( x, y, direction )
	{
		if ( direction === 'down' )
		{
			y += 1;
		}
		else if ( direction === 'up' )
		{
			y -= 1;
		}
		else if ( direction === 'right' )
		{
			x += 1;
		}
		else if ( direction === 'left' )
		{
			x -= 1;
		}

		return this.tiles[ x + y * this.width ] === 1;
	}
};
/**
 * A game screen, automatically loads in its template
 * @param name
 * @constructor
 */
var Screen = function( name, definition ) {
	definition = definition || {};

	var slugged_name = Utils.slugify( name );

	this.name = name;
	this.container = document.createElement( 'DIV' );
	this.container.id = 'screen-' + slugged_name;
	this.container.className = 'screen';

	this.template = new Template( 'screens/' + slugged_name );
	this.template.render( {}, this.update.bind( this ) );

	for ( var key in definition )
	{
		if ( definition.hasOwnProperty( key ) )
		{
			this[key] = definition[key];
		}
	}
};

/**
 * Updates the screen to the given HTML
 * @param html
 */
Screen.prototype.update = function( html ) {
	this.container.innerHTML = html;
};

/**
 * Shows the screen
 */
Screen.prototype.show = function() {
	if ( Array.prototype.indexOf.call( document.body.children, this.container ) === -1 ) {
		document.body.appendChild( this.container );
	}
};

/**
 * Hides the screen
 */
Screen.prototype.hide = function() {
	if ( Array.prototype.indexOf.call( document.body.children, this.container ) !== -1 ) {
		document.body.removeChild( this.container );
	}
};

/**
 * Creates a new Screen and adds it to `Game.screens`
 * @param name
 */
Screen.create = function( name, definition ) {
	return Game.screens[name] = new Screen( name, definition );
};
var Template = function( source ) {
	this.compiled = null;
	this.promised = [];

	ajax( 'get', 'templates/' + source + '.tmpl', this.onload, this );
};

Template.prototype.onload = function( request ) {
	if ( !this.compiled ) {
		this.compiled = _.template( request.response );
		for ( var i = 0; i < this.promised.length; i++ ) {
			this.promised[i].call();
		}
	}
};

Template.prototype.render = function render( data, callback ) {
	if ( this.compiled ) {
		callback( this.compiled( data ) );
	} else {
		this.promised.push(
			render.bind( this, data, callback )
		);
	}
};
/**
 * Collection of utility functions
 */
var Utils = {
	/**
	 * Takes a string and makes it url-safe
	 * @param src
	 */
	slugify: function( src ) {
		return src.replace( /[^a-zA-Z]+/g, '-' ).toLowerCase();
	}
};
var ajax = function( type, where, callback, context, response_type ) {
	var request = new XMLHttpRequest();

	request.onload = callback.bind( context, request );
	request.open( type, where );

	if ( response_type ) {
		request.responseType = response_type;
	}

	request.send();
};
(function(){
	var canvas,
		ctx,
		map,

		tileWidth = 48,
		tileHeight = 48,

		player,

		lastRenderTime,
		currentKey,

		createCanvas = function()
		{
			canvas = document.createElement( 'CANVAS' );
			screen.container.appendChild( canvas );

			canvas.width = map.width * tileWidth;
			canvas.height = map.height * tileHeight;

			ctx = canvas.getContext( '2d' );
		},

		createPlayer = function()
		{
			player = new Actor(
				28, // hitbox
				3 // speed
			);
			player.x = 1;
			player.y = 1;
		},

		loadMap = function()
		{
			map = new Map();
		},

		onKeyDown = function( e )
		{
			currentKey = e.keyCode;
		},

		onKeyUp = function()
		{
			currentKey = undefined;
		},

		processKey = function()
		{
			var accuracy = 0.1;

			if ( player.x % 1 > accuracy && player.x % 1 < 1 - accuracy )
			{
				return;
			}
			if ( player.y % 1 > accuracy && player.y % 1 < 1 - accuracy )
			{
				return;
			}

			switch ( currentKey )
			{
				// Left
				case 37:
					if ( map.nextToWall( player.x, Math.round( player.y ), 'left' ) ) { return; }
					player.direction = 'left';
					player.y = Math.round( player.y );
					break;

				// Up
				case 38:
					if ( map.nextToWall( Math.round( player.x ), player.y, 'up' ) ) { return; }
					player.direction = 'up';
					player.x = Math.round( player.x );
					break;

				// Right
				case 39:
					if ( map.nextToWall( player.x, Math.round( player.y ), 'right' ) ) { return; }
					player.direction = 'right';
					player.y = Math.round( player.y );
					break;

				case 40:
					if ( map.nextToWall( Math.round( player.x ), player.y, 'down' ) ) { return; }
					player.direction = 'down';
					player.x = Math.round( player.x );
					break;
			}
		};

	// Create the game screen object
	var screen = Screen.create(
		'game',
		{
			init: function()
			{
				loadMap();
				createCanvas();
				createPlayer();

				document.body.addEventListener( 'keydown', onKeyDown );
				document.body.addEventListener( 'keyup', onKeyUp );
			},

			destroy: function()
			{
				this.container.removeChild( canvas );
				canvas = ctx = null;

				document.body.removeEventListener( 'keydown', onKeyDown );
				document.body.removeEventListener( 'keyup', onKeyUp );
			},

			start: function()
			{
				window.requestAnimationFrame( this.render );
			},

			// Render is bound below so that `this` is _always_ `Screen.game`
			render: function()
			{
				var now = window.performance.now(),
					timeDelta = ( now - ( lastRenderTime || now ) ) / 1000;
				lastRenderTime = now;

				// Clear screen
				ctx.fillStyle = '#000';
				ctx.fillRect( 0, 0, canvas.width, canvas.height );

				// Render those map tiles!
				for ( var i = 0; i < map.width; i++ )
				{
					for ( var j = 0; j < map.height; j++ )
					{
						var tileIdx = i + j * map.width,
							tile = map.tiles[ tileIdx ];

						if ( tile === 0 )
						{
							// Empty Space
						}
						else if ( tile === 1 )
						{
							// Wall
							ctx.fillStyle = '#666';
							ctx.fillRect(
								i * tileWidth,
								j * tileHeight,
								tileWidth,
								tileHeight
							);
						}
					}
				}

				processKey();

				// Move & render player
				if ( player.direction === 'down' )
				{
					player.y += player.speed * timeDelta;

					// Check for a wall
					if ( map.tiles[ player.x + Math.ceil( player.y ) * map.width ] === 1 )
					{
						player.y = Math.floor( player.y );
					}
				}
				else if ( player.direction === 'up' )
				{
					player.y -= player.speed * timeDelta;

					// Check for a wall
					if ( map.tiles[ player.x + Math.floor( player.y ) * map.width ] === 1 )
					{
						player.y = Math.ceil( player.y );
					}
				}
				else if ( player.direction === 'right' )
				{
					player.x += player.speed * timeDelta;

					// Check for a wall
					if ( map.tiles[ Math.ceil( player.x ) + player.y * map.width ] === 1 )
					{
						player.x = Math.floor( player.x );
					}
				}
				else if ( player.direction === 'left' )
				{
					player.x -= player.speed * timeDelta;

					// Check for a wall
					if ( map.tiles[ Math.floor( player.x ) + player.y * map.width ] === 1 )
					{
						player.x = Math.ceil( player.x );
					}
				}
				player.render( ctx, player.x * tileWidth + tileWidth * 0.5, player.y * tileHeight + tileHeight * 0.5 );

				window.requestAnimationFrame( this.render );
			}
		}
	);

	screen.render = screen.render.bind( screen );
})();
(function(){
	Events.attach(
		'startgame',
		function() {
			Game.screens.main.hide();
			Game.screens.loading.show();

			// Set timeout for now to fake having a loading time
			setTimeout(
				function() {
					Game.screens.loading.hide();

					Game.screens.game.init();
					Game.screens.game.show();
					Game.screens.game.start();
				},
				500
			);
		}
	);
})();
Game.init = (function(){
	var loadScenes = function() {
			Screen.create( 'loading' );
			Screen.create( 'main' );
			//Screen.create( 'game' );
			Game.screens.main.show();
		},

		loadSounds = function() {

		};

	return function() {
		loadScenes();
		loadSounds();
	};
})();
	Game.init();
	window.Game = Game;
})();