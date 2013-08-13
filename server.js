var express = require('express')
  , app = express()
  , model = require('./models/')

//  configuration node
app.configure(function(){
	if( app.get('env') === 'development' )
		app.use(express.static( __dirname + '/public' ));
	else
		app.use(express.static( __dirname + '/assets' ));

	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');
});
 
// connect to mongodb and start server
model.connect(function(){
	 
	var port = process.env.PORT || 5000; 
var io = require('socket.io').listen(app.listen(port));
io.set('log level', 1); // reduce logging
	io.sockets.on('connection', function (socket) {
		socket.emit('message', { message: 'welcome to the chat' });
		// socket.on('get', function (data) {
		// 	console.log( '222' )
  //       	io.sockets.emit('message', {hellow : 'world'});
  //  		});
	setTimeout(function(){
		   		socket.broadcast.emit('message', {hellow : 'sssss'});

		   	}, 3000)
	});
	
		// connect socket io
});

app.get('/', function (req, res) {
	res.render('index');
});

var socketIO;
exports.sendDetails = function(data){
};
