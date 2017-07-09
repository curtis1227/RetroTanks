var cvs;
var ctx;
var sprite;

const SIZE = 84;
const FPS = 30

onload = function()
{
	cvs = document.getElementById("gameCanvas");
	ctx = cvs.getContext("2d");

	sprite = new Sprite(cvs.width / 2 - SIZE / 2, cvs.height / 2 - SIZE / 2, 0, SIZE, SIZE, ctx, "tanks.png");

  	setInterval(update, 1000/FPS);
}

function update()
{
	sprite.updateSprite(cvs.width / 2 - SIZE / 2, cvs.height / 2 - SIZE / 2);
}