var cvs;
var cvsContext;
var tanks = [];
var keyPress;
var keyMap = {};
const TANKSIZE = 84;
const BULLETSIZE = 4;
const W = 87, D = 68    , S = 83    , A = 65    , SPACE = 32;
const UP = 0, RIGHT = 90, DOWN = 180, LEFT = 270;

window.onload = function() {
  //Initialize variables
  cvs = document.getElementById('gameCanvas');
  cvsContext = cvs.getContext('2d');

  //Draw canvas for the 1st time
  cvsContext.fillStyle = 'black';
  cvsContext.fillRect(0,0,cvs.width,cvs.height);

  //Test tank
  tanks[0] = new Tank(cvs.width/2,cvs.height/2,'blue', 0);

  //Update per time
  var framesPerSecond = 30;
  setInterval(update, 1000/framesPerSecond);
}

//multiple key press

window.onkeydown = window.onkeyup = function(e)
{
  console.log(e.keyCode);
  keyMap[e.keyCode]  = (e.type == "keydown");
  if (e.type != "keyup" && e.keyCode != SPACE)
    keyPress = e.keyCode;
}

function chooseActions()
{
  //move up function
  if (keyPress == W && keyMap[W])
    tanks[0].move(UP);

  //move right function
  else if (keyPress == D && keyMap[D])
    tanks[0].move(RIGHT);

  //move down function
  else if (keyPress == S && keyMap[S])
    tanks[0].move(DOWN);

  //move left function
  else if (keyPress == A && keyMap[A])
    tanks[0].move(LEFT);

  //shoot function
  if (keyMap[SPACE])
    tanks[0].fireBullet();
}

function update() {

  //Check bullets collision with tanks
  for(var i = 0;i<tanks.length;i++){
    for(var j = 0;j<tanks[i].bullets.length;j++){
      for(var k = 0;k<tanks.length;k++){
        var bulletX = tanks[i].bullets[j].posX;
        var bulletY = tanks[i].bullets[j].posY;
        //If collided
        if(bulletX < tanks[k].posX + TANKSIZE/2
          && bulletX > tanks[k].posX - TANKSIZE/2
          && bulletY < tanks[k].posY + TANKSIZE/2
          && bulletY > tanks[k].posY - TANKSIZE/2){
          //Delete the bullet
          tanks[i].deleteBullet[j];
          //Move tank off screen
          tanks[k].posX = -100;
          tanks[k].posY = -100;
        }
      }
    }
  }

  chooseActions();

  //Update canvas
  cvsContext.fillStyle = 'black';
  cvsContext.fillRect(0,0,cvs.width,cvs.height);

  //Update tanks and bullets
  for(var i = 0;i<tanks.length;i++){
    tanks[i].update();
  }
}