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