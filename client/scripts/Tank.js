var moveAmt = 2;
var shootDelay = 45;
var bulletSpeed = 10;

function Tank(IposX,IposY,Iscr){
  //Initialize vars
  this.posX = IposX;
  this.posY = IposY;
  this.direction = UP;
  this.bullets = [];
  this.sprite = new Sprite(IposX, IposY, 0, TANKSIZE, TANKSIZE, cvsContext, Iscr);
  this.shootCooldown = 0;
  this.score = 0;

  ////MEMBER FUNCTIONS////
  //Update tank
  this.update = function(){
    if (this.shootCooldown-- <= 0)
      this.shootCooldown = 0;
    //console.log(this.shootCooldown);
    
    //update sprites
    this.sprite.updateSprite(this.posX, this.posY, this.direction);
    
    //Update bullets
    for(var i = 0;i < this.bullets.length;i++){
      this.bullets[i].update();
    }

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

    //bounds of screen
    if (this.posY - TANKSIZE / 2 < 0)
      this.posY += moveAmt;
    else if (this.posX + TANKSIZE / 2 >= cvs.width)
      this.posX += -moveAmt;
    else if (this.posY + TANKSIZE / 2 >= cvs.height)
      this.posY += -moveAmt;
    else if (this.posX - TANKSIZE / 2 < 0)
      this.posX += moveAmt;
    //console.log(cvs.width + " " + cvs.height);
    //console.log(this.posX + " " + this.posY);
  }
  //Fire bullet; REMEMBER TO DELETE BULLETS
  this.fireBullet = function(){
    if (this.shootCooldown <= 0)
    {
      //Up
      if(this.direction == UP){
        this.bullets[this.bullets.length] = new Bullet(this.posX,this.posY-TANKSIZE/2-4,0,-bulletSpeed);
      //Right
      } else if(this.direction == RIGHT){
        this.bullets[this.bullets.length] = new Bullet(this.posX+TANKSIZE/2+4,this.posY,bulletSpeed,0);
      //Down
      } else if(this.direction == DOWN){
        this.bullets[this.bullets.length] = new Bullet(this.posX,this.posY+TANKSIZE/2+4,0,bulletSpeed);
      //Left
      } else if(this.direction == LEFT){
        this.bullets[this.bullets.length] = new Bullet(this.posX-TANKSIZE/2-4,this.posY,-bulletSpeed,0);
      }
      this.shootCooldown = shootDelay;
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