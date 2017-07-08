function Bullet(IposX,IposY,IspeedX,IspeedY){
  //Initialize vars
  this.posX = IposX;
  this.posY = IposY;
  this.speedX = IspeedX;
  this.speedY = IspeedY;

  ////MEMBER FUNCTIONS////
  //Update bullet
  this.update = function(){
    this.posX += this.speedX;
    this.posY += this.speedY;

    cvsContext.fillStyle = 'white';
    cvsContext.fillRect(this.posX-BULLETSIZE/2,this.posY-BULLETSIZE/2,BULLETSIZE,BULLETSIZE);
  }

  //Draw bullet for the 1st time
  this.update();
}