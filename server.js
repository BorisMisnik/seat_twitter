var express = require('express')
  , app = express()
  , model = require('./models/')

//  configuration node
app.configure(function(){
	app.use(express.static( __dirname + '/public' ));
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');
});
 
// connect to mongodb and start server
model.connect(function(){
	var port = process.env.PORT || 5000; 
	// connect socket io
	var io = require('socket.io').listen(app.listen(port));
	io.set('log level', 1); // reduce logging
	io.sockets.on('connection', function (socket){
		socketIO = socket;
	});
	console.log( 'server listen on port: ' + port );
});

var socketIO;
exports.sendDetails = function(data){
	console.log(data);
	socketIO.broadcast.emit('details', data);
};

app.get('/', function (req, res) {
	res.render('index');
});

app.post('/', function(req, res){
	model.getDetails(function(data){
		res.send(data);
	});
});

