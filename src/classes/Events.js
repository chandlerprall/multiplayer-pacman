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