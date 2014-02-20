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