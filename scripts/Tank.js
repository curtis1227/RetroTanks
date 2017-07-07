var moveAmt = 2;
var bulletSpeed = 10;

function Tank(IposX,IposY,Icolor){
  //Initialize vars
  this.posX = IposX;
  this.posY = IposY;
  this.color = Icolor;
  this.direction = UP;
  this.bullets = [];
  this.sprite = new Sprite(IposX, IposY, TANKSIZE, TANKSIZE, cvsContext, "tanks.png");

  ////MEMBER FUNCTIONS////
  //Update tank
  this.update = function(){
    
    //Update bullets
    for(var i = 0;i < this.bullets.length;i++){
      this.bullets[i].update();
    }
    this.sprite.update();
  }
  //Move
  this.move = function(Idirection){
    //Set direction
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
  //Fire bullet; REMEMBER TO DELETE BULLETS
  this.fireBullet = function(){
    //Up
    if(this.direction == UP){
      this.bullets[this.bullets.length] = new Bullet(this.posX,this.posY-TANKSIZE/2-8,0,-bulletSpeed);
    //Right
    } else if(this.direction == RIGHT){
      this.bullets[this.bullets.length] = new Bullet(this.posX+TANKSIZE/2+8,this.posY,bulletSpeed,0);
    //Down
    } else if(this.direction == DOWN){
      this.bullets[this.bullets.length] = new Bullet(this.posX,this.posY+TANKSIZE/2+8,0,bulletSpeed);
    //Left
    } else if(this.direction == LEFT){
      this.bullets[this.bullets.length] = new Bullet(this.posX-TANKSIZE/2-8,this.posY,-bulletSpeed,0);
    }
  }
  //Delete bullet
  this.deleteBullet = function(bulletNumber){
    delete this.bullets[bulletNumber];
    this.bullets.splice(bulletNumber,1);
  }

  //Draw tank for the 1st time
  this.update();
}