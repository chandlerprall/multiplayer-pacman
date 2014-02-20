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