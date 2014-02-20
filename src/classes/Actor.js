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