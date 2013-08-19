var express = require('express')
  , io = require('socket.io')
  , app = express()
  , http = require('http')
  , model = require('./models/')
  , server = http.createServer(app)

//  configuration node
app.configure(function(){
	app.use(express.static( __dirname + '/public' ));
	app.use(app.router);
	app.set('port', process.env.PORT || 5000);
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');
});

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
	sockets.sockets.emit('details', data);
	
};
app.get('/', function (req, res) {
	res.render('index');
});

app.post('/', function(req, res){
	model.getDetails(function(data){
		res.send(data);
	});
});

