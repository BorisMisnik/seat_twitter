var app = require('express')()
  , express = require('express')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , model = require('./models/init')

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
	server.listen(port);
	console.log( 'Server listen on port ' + port );
});

app.get('/', function (req, res) {
	res.render('index');
});

// connect socket io
io.set('log level', 1); // reduce logging
io.sockets.on('connection', function (socket) {
	socket.on('getDetails', function(){
		model.getDetail(socket);
		// console.log( 'user connect and load DOM');
	});
});