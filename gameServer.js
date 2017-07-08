var port = 8888;
var players = [];
var numPlayers = 0;

var http = require("http");
var express = require("express");
var socketio = require("socket.io");

var app = express();
var server = http.createServer(app);
var io = socketio(server);

var UUID = require("uuid");

app.use(express.static(__dirname + "/client"));

server.listen(port, serverStart);

function serverStart()
{
	console.log("Server Started on Port: " + port);
}

io.on("connection", onConnection)

function onConnection(socket)
{
	socket.id = UUID();
	players[numPlayers] = socket;
	numPlayers++;
	console.log("New Player Joined! ID: " + socket.id + " numPlayers: " + numPlayers);

	socket.on("disconnect", function()
	{
		numPlayers--;
		players.splice(findPlayerIndex(socket), 1);
		console.log("Player " + socket.id + " has left! " + numPlayers + " still on.");
		console.log("Array size: " + players.length);
	});

	socket.on("test", function()
	{
		console.log("test");
	});
}

function findPlayerIndex(socket)
{
	for (var i = 0; i < players.length; i++) 
	{
		if (players[i].id == socket.id)
			return i;
	}
	return -1;
}