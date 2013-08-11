$(document).ready(function(){
	var socket = io.connect(window.location.href);
	socket.on('connect', function () { 
		socket.emit('getDetails')
		socket.on('detail', function(data){
			console.log( data ); 
		});
  	});
});
