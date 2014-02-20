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