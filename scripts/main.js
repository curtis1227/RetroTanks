var cvs;
var cvsContext;
var tanks = [];

window.onload = function() {
  //Initialize variables
  cvs = document.getElementById('gameCanvas');
  cvsContext = cvs.getContext('2d');

  cvsContext.fillStyle = 'black';
  cvsContext.fillRect(0,0,cvs.width,cvs.height);

  tanks[0] = new Tank(cvs.width/2,cvs.height/2,'blue');

  //Update per time
  var framesPerSecond = 30;
  setInterval(update, 1000/framesPerSecond);
}

function update() {
  tanks[0].moveHori(2);
  tanks[0].moveVert(2);

  //Redraw canvas
  cvsContext.fillStyle = 'black';
  cvsContext.fillRect(0,0,cvs.width,cvs.height);

  //Draw tanks
  for(var i = 0;i<tanks.length;i++){
    tanks[i].draw();
  }
}