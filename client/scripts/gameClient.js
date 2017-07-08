var socket = io();

var text = document.getElementById("test");

text.onmouseover = function()
{
	socket.emit("test", []);
}