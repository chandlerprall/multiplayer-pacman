(function(){
	var initRenderer = function() {

		};

	Events.attach(
		'startGame',
		function() {
			Game.screens.main.hide();

			Game.screens.loading.show();

			setTimeout(
				function() {
					//initRenderer();
					//initScenes();
					//initCameras();
					//bindEvents();

					Game.render();
				},
				500
			);
		}
	);
})();