var ajax = function( type, where, callback, context, response_type ) {
	var request = new XMLHttpRequest();

	request.onload = callback.bind( context, request );
	request.open( type, where );

	if ( response_type ) {
		request.responseType = response_type;
	}

	request.send();
};