var express = require('express')
  , io = require('socket.io')
  , app = express()
  , http = require('http')
  , model = require('./models/')
  , server = http.createServer(app)

// routers
var index = require('./controllers/index')
  , admin = require('./controllers/admin');

app.use(express.static( __dirname + '/public' ));
app.use(express.cookieParser('password'));
app.use(express.session());
app.use(app.router);
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

// connect socket io
var sockets = io.listen(server);
sockets.set('log level', 1);
// enable all transports
sockets.set('transports', ['xhr-polling','websocket']);
sockets.on('connection', function(socket){
	// if user connect send share detail
	model.getDetails(function(data){
		socket.emit('details', data);
	});
});
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

app.get('/', index.index);
app.get('/admin', admin.index);
app.get('/admin/login', admin.login);
app.get('/admin/getAll', admin.getAll);