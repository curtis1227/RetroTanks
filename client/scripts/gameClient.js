const TANKSIZE = 84;
const BULLETSIZE = 4;
const W = 87, D = 68    , S = 83    , A = 65    , SPACE = 32;
const UP = 0, RIGHT = 90, DOWN = 180, LEFT = 270;
var socket = io();
var cvs, cvsContext;
var gameTable,scoreRow,scoreNameCell,scoreScoreCell;
var keyPress;
var keyMap = [];
var tankSprites = [];
var form = document.getElementById("roomNum");

form.addEventListener("submit", function(event)
{
    event.preventDefault();
    console.log(form[0].value);
});

function initCanvas()
{
  //Initialize canvas
  cvs = document.getElementById('gameCanvas');
  cvs.width = 800;
  cvs.height = 600;
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

//get number of tanks and create sprites
socket.on("gamestart", function(tanks)
{
    console.log("Game Started!");
    for (var i = 0; i < tanks.length; i++)
    {
        var color = "blue";
        if (tanks[i].id == socket.id)
        {
            console.log("You are tank " + i);
            color = "green";
        }

        tankSprites[i] = new Sprite(tanks[i].posX, tanks[i].posY, tanks[i].direction, 
                                    TANKSIZE, TANKSIZE, cvsContext, 
                                    "src/" + color + "_tank.png", true);

        tankSprites[i].updateSprite(tanks[i].posX, tanks[i].posY, tanks[i].direction);
    }
});

//receive gamestate information from server
socket.on("gamestate", function(tanks)
{
    chooseActions();

    cvsContext.fillStyle = 'black';
    cvsContext.fillRect(0,0,cvs.width,cvs.height);

    for (var i = 0; i < tanks.length; i++)
    {
        //console.log("Player " + tanks[i].id + " Tanks Position: " + tanks[i].posX + ", " + tanks[i].posY);
        tankSprites[i].updateSprite(tanks[i].posX, tanks[i].posY, tanks[i].direction);

        //console.log("Tank " + tanks[i].id + " has " + tanks[i].bullets.length + " bullets");
        for (var j = 0; j < tanks[i].bullets.length; j++)
        {
            //console.log(tanks[i].bullets[j].posX + " " + tanks[i].bullets[j].posY);
            cvsContext.fillStyle = 'white';
            cvsContext.fillRect(tanks[i].bullets[j].posX-BULLETSIZE/2,
                                tanks[i].bullets[j].posY-BULLETSIZE/2,
                                BULLETSIZE,BULLETSIZE); 
        }

        if (tanks[i].id == socket.id)
            scoreScoreCell.innerHTML = tanks[i].score;
    }
});

//erase board and clean up after game ends
socket.on("gameend", function()
{
    console.log("Game Ended!");

    cvsContext.fillStyle = 'black';
    cvsContext.fillRect(0,0,cvs.width,cvs.height);
});

window.onkeydown = window.onkeyup = function(e)
{
    e = e || event;
    keyMap[e.keyCode]  = (e.type == "keydown");
    if (keyMap[e.keyCode] && e.keyCode != SPACE) 
    {
        keyPress = e.keyCode;
    }
    //console.log("Event Triggered By: " + e.keyCode);
    //console.log("KeyPress Set To: " + keyPress);
}

function chooseActions()
{
  //move up function
  if (keyPress == W && keyMap[W])
    socket.emit("move", UP);
  //move right function
  else if (keyPress == D && keyMap[D])
    socket.emit("move", RIGHT);
  //move down function
  else if (keyPress == S && keyMap[S])
    socket.emit("move", DOWN);
  //move left function
  else if (keyPress == A && keyMap[A])
    socket.emit("move", LEFT);
  //shoot function
  if (keyMap[SPACE])
   socket.emit("move", "shoot");
}

socket.on("msg", function(text)
{
    console.log(text);
});