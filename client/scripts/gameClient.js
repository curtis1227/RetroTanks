///////////////////////////////////////////////////////////////////////////////

//Controls

///////////////////////////////////////////////////////////////////////////////

const W = 87, D = 68    , S = 83    , A = 65    , SPACE = 32;
const UP = 0, RIGHT = 90, DOWN = 180, LEFT = 270;

///////////////////////////////////////////////////////////////////////////////

//Variables

///////////////////////////////////////////////////////////////////////////////

const TANKSIZE = 84;
const BULLETSIZE = 4;
const WINDOW_FPS = 15;

var socket = io();
var keyPress;
var keyMap = [];
var tankSprites = [];

var cvs = document.getElementById('gameCanvas');
var cvsContext = cvs.getContext('2d');
var gameTable = document.getElementById('gameTable');
var score = document.getElementById("score");
var roomNum = document.getElementById("roomNum");
var container = document.getElementById("container");
var welcome = document.getElementById("welcome");
var banner = document.getElementById("banner");
var instructions = document.getElementById("instructions");
var form = document.getElementById("roomSelect");
var textBox = document.getElementById("textBox");
var button = document.getElementById("button");
var intervalID;

///////////////////////////////////////////////////////////////////////////////

//Load Functions

///////////////////////////////////////////////////////////////////////////////

window.onload = function()
{
    initCanvas();
    startBgAnimation();
}

function initCanvas()
{
  //Initialize game table
  score.innerHTML = 0;

  //Draw canvas for the 1st time
  cvsContext.fillStyle = 'black';
  cvsContext.fillRect(0,0,cvs.width,cvs.height);    
}

///////////////////////////////////////////////////////////////////////////////

//Background Tank Animation

///////////////////////////////////////////////////////////////////////////////

function startBgAnimation()
{
    bgTank = new Sprite(-TANKSIZE * 2, cvs.height / 2, RIGHT, TANKSIZE, TANKSIZE, "src/blue_tank.png", false);
    intervalID = setInterval(bgAnimation, 1000/WINDOW_FPS);
}

function bgAnimation()
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

function endBgAnimation()
{
    clearInterval(intervalID);
    cvsContext.fillStyle = 'black';
    cvsContext.fillRect(0,0,cvs.width,cvs.height);
}

//////////////////////////////////////////////////////////////////////////////

//Room Selection / Pre Game Functions

///////////////////////////////////////////////////////////////////////////////

form.addEventListener("submit", function(event)
{
    if (form[1].value == "Play Again?")
        return;

    event.preventDefault();
    if (form[1].value == "Ready")
        sendReady();
    else if (form[1].value == "Join Room")
        joinRoom();
    else
    {
        console.log("WTF was on that button");
        assert(false);
    }
});

function joinRoom()
{
    socket.emit("joinRoom", form[0].value)

    instructions.innerHTML = "You are the <span style=\"color: rgb(123, 215, 55);\">GREEN</span> tank. They are the <span style=\"color: rgb(91, 139, 240);\">BLUE</span> tank.<br>Use WASD to move and SPACE to shoot. It takes time to reload!<br>Hit them and don't get hit! Have fun!";
    textBox.style.display = "none";
    roomSelect.style.margin = "auto";
    button.value = "Ready";
    button.disabled = true;
}

socket.on("playerConnection", function(text, roomID, num)
{
    roomNum.innerHTML = roomID;
    banner.innerHTML = "Waiting For " + num + " More Players"
    button.disabled = true;
    button.style.backgroundColor = "";
    console.log(text + roomID);
});

socket.on("roomFull", function()
{
    banner.innerHTML = "Room Full, Ready up!";
    button.disabled = false;
});

function sendReady()
{
    socket.emit("socketReady");

    button.disabled = true;
    button.style.backgroundColor = "green";
}

///////////////////////////////////////////////////////////////////////////////

//Game Logic

///////////////////////////////////////////////////////////////////////////////

//get number of tanks and create sprites
socket.on("gamestart", function(tanks)
{
    welcome.style.display = "none";
    endBgAnimation();

    console.log("Game Started!");
    for (var i = 0; i < tanks.length; i++)
    {
        var color = "blue";
        if (tanks[i].id == socket.id)
        {
            console.log("You are tank " + i);
            color = "green";
        }

        tankSprites[i] = new Sprite(tanks[i].hitBox.pos.x, tanks[i].hitBox.pos.y, tanks[i].direction, 
                                    TANKSIZE, TANKSIZE, "src/" + color + "_tank.png", true);

        tankSprites[i].updateSprite(tanks[i].hitBox.pos.x, tanks[i].hitBox.pos.y, tanks[i].direction);
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
        //console.log("Player " + tanks[i].id + " Tanks Position: " + tanks[i].hitBox.pos.x + ", " + tanks[i].hitBox.pos.y);
        tankSprites[i].updateSprite(tanks[i].hitBox.pos.x, tanks[i].hitBox.pos.y, tanks[i].direction);

        //console.log("Tank " + tanks[i].id + " has " + tanks[i].bullets.length + " bullets");
        for (var j = 0; j < tanks[i].bullets.length; j++)
        {
            //console.log(tanks[i].bullets[j].hitBox.pos.x + " " + tanks[i].bullets[j].hitBox.pos.y);
            cvsContext.fillStyle = 'white';
            cvsContext.fillRect(tanks[i].bullets[j].hitBox.pos.x,
                                cvs.height-tanks[i].bullets[j].hitBox.pos.y,
                                BULLETSIZE,BULLETSIZE);
        }

        if (tanks[i].id == socket.id)
            score.innerHTML = tanks[i].score;
    }
});

//erase board and clean up after game ends
socket.on("gameend", function()
{
    console.log("Game Ended!");

    welcome.style.display = "initial";
    banner.innerHTML = "Game Over!"
    instructions.innerHTML = "You got " + score.innerHTML + " points!";
    button.value = "Play Again?";
    button.style.backgroundColor = "";
    button.disabled = false;

    cvsContext.fillStyle = 'black';
    cvsContext.fillRect(0,0,cvs.width,cvs.height);
});

///////////////////////////////////////////////////////////////////////////////

//Gameplay

///////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////

//Debug

///////////////////////////////////////////////////////////////////////////////

socket.on("msg", function(text)
{
    console.log(text);
});