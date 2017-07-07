function Sprite(posX, posY, width, height, context, src)
{
	this.posX = posY;
	this.posY = posX;
	this.width = width;
	this.height = height;
	this.context = context;

	this.srcImg = new Image();
	this.srcImg.src = src;

	this.currFrame = 0;

	this.update = function()
	{
		console.log(this.currFrame);
		context.drawImage(this.srcImg, this.currFrame * this.width, 0, 
						  this.width, this.height, this.posX, this.posY, 
						  this.width, this.height);

		if ((this.currFrame + 2) * this.width >= this.srcImg.width)
			this.currFrame = 0;
		else
			this.currFrame++;
	}

	this.setPos = function(posX, posY)
	{
		this.posX = posX;
		this.posY = posY;
	}
}