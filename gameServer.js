////imported libraries////
var http = require("http");
var express = require("express");
var socketio = require("socket.io");
var UUID = require("uuid");
var linkedList = require("linkedlist");

////VARIABLES FOR SERVER////
const PORT = 7777;
const FPS = 30;
const PLAYERSPERROOM = 2;
const ID = 0;
const NUMINROOM = 1;
const GAME = 2;

var players = new Map();
var numPlayers = 0;

//Invariants:
//fullRooms only has fully occupied rooms
//notFullRooms only has rooms that are neither full nor empty
var fullRooms = new Map();
var notFullRooms = new linkedList();

////VARIABLES FOR GAMES////
const TANKSIZE = 84;
const BULLETSIZE = 4;
const W = 87, D = 68    , S = 83    , A = 65    , SPACE = 32;
const UP = 0, RIGHT = 90, DOWN = 180, LEFT = 270;

var moveAmt = 2;
var shootDelay = 45;
var bulletSpeed = 10;

////setting up server////
var app = express();
var server = http.createServer(app);
var io = socketio(server);

app.use(express.static(__dirname + "/client"));
server.listen(PORT, serverStart);

//when server starts
function serverStart()
{
	console.log("Server Started on Port: " + PORT);
    //set rate to update clients
	setInterval(updateRooms, 1000/FPS);
}

//updates all rooms
function updateRooms()
{
	for (var [roomID, room] of fullRooms)
	{
		updateGame(room);
	}
}

//update game within a room
function updateGame(room)
{
	var roomID = room[ID];

	//update game
	room[GAME].update();

	//update players
	io.to(roomID).emit("gameState", room[GAME].gameState);
}

/**********************/
/**SERVER CONNECTIONS**/
/**********************/

//listens for client and executes accordingly
io.on("connection", onConnection)
function onConnection(socket)
{
	//client connect
	players.set(socket.id, socket);
	numPlayers++;
	console.log("New Player Joined! ID: " + socket.id + " numPlayers: " + numPlayers);

	joinRoom(socket);

	//client disconnect
	socket.on("disconnect", function()
	{
		numPlayers--;
		players.delete(socket.id);
		console.log("Player " + socket.id + " has left! " + numPlayers + " still on.");
		//console.log("Player table size: " + players.length);

		leaveRoom(socket);
	});

	//listen for tank movement
	socket.on("moveTank", function(Idirection){
		/*PLACEHOLDER FOR TANK MOVE COMMAND*/
		console.log("Move Player " + socket.id + "'s tank: " + Idirection);
	});

	//listen for bullet shoot
	socket.on("shootBullet", function(){
		/*PLACEHOLDER FOR SHOOT BULLET COMMAND*/
		console.log("Player " + socket.id + " shot bullet");
	});
}

//puts client into a room
function joinRoom(socket)
{
	//no rooms in queue
	if (notFullRooms.head == null)
	{
		//console.log("creating new room!");
		createRoom();
	}

	var roomID = notFullRooms.head[ID];
	socket.join(roomID);
	socket.room = roomID;

	io.to(roomID).emit("msg", socket.id + " has joined the room.");
	console.log("Player " + socket.id + " has joined room " + roomID);

	//move room from notFullRooms to fullRooms
	if (++notFullRooms.head[NUMINROOM] >= PLAYERSPERROOM)
	{
		console.log("Room " + notFullRooms.head[ID] + " full with " + notFullRooms.head[NUMINROOM] + " players");
		
		notFullRooms.head[GAME] = new TankGame(notFullRooms.head[NUMINROOM]);
		console.log("Game in Room " + room[ID] + " started");

		fullRooms.set(notFullRooms.head[ID], notFullRooms.head);
		notFullRooms.pop();
	}
}

//puts new room into queue
function createRoom()
{
	var newRoom = [];
	notFullRooms.push(newRoom);
	notFullRooms.head[ID] = UUID();
	notFullRooms.head[NUMINROOM] = 0;
	//console.log("room num players: " + notFullRooms.head[NUMINROOM]);
	console.log("Room " + notFullRooms.head[ID] + " Created!");
}

//removes client from room
function leaveRoom(socket)
{
	var roomID = socket.room;
	io.to(roomID).emit("msg", socket.id + " has left the room.");
	console.log(socket.id + " has left room " + roomID);

	if (fullRooms.has(roomID))
	{
		stopGame(fullRooms.get(roomID));

		//move full room to not full room queue
		var numInRoom = --fullRooms.get(roomID)[NUMINROOM];
		notFullRooms.push(fullRooms.get(roomID));
		fullRooms.delete(roomID);
		console.log("Room " + roomID + " no longer full! numInRoom: " + numInRoom);
	}
	else
	{
		//update room in not full room queue
		while (notFullRooms.next())
		{
			if (notFullRooms.current[ID] == roomID)
			{
				console.log("Room " + roomID + " updated to have " + (--notFullRooms.current[NUMINROOM]) + " players");
				if (notFullRooms.current[NUMINROOM] <= 0)
				{
					notFullRooms.removeCurrent();
					console.log("Room " + roomID + " deleted");
				}
				notFullRooms.resetCursor();
				return;
			}
		}
		console.log("ERROR: Room " + roomID + " not found!");
	}
}

//stops game in room
function stopGame(room)
{
	//can expand this more later
	delete room[GAME];
	console.log("Game in Room " + room[ID] + " ended");
}

//test function
function test()
{
	console.log("test");
}

/*************/
/**GAME CODE**/
/*************/

////TankGame object////
function TankGame(numTanks){

	this.gamestate = [];
	this.numTanks = numTanks;
	this.tanks = [];

	this.update = function()
	{
		//Check bullets collision with tanks
	  	for(var i = 0;i<tanks.length;i++){
	    	for(var j = 0;j<tanks[i].bullets.length;j++){
	      		for(var k = 0;k<tanks.length;k++){
		        //Skip the tank that fired
		        if(i == k) {continue;}

		        var bulletX = tanks[i].bullets[j].posX;
		        var bulletY = tanks[i].bullets[j].posY;
		        //If collided
		        if(bulletX < tanks[k].posX + TANKSIZE/2 &&
		           bulletX > tanks[k].posX - TANKSIZE/2 &&
		           bulletY < tanks[k].posY + TANKSIZE/2 &&
		           bulletY > tanks[k].posY - TANKSIZE/2) {
			        //Delete the bullet and update score
			        tanks[i].deleteBullet(j);
			        tanks[i].score += 1;

			        //Move tank off screen
			        tanks[k].posX = -100;
			        tanks[k].posY = -100;
		        }
	      	}
	    }

	    //Update tanks and bullets
  		for(var i = 0;i<tanks.length;i++){
    		tanks[i].update(); //Move this inside above for loop?
  		}
	}
}

//Tank object
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