const BulletSize = 4;
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
    cvsContext.fillRect(this.posX-BulletSize/2,this.posY-BulletSize/2,BulletSize,BulletSize);
  }

  //Draw bullet for the 1st time
  this.update();
}