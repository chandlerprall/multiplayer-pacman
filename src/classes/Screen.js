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