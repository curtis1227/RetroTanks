const TANKSIZE = 50;
var moveAmt = 2;

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
    cvsContext.fillRect(this.posX-TANKSIZE/2,this.posY-TANKSIZE/2,TANKSIZE,TANKSIZE);
  }
  //Move
  this.move = function(Idirection){
    this.direction = Idirection;
    //Up
    if(Idirection == UP){
      this.posY += -moveAmt;
    //Right
    } else if(Idirection == RIGHT){
      this.posX += moveAmt;
    //Down
    } else if(Idirection == DOWN){
      this.posY += moveAmt;
    //Left
    } else if(Idirection == LEFT){
      this.posX += -moveAmt;
    }
  }
  //Fire bullet
  this.fireBullet = function(){
  }

  //Draw tank for the 1st time
  this.update();
}