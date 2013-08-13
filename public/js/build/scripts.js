$(document).ready(function(){
	var socket = io.connect(window.location.href);
	socket.on('details', function(data){
		console.log( data )
	})
});
