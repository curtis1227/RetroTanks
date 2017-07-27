////imported libraries////
var http = require("http");
var express = require("express");
var socketio = require("socket.io");
var UUID = require("uuid");
var linkedList = require("linkedlist");
var SAT = require("sat");

////VARIABLES FOR SERVER////
const PORT = 7777;
const FPS = 30;
const PLAYERSPERROOM = 4;

var players = new Map();
var numPlayers = 0;

//Invariants:
//fullRooms only has fully occupied rooms
//notFullRooms only has rooms that are neither full nor empty
var fullRooms = new Map();
var notFullRooms = new linkedList();
var postGameRooms = new Map();

////VARIABLES FOR GAMES////
const CVSWIDTH = 800;
const CVSHEIGHT = 600;
const CVS_TOP = new SAT.Polygon(new SAT.Vector(0,CVSHEIGHT),[new SAT.Vector(), new SAT.Vector(CVSWIDTH,0)]);
const CVS_LEFT = new SAT.Polygon(new SAT.Vector(),[new SAT.Vector(), new SAT.Vector(0,CVSHEIGHT)]);
const CVS_BOTTOM = new SAT.Polygon(new SAT.Vector(),[new SAT.Vector(), new SAT.Vector(CVSWIDTH,0)]);
const CVS_RIGHT = new SAT.Polygon(new SAT.Vector(CVSWIDTH,0),[new SAT.Vector(), new SAT.Vector(0,CVSHEIGHT)]);
const INI_TANKHEIGHT = 84, INI_TANKWIDTH = 70;
const BULLETSIZE = 4;
const W = 87, D = 68    , S = 83    , A = 65    , SPACE = 32;
const UP = 0, RIGHT = 90, DOWN = 180, LEFT = 270;
const GAMEOVER = -1;

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
		if (room.game != null)
		{
			if(updateGame(room) == GAMEOVER)
			{
				postGameRooms.set(room.id, room);
				fullRooms.delete(room.id);
				console.log("Room " + room.id + " moved to postGameRooms");
			}
		}
	}
}

//update game within a room
function updateGame(room)
{
	//update game and process player moves
	if (room.game.update() == GAMEOVER)
	{
		stopGame(room);
		return GAMEOVER;
	}

	//update players with updated tank/bullet positions
	io.to(room.id).emit("gamestate", room.game.tanks);
}

/**********************/
/**SERVER CONNECTIONS**/
/**********************/

//listens for client and executes accordingly
io.on("connection", onConnection);
function onConnection(socket)
{
	//client connect
	players.set(socket.id, socket);
	numPlayers++;
	console.log("New Player Joined! ID: " + socket.id + " numPlayers: " + numPlayers);

	socket.on("setName", function(name)
	{
		socket.name = name;
		console.log("Player " + socket.id + " name set to: " + socket.name);
	});

	socket.on("joinRoom", function(roomID)
	{
		joinRoom(socket, roomID);
	});

	socket.on("socketReady", function()
	{
		var room = fullRooms.get(socket.room);
		socket.ready = true;
		room.playersInRoom.set(socket.id, socket);

		var allReady = true;
		for (var player of room.playersInRoom.values())
		{
			allReady &= player.ready;
		}

		if (allReady)
		{
			room.game = new TankGame(room.playersInRoom);
			io.to(room.id).emit("gamestart", room.game.tanks);
			console.log("Game in Room " + room.id + " started");
		}
	});

	socket.on("leaveRoom", function()
	{
		if (socket.room != null)
			leaveRoom(socket);
	});

	//client disconnect
	socket.on("disconnect", function()
	{
		numPlayers--;
		players.delete(socket.id);
		console.log("Player " + socket.id + " has left! " + numPlayers + " still on.");
		//console.log("Player table size: " + players.length);

		if (socket.room != null) 
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

	//test message on server from client
	socket.on("test", test);
}

//puts client into a room
function joinRoom(socket, roomID)
{
	var room;
	var roomFound = false;
	socket.ready = false;

	//find user specified room
	while (notFullRooms.next())
	{
		if (notFullRooms.current.id == roomID)
		{
			room = notFullRooms.current;
			roomFound = true;
			break;
		}
	}
	notFullRooms.resetCursor();

	//actions to perform if room wasn't found
	if (!roomFound)
	{
		//no rooms in queue
		if (notFullRooms.head == null)
			createRoom();

		room = notFullRooms.head;
		roomID = room.id;
	}

	socket.join(roomID);
	socket.room = roomID;

	room.playersInRoom.set(socket.id, false);

	io.to(room.id).emit("playerConnection", socket.id + " has joined room: ", roomID, PLAYERSPERROOM - room.numInRoom - 1);
	console.log("Player " + socket.id + " has joined room " + room.id);

	//move room from notFullRooms to fullRooms
	if (++room.numInRoom >= PLAYERSPERROOM)
	{
		console.log("Room " + room.id + " full with " + room.numInRoom + " players");
		io.to(roomID).emit("roomFull");

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
	console.log("Player " + socket.id + " has left room " + roomID);

	if (fullRooms.has(roomID))
	{
		leaveFullRoom(socket);
	}
	else if (postGameRooms.has(roomID))
	{
		leavePostGameRoom(socket);
	}
	else
	{
		leaveNotFullRoom(socket);
	}
}

//player leaves a full room
function leaveFullRoom(socket)
{
	var room = fullRooms.get(socket.room);
	room.numInRoom--;
	room.playersInRoom.delete(socket.id);
	console.log("Room " + room.id + " updated to have " + room.numInRoom + " players");

	//a player leaving a full room with a game going on signifies game over
	if (room.game != null)
	{
		//stop game (and update players) and move room to postGameRooms
		stopGame(room);
		postGameRooms.set(room.id, room);
		fullRooms.delete(room.id);
		console.log("Room " + room.id + " moved to postGameRooms");
	}
	//a player leaving a full room with no game going on means players need to reready
	else
	{
		//reset player ready states
		for (var player of room.playersInRoom.values())
		{
			player.ready = false;
		}

		//update players and move room to notFullRooms
		io.to(room.id).emit("playerConnection", "Player " + socket.id + " has left room: ", room.id, PLAYERSPERROOM - room.numInRoom);
		notFullRooms.push(room);
		fullRooms.delete(room.id);
		console.log("Room " + room.id + " no longer full!");
	}
}

//player leaves a post game room
function leavePostGameRoom(socket)
{
	var room = postGameRooms.get(socket.room);
	room.numInRoom--;
	room.playersInRoom.delete(socket.id);
	console.log("Room " + room.id + " updated to have " + room.numInRoom + " players");

	if (room.numInRoom <= 0)
	{
		postGameRooms.delete(room.id);
		console.log("Room " + room.id + " deleted");
	}
}

//player leaves a room in queue
function leaveNotFullRoom(socket)
{
	var roomID = socket.room;
	while (notFullRooms.next())
	{
		if (notFullRooms.current.id == roomID)
		{
			notFullRooms.current.numInRoom--;
			notFullRooms.current.playersInRoom.delete(socket.id);
			io.to(roomID).emit("playerConnection", "Player " + socket.id + " has left room: ", roomID, PLAYERSPERROOM - notFullRooms.current.numInRoom);
			
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

	console.log("Error: Room " + roomID + " Was Not a NotFullRoom!");
	notFullRooms.resetCursor();
}

//stops game in room
function stopGame(room)
{
	//can expand this more later
	io.to(room.id).emit("gameend", room.game.tanks);
	delete room.game;
	console.log("Game in Room " + room.id + " ended");
}

////Room object////
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
	this.numAlive = 0;
	this.tanks = undefined;
	this.tanks = [];

	for (var socket of playersInRoom.values())
	{
		this.tanks[this.numTanks] = new Tank(socket);
		this.numTanks++;
		this.numAlive++;
	}

	//update player's tank with move
	this.playerMove = function(playerID, move)
	{
		for (var i = 0; i < this.numTanks; i++)
		{
			if (this.tanks[i].id == playerID && this.tanks[i].dead == false)
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
		if (this.numAlive <= 1)
		{
			return GAMEOVER;
		}
		//Check bullets collision with tanks
	  	for (var i = 0;i<this.tanks.length;i++)
	  	{
	    	for (var j = 0;j<this.tanks[i].bullets.length;j++)
	    	{
	    		//Check bullet collision with edges
	    		if (this.tanks[i].bullets[j].hitBox.pos.x < 0 || 
	    			this.tanks[i].bullets[j].hitBox.pos.x + BULLETSIZE > CVSWIDTH ||
			    	this.tanks[i].bullets[j].hitBox.pos.y < 0 || 
			    	this.tanks[i].bullets[j].hitBox.pos.y + BULLETSIZE > CVSHEIGHT)
			    {
			        this.tanks[i].deleteBullet(j);
			        j--;
			        continue;
			    }

      		for (var k = 0; k < this.tanks.length; k++)
      		{
		        //Skip the tank that fired
		        if(i == k) {continue;}
		        //If collided
		        if (SAT.testPolygonPolygon(this.tanks[i].bullets[j].hitBox.toPolygon(),this.tanks[k].hitBox))
		        {
		        	//console.log("Tank " + i + "'s " + j + "th Bullet hit Tank " + k);
			        //Delete the bullet and update score
			        this.tanks[i].deleteBullet(j);
			        j--;
			        this.tanks[i].score += 1;

			        //Move tank off screen
			        this.tanks[k].hitBox.pos = new SAT.Vector(-100,-100);
			        this.tanks[k].dead = true;
			        this.numAlive--;

	                //Break to stop checking if the deleted bullet (now undefined) hit other tanks
	                break;
			    }
	        }
	      }
	    }

	    //Update tanks and bullets
  		for(var i = 0;i<this.tanks.length;i++){
    		this.tanks[i].update();
  		}
	}
}

//Tank object
function Tank(socket){
  //Initialize vars
  this.id = socket.id;
  this.name = socket.name;
  this.hitBox = new SAT.Polygon(getStartingPosition(socket.id)
    , [ new SAT.Vector(-INI_TANKWIDTH/2, -INI_TANKHEIGHT/2)
    , new SAT.Vector(INI_TANKWIDTH/2, -INI_TANKHEIGHT/2)
    , new SAT.Vector(INI_TANKWIDTH/2, INI_TANKHEIGHT/2)
    , new SAT.Vector(-INI_TANKWIDTH/2, INI_TANKHEIGHT/2) ]);
  this.direction = UP;
  this.bullets = [];
  this.shootCooldown = 0;
  this.score = 0;
  this.dead = false;

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
    if(this.direction != Idirection){
      //Set direction
      this.direction = Idirection;
      //Rotate hitBox
      if(Idirection == UP || Idirection == DOWN){
        this.hitBox.setAngle(0);
      } else {
        this.hitBox.setAngle(Math.PI/2);
      }
    }
    
    //Check for bounds of screen and tank collision
    //Up
    if(Idirection == UP){
      this.hitBox.pos.y += moveAmt;
      if(SAT.testPolygonPolygon(this.hitBox,CVS_TOP) || checkTankcollision(this)) {this.hitBox.pos.y += -moveAmt;}
    //Right
    } else if(Idirection == RIGHT){
      this.hitBox.pos.x += moveAmt;
      if(SAT.testPolygonPolygon(this.hitBox,CVS_RIGHT) || checkTankcollision(this)) {this.hitBox.pos.x += -moveAmt;}
    //Down
    } else if(Idirection == DOWN){
      this.hitBox.pos.y += -moveAmt;
      if(SAT.testPolygonPolygon(this.hitBox,CVS_BOTTOM) || checkTankcollision(this)) {this.hitBox.pos.y += moveAmt;}
    //Left
    } else if(Idirection == LEFT){
      this.hitBox.pos.x += -moveAmt;
      if(SAT.testPolygonPolygon(this.hitBox,CVS_LEFT) || checkTankcollision(this)) {this.hitBox.pos.x += moveAmt;}
    }
    //console.log(this.hitBox);
    //console.log(this.hitBox.pos.x + " " + this.hitBox.pos.y);
  }
  //Fire bullet; REMEMBER TO DELETE BULLETS
  this.fireBullet = function(){
  	//console.log("Player " + this.id + "'s Tank Shot A Bullet!");
    if (this.shootCooldown <= 0)
    {
      //Up
      if(this.direction == UP){
        this.bullets[this.bullets.length] = new Bullet(this.hitBox.pos.x
        	,this.hitBox.pos.y+INI_TANKHEIGHT/2+BULLETSIZE
        	,0,bulletSpeed);
      //Right
      } else if(this.direction == RIGHT){
        this.bullets[this.bullets.length] = new Bullet(this.hitBox.pos.x+INI_TANKHEIGHT/2+BULLETSIZE
        	,this.hitBox.pos.y
        	,bulletSpeed,0);
      //Down
      } else if(this.direction == DOWN){
        this.bullets[this.bullets.length] = new Bullet(this.hitBox.pos.x
        	,this.hitBox.pos.y-INI_TANKHEIGHT/2-BULLETSIZE
        	,0,-bulletSpeed);
      //Left
      } else if(this.direction == LEFT){
        this.bullets[this.bullets.length] = new Bullet(this.hitBox.pos.x-INI_TANKHEIGHT/2-BULLETSIZE
        	,this.hitBox.pos.y
        	,-bulletSpeed,0);
      }
      this.shootCooldown = shootDelay;
    }
  }
  //Delete bullet
  this.deleteBullet = function(bulletNumber){
    //delete this.bullets[bulletNumber];
    this.bullets.splice(bulletNumber,1);
    //console.log("Spliced " + this.id + " bullet " + bulletNumber);
    //console.log(this.bullets);
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
  //hitBox position vector is bottom left corner
  this.hitBox = new SAT.Box(new SAT.Vector(IposX, IposY), BULLETSIZE, BULLETSIZE);
  this.speedX = IspeedX;
  this.speedY = IspeedY;

  ////MEMBER FUNCTIONS////
  //Update bullet
  this.update = function(){
    this.hitBox.pos.x += this.speedX;
    this.hitBox.pos.y += this.speedY;
  }

  //Draw bullet for the 1st time
  this.update();
}

//HELPER FUNCTIONS

//EFFECTS: Returns a random number between min (inclusive) and max (exclusive)
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

//REQUIRES: playertank has the hitbox of the expected position of playertank after move
//EFFECTS: Returns whether the move playertank is trying to make will collide with another tank
function checkTankcollision(playertank){
	//Gets the game of the room the tank is in. hehe.
	var game = fullRooms.get(players.get(playertank.id).room).game;
	for(var tank of game.tanks){
		if(tank == playertank) {continue;}
		if(SAT.testPolygonPolygon(playertank.hitBox,tank.hitBox)){
			//Collided
			return true;
		}
	}
	//No collision
	return false;
}

//EFFECTS: Returns a new SAT.Vector that's the starting position of the tank
function getStartingPosition(tankID){
  var i = 0;
  //console.log(fullRooms.get(players.get(tankID).room));
  for(var playerID of fullRooms.get(players.get(tankID).room).playersInRoom.keys()){
    if(playerID == tankID){
      var halfTankSize = INI_TANKHEIGHT/2;
      switch(i){
        case 0: //Top left
          return new SAT.Vector(getRandom(halfTankSize,CVSWIDTH/3 - halfTankSize),
            getRandom(2*CVSHEIGHT/3 + halfTankSize,CVSHEIGHT - halfTankSize));
        case 1: //Middle right
          return new SAT.Vector(getRandom(2*CVSWIDTH/3 + halfTankSize,CVSWIDTH - halfTankSize),
            getRandom(CVSHEIGHT/3 + halfTankSize,2*CVSHEIGHT/3 - halfTankSize));
        case 2: //Bottom left
          return new SAT.Vector(getRandom(halfTankSize,CVSWIDTH/3 - halfTankSize),
            getRandom(halfTankSize,CVSHEIGHT/3 - halfTankSize));
        case 3: //Top middle
          return new SAT.Vector(getRandom(CVSWIDTH/3 + halfTankSize,2*CVSWIDTH/3 - halfTankSize),
            getRandom(2*CVSHEIGHT/3 + halfTankSize,CVSHEIGHT - halfTankSize));
        case 4: //Bottom right
          return new SAT.Vector(getRandom(2*CVSWIDTH/3 + halfTankSize,CVSWIDTH - halfTankSize),
            getRandom(halfTankSize,CVSHEIGHT/3 - halfTankSize));
        case 5: //Middle left
          return new SAT.Vector(getRandom(halfTankSize,CVSWIDTH/3 - halfTankSize),
            getRandom(CVSHEIGHT/3 + halfTankSize,2*CVSHEIGHT/3 - halfTankSize));
        case 6: //Top right
          return new SAT.Vector(getRandom(2*CVSWIDTH/3 + halfTankSize,CVSWIDTH - halfTankSize),
            getRandom(2*CVSHEIGHT/3 + halfTankSize,CVSHEIGHT - halfTankSize));
        case 7: //Bottom middle
          return new SAT.Vector(getRandom(CVSWIDTH/3 + halfTankSize,2*CVSWIDTH/3 - halfTankSize),
            getRandom(halfTankSize,CVSHEIGHT/3 - halfTankSize));
      }
    }
    i++;
  }
  exit(1); //Something went wrong
}

//TEST FUNCTIONS

function listPlayersInRoom(room)
{
	if (room == undefined)
	{
		console.log("\nError: Room Does Not Exist!\n");
		return;
	}

	console.log("Listing Players in Room " + room.id);
	for (var i of room.playersInRoom.keys())
	{
		console.log(i);
	}
}

function test()
{
	console.log("test");
}
