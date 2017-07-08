function Sprite(x, y, dir, w, h, ctx, src)
{
	this.posX = x;
	this.posY = y;
	this.direction = dir;
	this.width = w;
	this.height = h;
	this.context = ctx;

	this.srcImg = new Image();
	this.srcImg.src = src;

	this.currFrame = 0;

	this.updateSprite = function(newX, newY, newDir)
	{
		this.posX = newX;
		this.posY = newY;
		this.direction = newDir;
  		console.log(this.posX + " " + this.posY);

  		//rotating entire canvas to rotate tank cuz apparently theres no better way
  		this.context.translate(this.posX + this.width / 2, this.posY + this.height / 2);
  		this.context.rotate(this.direction * Math.PI / 180);

		this.context.drawImage(this.srcImg, this.currFrame * this.width, 0, 
							   this.width, this.height, -this.width / 2, -this.height / 2, 
							   this.width, this.height);

		this.context.rotate(-this.direction * Math.PI / 180);
		this.context.translate(-this.posX - this.width / 2, -this.posY - this.height / 2);
		

		if ((this.currFrame + 2) * this.width >= this.srcImg.width)
			this.currFrame = 0;
		else
			this.currFrame++;
	}
}