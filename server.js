var port = 8080;

var http = require("http");
var express = require("express");
var socketio = require("socket.io");

var app = express();
var server = http.createServer(app);
var io = socketio(server);


io.on("connection", onConnection);


app.use(express.static(__dirname + "/client"));

server.listen(port, function() {console.log("Server Started on Port: " + port);});

function onConnection(sock)
{
	sock.emit("msg", "Hello World!");
	sock.on("mouse", function(text) {io.emit("msg", text);});
}