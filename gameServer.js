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
		//move full room to not full room queue
		var numInRoom = --fullRooms.get(roomID)[NUMINROOM];
		notFullRooms.push(fullRooms.get(roomID));
		fullRooms.delete(roomID);
		console.log("Room " + roomID + " no longer full! numInRoom: " + numInRoom);
	}
	else
	{
		//update room in not full room queue
	}
}

//test function
function test()
{
	console.log("test");
}