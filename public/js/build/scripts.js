$(document).ready(function(){
	var socket = io.connect(window.location.href);
	socket.emit('getDetails');
	socket.on('tweet', function (data) {
	  console.log( data );
	});
});
