const FPS = 30;
const port = 8888;
var players = [];
var numPlayers = 0;

const PLAYERSPERROOM = 2;

//imported libraries
var http = require("http");
var express = require("express");
var socketio = require("socket.io");
var UUID = require("uuid");
var linkedList = require("linkedlist");

var app = express();
var server = http.createServer(app);
var io = socketio(server);

//Invariants:
//fullRooms only has fully occupied rooms
//notFullRooms only has rooms that are neither full nor empty
var fullRooms = new linkedList();
var notFullRooms = new linkedList();

app.use(express.static(__dirname + "/client"));

server.listen(port, serverStart);

function serverStart()
{
	console.log("Server Started on Port: " + port);
	setInterval(update, 1000/framesPerSecond);
}

io.on("connection", onConnection)

function onConnection(socket)
{
	players[numPlayers] = socket;
	numPlayers++;
	console.log("New Player Joined! ID: " + socket.id + " numPlayers: " + numPlayers);

	//put players into rooms
	joinRoom(socket);

	//client disconnect
	socket.on("disconnect", function()
	{
		numPlayers--;
		players.splice(findPlayerIndex(socket), 1);
		console.log("Player " + socket.id + " has left! " + numPlayers + " still on.");
		console.log("Array size: " + players.length);
	});

	//test client interaction
	socket.on("test", test)
}

//puts client into a room
function joinRoom(socket)
{

}

//finds player in player list by id
function findPlayerIndex(socket)
{
	for (var i = 0; i < players.length; i++) 
	{
		if (players[i].id == socket.id)
			return i;
	}
	return -1;
}

//test function
function test()
{
	console.log("test");
}