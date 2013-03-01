function loaded() {
	// test Socket.io

	var msgLocation = document.getElementById('servermsg');
	var socket = io.connect('http://localhost');
	// callback from server
	socket.on('init', function (data) {
		console.log(data);
		// set p tag to message
		msgLocation.innerHTML = data.msg;
		// disconnect socket
		socket.disconnect();
		console.log("Socket.io test done");
	});

	// test EaselJS

	var sittersonjpg = "https://twimg0-a.akamaihd.net/profile_images/2852578946/422971662752b174a0afa3c2ab069f5b.jpeg"
	// create a stage by getting a reference to the canvas
	stage = new createjs.Stage("gamecanvas");
	// load image
	var bitmap = new createjs.Bitmap(sittersonjpg);
	// set image position
	bitmap.x = (stage.canvas.width / 2) - 128;
	bitmap.y = (stage.canvas.height / 2) - 128;
	// add instance to stage display list.
	stage.addChild(bitmap);
	// show some text in the canvas too
	text = new createjs.Text("[This text is in the canvas]", "20px Arial", "#777777");
    text.x = 85;
    text.y = 0;
    stage.addChild(text);
	// update stage will render next frame
	stage.update();
	console.log("EaselJS test done");

	//TODO test Joose
}
window.onload = loaded; // call when everything has loaded