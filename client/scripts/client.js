var sock = io();
var field = document.getElementById("text");

sock.on("msg", onConnect);

function onConnect(handshake)
{
	field.innerHTML = handshake;
}

field.onmouseover = function()
{
	sock.emit("mouse", "moused over!");
}