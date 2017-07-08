var socket = io();
var cvs, cvsContext;
var gameTable,scoreRow,scoreNameCell,scoreScoreCell;
var keyPress;
var keyMap = {};
var tankSprites = [];
var bulletSprites = [];
const TANKSIZE = 84;
const BULLETSIZE = 4;
const W = 87, D = 68    , S = 83    , A = 65    , SPACE = 32;
const UP = 0, RIGHT = 90, DOWN = 180, LEFT = 270;

window.onload = function() {
  //Initialize variables
  cvs = document.getElementById('gameCanvas');
  cvsContext = cvs.getContext('2d');

  //Make game table
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

var text = document.getElementById("test");

text.onmouseover = function()
{
	socket.emit("test", ["success"]);
}