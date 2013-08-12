var app = require('express')()
  , express = require('express')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
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
	var port = process.env.PORT || 3000;  
	// server.listen(port, function(){
	// 	console.log( 'Server listen on port ' + port );
	// 	// start stream;
	// 	model.startStriming() 
	// });
});

app.get('/', function (req, res) {
	res.render('index');
});

var socketIO;
exports.sendDetails = function(data){
	socketIO.emit('detail', data);
}
// connect socket io
// io.set('log level', 1); // reduce logging
// io.sockets.on('connection', function (socket) {
// 	socketIO = socket;
// 	socket.on('getDetails', function(){
// 		// get all share details
// 		model.getDetails('all');
// 	});
// });
