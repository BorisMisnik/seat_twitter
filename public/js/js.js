$(document).ready(function(){
	var socket = io.connect(window.location.href);
	socket.emit('get', function(data){
		console.log( data )
	})

    socket.on('message', function (data) {
    	console.log( data )
    });
});
