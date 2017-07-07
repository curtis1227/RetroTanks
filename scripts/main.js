var cvs;
var cvsContext;
var tanks = [];
var keyPress;
var keyMap = {};
const W = 87, D = 68    , S = 83    , A = 65    , SPACE = 32;
const UP = 0, RIGHT = 90, DOWN = 180, LEFT = 270;

window.onload = function() {
  //Initialize variables
  cvs = document.getElementById('gameCanvas');
  cvsContext = cvs.getContext('2d');

  cvsContext.fillStyle = 'black';
  cvsContext.fillRect(0,0,cvs.width,cvs.height);

  tanks[0] = new Tank(cvs.width/2,cvs.height/2,'blue', 0);

  //Update per time
  var framesPerSecond = 30;
  setInterval(update, 1000/framesPerSecond);
}

//multiple key press

window.onkeydown = window.onkeyup = function(e)
{
  keyMap[e.keyCode]  = (e.type == "keydown");
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
  else if (keyMap[SPACE])
    console.log("space");
}

function update() {

  //Redraw canvas
  cvsContext.fillStyle = 'black';
  cvsContext.fillRect(0,0,cvs.width,cvs.height);

  chooseActions();

  //Draw tanks
  for(var i = 0;i<tanks.length;i++){
    tanks[i].draw();
  }
}