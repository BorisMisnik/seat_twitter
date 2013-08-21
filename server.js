var express = require('express')
  , io = require('socket.io')
  , app = express()
  , http = require('http')
  , model = require('./models/')
  , server = http.createServer(app);

//  configuration node
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static( __dirname + '/public' ));
app.set('port', process.env.PORT || 8080);
app.set('view engine', 'jade');

// connect socket io
var sockets = io.listen(server);
sockets.set('log level', 1);

// connect to mongodb and start server
model.connect(function(){
	//Create the server
	server.listen(app.get('port'), function(){
	 	console.log('Express server listening on port ' + app.get('port'));
	});
});
exports.sendDetails = function(data){
	// send to all connection share detail
	sockets.sockets.emit('details', data);
};
app.get('/', function (req, res) {
	res.render('index');
});

app.post('/', function(req, res){
	console.log('POST');
	model.getDetails(function(data){
		res.send(data);
	});
});

