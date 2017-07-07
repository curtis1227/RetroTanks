var TankSize = 50;
function Tank(IposX,IposY,Icolor){
  //Initialize vars
  this.posX = IposX;
  this.posY = IposY;
  this.color = Icolor;

  ////MEMBER FUNCTIONS////
  //Draw aka Update tank
  this.draw = function(){
    cvsContext.fillStyle = this.color;
    cvsContext.fillRect(this.posX-TankSize/2,this.posY-TankSize/2,TankSize,TankSize);
  }
  //Move horizontally
  this.moveHori = function(amt){
    this.posX += amt;
  }
  //Move vertically
  this.moveVert = function(amt){
    this.posY += amt;
  }

  //Draw tank for the 1st time
  this.draw();
}