var socket = io.connect('http://localhost');
socket.on('tweet', function (data) {
    $('<p>').text(data.text).appendTo('body');
    console.log( data );
});
socket.on('all', function (data) {
    console.log(data); 
});
socket.on('visual', function (data) {
    console.log(data); 
});
socket.on('noVisual', function (data) {
    console.log(data); 
});
socket.on('user connected', function(){
	console.log( 'user connected' );
})