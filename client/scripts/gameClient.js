const TANKSIZE = 84;
const BULLETSIZE = 4;
const W = 87, D = 68    , S = 83    , A = 65    , SPACE = 32;
const UP = 0, RIGHT = 90, DOWN = 180, LEFT = 270;
const FPS = 15;
var socket = io();
var cvs, cvsContext;
var gameTable,scoreRow,scoreNameCell,scoreScoreCell;
var keyPress;
var keyMap = [];
var tankSprites = [];
var form = document.getElementById("roomSelect");

window.onload = function()
{
    initCanvas();
    startTanksAnimation();
}

function startTanksAnimation()
{
    bgTank = new Sprite(-TANKSIZE * 2, cvs.height / 2, 90, 
                                    TANKSIZE, TANKSIZE, cvsContext, 
                                    "src/blue_tank.png", false);
    window.intervalID = setInterval(tanksAnimation, 1000/FPS);
}

function tanksAnimation()
{
    cvsContext.fillStyle = 'black';
    cvsContext.fillRect(0,0,cvs.width,cvs.height);
    if (bgTank.posX > cvs.width + TANKSIZE)
    {
        bgTank.posX = -TANKSIZE;
        bgTank.posY = Math.random() * (cvs.height - TANKSIZE) + TANKSIZE / 2
    }
    bgTank.updateSprite(bgTank.posX + 2, bgTank.posY, bgTank.direction);
}

function endTanksAnimation()
{
    clearInterval(window.intervalID);
    cvsContext.fillStyle = 'black';
    cvsContext.fillRect(0,0,cvs.width,cvs.height);
}

form.addEventListener("submit", function(event)
{
    if (form[1].value == "Play Again?")
        return;
    event.preventDefault();
    if (form[1].value == "Ready")
        sendReady();
    else
        joinRoom();
});

function joinRoom()
{
    socket.emit("joinRoom", form[0].value)
    document.getElementById("instructions").innerHTML = "You are the <span style=\"color: rgb(123, 215, 55);\">GREEN</span> tank. They are the <span style=\"color: rgb(91, 139, 240);\">BLUE</span> tank.<br>Use WASD to move and SPACE to shoot. It takes time to reload!<br>Hit them and don't get hit! Have fun!";
    document.getElementById("textBox").style.display = "none";
    document.getElementById("roomSelect").style.margin = "auto";
    document.getElementById("button").value = "Ready";
    document.getElementById("button").disabled = true;
}

function sendReady()
{
    socket.emit("socketReady");
    document.getElementById("button").disabled = true;
    document.getElementById("button").style.backgroundColor = "green";
}

socket.on("joinRoom", function(text, roomID, num)
{
    document.getElementById("roomNum").innerHTML = roomID;
    document.getElementById("banner").innerHTML = "Waiting For " + num + " More Players"
    console.log(text + roomID);
});

socket.on("roomFull", function()
{
    document.getElementById("banner").innerHTML = "Room Full, Ready up!";
    document.getElementById("button").disabled = false;
});

function initCanvas()
{
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

//get number of tanks and create sprites
socket.on("gamestart", function(tanks)
{
    document.getElementById("welcome").style.display = "none";
    endTanksAnimation();

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
    document.getElementById("welcome").style.display = "initial";
    document.getElementById("banner").innerHTML = "Game Over!"
    document.getElementById("instructions").innerHTML = "You got " + scoreScoreCell.innerHTML + " points!";
    document.getElementById("button").value = "Play Again?";
    document.getElementById("button").style.backgroundColor = "";
    document.getElementById("button").disabled = false;

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