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

var players = new Map();
var numPlayers = 0;

//Invariants:
//fullRooms only has fully occupied rooms
//notFullRooms only has rooms that are neither full nor empty
var fullRooms = new Map();
var notFullRooms = new linkedList();

////VARIABLES FOR GAMES////
const CVSWIDTH = 800;
const CVSHEIGHT = 600;
const TANKSIZE = 84;
const BULLETSIZE = 4;
const W = 87, D = 68    , S = 83    , A = 65    , SPACE = 32;
const UP = 0, RIGHT = 90, DOWN = 180, LEFT = 270;

//CHANGE THESE TO MAKE GAMEPLAY MORE INTERESTING
var moveAmt = 5;
var shootDelay = 20;
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
	for (var room of fullRooms.values())
	{
		updateGame(room);
	}
}

//update game within a room
function updateGame(room)
{
	//update game
	room.game.update();

	//update players
	io.to(room.id).emit("gamestate", room.game.tanks);
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

	//listen for player move (tank move or shoot)
	socket.on("move", function(move){
		if (fullRooms.has(socket.room))
		{
			fullRooms.get(socket.room).game.playerMove(socket.id, move);
			//console.log("Player " + socket.id + " moved: " + move);
		}
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

	var room = notFullRooms.head;
	socket.join(room.id);
	socket.room = room.id;

	room.playersInRoom.set(socket.id, socket);

	io.to(room.id).emit("msg", socket.id + " has joined the room.");
	console.log("Player " + socket.id + " has joined room " + room.id);

	//move room from notFullRooms to fullRooms
	if (++room.numInRoom >= PLAYERSPERROOM)
	{
		console.log("Room " + room.id + " full with " + room.numInRoom + " players");

		room.game = new TankGame(room.playersInRoom);
		io.to(room.id).emit("gamestart", room.game.tanks);
		console.log("Game in Room " + room.id + " started");

		fullRooms.set(room.id, room);
		notFullRooms.pop();
	}
}

//puts new room into queue
function createRoom()
{
	var newRoom = new Room();
	newRoom.id = UUID();
	newRoom.numInRoom = 0;
	console.log("Room " + newRoom.id + " Created!");

	notFullRooms.push(newRoom);
}

//removes client from room
function leaveRoom(socket)
{
	var roomID = socket.room;
	io.to(roomID).emit("msg", socket.id + " has left the room.");
	console.log(socket.id + " has left room " + roomID);

	if (fullRooms.has(roomID))
	{
		var room = fullRooms.get(roomID);
		stopGame(room);
		console.log(room.game);

		//move full room to not full room queue
		--room.numInRoom;
		room.playersInRoom.delete(socket.id);

		for (var i of room.playersInRoom.values())
		{
			console.log(i.id);
		}

		//console.log(room.playersInRoom.has(roomID));

		notFullRooms.push(room);
		fullRooms.delete(roomID);
		console.log("Room " + roomID + " no longer full! numInRoom: " + room.numInRoom);
	}
	else
	{
		//update room in not full room queue
		while (notFullRooms.next())
		{
			if (notFullRooms.current.id == roomID)
			{
				--notFullRooms.current.numInRoom;
				notFullRooms.current.playersInRoom.delete(roomID);
				console.log("Room " + roomID + " updated to have " + (notFullRooms.current.numInRoom) + " players");
				if (notFullRooms.current.numInRoom <= 0)
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
	room.game = undefined;
	delete room.game;
	io.to(room.id).emit("gameend");
	console.log("Game in Room " + room.id + " ended");
}

//test function
function test()
{
	console.log("test");
}

function Room()
{
	this.id = -1;
	this.numInRoom = -1;
	this.game = undefined;
	this.playersInRoom = new Map();
}

/*************/
/**GAME CODE**/
/*************/

////TankGame object////
function TankGame(playersInRoom){

	this.numTanks = 0;
	this.tanks = undefined;
	this.tanks = [];

	for (var socket of playersInRoom.values())
	{
		this.tanks[this.numTanks] = new Tank(socket.id);
		this.numTanks++;
	}

	//update player's tank with move
	this.playerMove = function(playerID, move)
	{
		for (var i = 0; i < this.numTanks; i++)
		{
			if (this.tanks[i].id == playerID)
			{
				if (move == "shoot")
				{
					this.tanks[i].fireBullet();
				}
				else
				{
					this.tanks[i].move(move);
				}
			}
		}
	}

	this.update = function()
	{
		//Check bullets collision with tanks
	  	for(var i = 0;i<this.tanks.length;i++){
	    	for(var j = 0;j<this.tanks[i].bullets.length;j++){
	      		for(var k = 0;k<this.tanks.length;k++){
			        //Skip the tank that fired
			        if(i == k) {continue;}

			        var bulletX = this.tanks[i].bullets[j].posX;
			        var bulletY = this.tanks[i].bullets[j].posY;
			        //If collided
			        if(bulletX < this.tanks[k].posX + TANKSIZE/2 &&
			           bulletX > this.tanks[k].posX - TANKSIZE/2 &&
			           bulletY < this.tanks[k].posY + TANKSIZE/2 &&
			           bulletY > this.tanks[k].posY - TANKSIZE/2) {
				        //Delete the bullet and update score
				        this.tanks[i].deleteBullet(j);
				        this.tanks[i].score += 1;

				        //Move tank off screen
				        this.tanks[k].posX = -100;
				        this.tanks[k].posY = -100;
				    }

				    if (bulletX < 0 || bulletX > CVSWIDTH ||
				    	bulletY < 0 || bulletY > CVSHEIGHT)
				    {
				        this.tanks[i].deleteBullet(j);				    	
				    }
		        }
	      	}
	    }

	    //Update tanks and bullets
  		for(var i = 0;i<this.tanks.length;i++){
    		this.tanks[i].update(); //Move this inside above for loop?
  		}
	}
}

//Tank object
function Tank(playerID){
  //Initialize vars
  this.id = playerID;
  //TODO change tank starting positions
  this.posX = Math.random() * CVSWIDTH;
  this.posY = Math.random() * CVSHEIGHT;
  this.direction = UP;
  this.bullets = [];
  this.shootCooldown = 0;
  this.score = 0;

  ////MEMBER FUNCTIONS////
  //Update tank
  this.update = function(){
    if (this.shootCooldown-- <= 0)
      this.shootCooldown = 0;
    //console.log(this.shootCooldown);
    
    //Update bullets
    for(var i = 0;i < this.bullets.length;i++){
      this.bullets[i].update();
    }

  }
  //Move
  this.move = function(Idirection){
  	//console.log("Player " + this.id + "'s Moved!");
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
    else if (this.posX + TANKSIZE / 2 >= CVSWIDTH)
      this.posX += -moveAmt;
    else if (this.posY + TANKSIZE / 2 >= CVSHEIGHT)
      this.posY += -moveAmt;
    else if (this.posX - TANKSIZE / 2 < 0)
      this.posX += moveAmt;
    //console.log(cvs.width + " " + cvs.height);
    //console.log(this.posX + " " + this.posY);
  }
  //Fire bullet; REMEMBER TO DELETE BULLETS
  this.fireBullet = function(){
  	//console.log("Player " + this.id + "'s Tank Shot A Bullet!");
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

  console.log("New Tank created for Player " + this.id);
}

/*****************/
/**Bullet Object**/
/*****************/
function Bullet(IposX,IposY,IspeedX,IspeedY){
  //Initialize vars
  this.posX = IposX;
  this.posY = IposY;
  this.speedX = IspeedX;
  this.speedY = IspeedY;

  ////MEMBER FUNCTIONS////
  //Update bullet
  this.update = function(){
    this.posX += this.speedX;
    this.posY += this.speedY;
  }

  //Draw bullet for the 1st time
  this.update();
}