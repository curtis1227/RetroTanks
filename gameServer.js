////imported libraries////
var http = require("http");
var express = require("express");
var socketio = require("socket.io");
var UUID = require("uuid");
var linkedList = require("linkedlist");
var hashTable = require("hashtable");

////VARIABLES FOR SERVER////
const PORT = 7777;
const FPS = 30;
const PLAYERSPERROOM = 2;
const ID = 0;
const NUMINROOM = 1;

var players = new hashTable();
var numPlayers = 0;

//Invariants:
//fullRooms only has fully occupied rooms
//notFullRooms only has rooms that are neither full nor empty
var fullRooms = new hashTable();
var notFullRooms = new linkedList();

////VARIABLES FOR GAMES////
const TANKSIZE = 84;
const BULLETSIZE = 4;
const W = 87, D = 68    , S = 83    , A = 65    , SPACE = 32;
const UP = 0, RIGHT = 90, DOWN = 180, LEFT = 270;

////TankGame object////
function TankGame(){
	var tanks = [];
}

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
	setInterval(update, 1000/FPS);
}

//updates rooms, games, players
function update()
{
	// updateRooms();
	// updateGames();
	// updatePlayers();
}

//listens for client and executes accordingly
io.on("connection", onConnection)
function onConnection(socket)
{
	players.put(socket.id, socket);
	numPlayers++;
	console.log("New Player Joined! ID: " + socket.id + " numPlayers: " + numPlayers);

	//put players into rooms
	joinRoom(socket);

	//client disconnect
	socket.on("disconnect", function()
	{
		numPlayers--;
		players.remove(socket.id);
		console.log("Player " + socket.id + " has left! " + numPlayers + " still on.");
		//console.log("Player table size: " + players.length);
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
	if (notFullRooms.head == null)
	{
		//console.log("creating new room!");
		createRoom();
	}

	var roomID = notFullRooms.head[ID];
	socket.join(roomID);
	socket.room = roomID;
	console.log(socket.room);

	io.to(roomID).emit("msg", socket.id + " has joined the room.");
	console.log(socket.id + " has joined room " + roomID);

	if (notFullRooms.head[NUMINROOM]++ >= PLAYERSPERROOM)
	{
		//move room to fullRooms
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
}

//test function
function test()
{
	console.log("test");
}