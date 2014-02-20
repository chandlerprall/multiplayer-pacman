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