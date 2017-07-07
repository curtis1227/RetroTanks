const TankSize = 50;
const moveAmt = 2;

function Tank(IposX,IposY,Icolor){
  //Initialize vars
  this.posX = IposX;
  this.posY = IposY;
  this.color = Icolor;
  this.direction = 0;
  this.bullets = [];

  ////MEMBER FUNCTIONS////
  //Update tank
  this.update = function(){
    cvsContext.fillStyle = this.color;
    cvsContext.fillRect(this.posX-TankSize/2,this.posY-TankSize/2,TankSize,TankSize);
  }
  //Move
  this.move = function(Idirection){
    this.direction = Idirection;
    //Up
    if(Idirection == 0){
      this.posY += -moveAmt;
    //Right
    } else if(Idirection == 90){
      this.posX += moveAmt;
    //Down
    } else if(Idirection == 180){
      this.posY += moveAmt;
    //Left
    } else if(Idirection == 270){
      this.posX += -moveAmt;
    }
  }
  //Fire bullet
  this.fireBullet = function(){
  }

  //Draw tank for the 1st time
  this.update();
}