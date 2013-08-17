var express = require('express')
  , app = express()
  , model = require('./models/')

//  configuration node
app.configure(function(){
	app.use(express.cookieParser());
  	app.use(express.session());
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
		// get share details when user connected
		model.getDetails('all')
	});
});

var socketIO;
exports.sendDetails = function(data){
	// console.log(data)
	socketIO.emit('details', data);
};

app.get('/', function (req, res) {
	res.render('index');
});

