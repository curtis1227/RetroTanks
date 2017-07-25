function Sprite(x, y, dir, w, h, src, mA)
{
	this.posX = x;
	this.posY = y;
	this.direction = dir;
	this.width = w;
	this.height = h;

	this.srcImg = new Image();
	this.srcImg.src = src;

	this.moveAnimate = mA;

	this.currFrame = 0;

	this.updateSprite = function(newX, newY, newDir)
	{
		//if sprite hasnt moved
		if (this.moveAnimate && this.posX == newX && this.posY == newY && this.direction == newDir)
			if (this.currFrame == 0)
				this.currFrame = (this.srcImg.width - this.width) / this.width - 1;
			else
				this.currFrame--;

		this.posX = newX;
		this.posY = newY;
		this.direction = newDir;

  		//console.log(this.posX + " " + this.posY);

  		//rotating entire canvas to rotate tank cuz apparently theres no better way
  		cvsContext.translate(this.posX, cvs.height-this.posY);
  		cvsContext.rotate(this.direction * Math.PI / 180);

		cvsContext.drawImage(this.srcImg, this.currFrame * this.width, 0, 
							   this.width, this.height, -this.width / 2, -this.height / 2, 
							   this.width, this.height);

		cvsContext.rotate(-this.direction * Math.PI / 180);
		cvsContext.translate(-this.posX, -(cvs.height-this.posY));
		

		if ((this.currFrame + 2) * this.width >= this.srcImg.width)
			this.currFrame = 0;
		else
			this.currFrame++;
	}
}