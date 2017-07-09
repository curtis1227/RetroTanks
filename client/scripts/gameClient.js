const TANKSIZE = 84;
const BULLETSIZE = 4;
const W = 87, D = 68    , S = 83    , A = 65    , SPACE = 32;
const UP = 0, RIGHT = 90, DOWN = 180, LEFT = 270;
var socket = io();
var cvs, cvsContext;
var gameTable,scoreRow,scoreNameCell,scoreScoreCell;
var keyPress;
var keyMap = {};
var tankSprites = [];
var bulletSprites = [];

window.onload = function() {
  //Initialize canvas
  cvs = document.getElementById('gameCanvas');
  cvsContext = cvs.getContext('2d');

  //Initialize game table
  gameTable = document.getElementById('gameTable');
  scoreRow = gameTable.insertRow(0);
  scoreNameCell = scoreRow.insertCell(0);
  scoreNameCell.innerHTML = "Score: ";
  scoreScoreCell = scoreRow.insertCell(1);
  scoreScoreCell.innerHTML = 0;

  //Draw canvas for the 1st time
  cvsContext.fillStyle = 'black';
  cvsContext.fillRect(0,0,cvs.width,cvs.height);
}

//receive gamestate information from server
socket.on("gamestate", function(gamestate)
{
	//TODO: draw gamestate logic
});

window.onkeydown = window.onkeyup = function(e)
{
  console.log(e.keyCode);
  keyMap[e.keyCode]  = (e.type == "keydown");
  if (e.type != "keyup" && e.keyCode != SPACE) {keyPress = e.keyCode;}
  chooseActions();
}

function chooseActions()
{
  //move up function
  if (keyPress == W && keyMap[W])
    socket.emit("moveTank", UP);
  //move right function
  else if (keyPress == D && keyMap[D])
    socket.emit("moveTank", RIGHT);
  //move down function
  else if (keyPress == S && keyMap[S])
    socket.emit("moveTank", DOWN);
  //move left function
  else if (keyPress == A && keyMap[A])
    socket.emit("moveTank", LEFT);
  //shoot function
  if (keyMap[SPACE])
   socket.emit("shootBullet",);
}

socket.on("msg", function(text)
{
	console.log(text);
});

socket.on("disconnect", function(text)
{
	console.log("Server Disconnected: " + text);
});