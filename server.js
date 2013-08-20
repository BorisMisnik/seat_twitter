var express = require('express')
  , io = require('socket.io')
  , http = require('http')
  , app = express()
  , model = require('./models/')
    , twitter = require('twitter') 
  , server = http.createServer(app);

//  configuration node
app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static( __dirname + '/public' ));
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');
	app.set('port', process.env.PORT || 3000);
});

//Start a Socket.IO listen
// var sockets = io.listen(server);
// sockets.set('log level', 1);
var twit = new twitter({
	consumer_key: 'wDonkYzJEDcZbhXDDrG5rg',
	consumer_secret: 'TfWeZPHJBMv2AEKbO0hBHRQyzFEiYZu3qGtnd6rDiKA',
	access_token_key: '536480495-GedJJj8HJNSLiMcnS2qJ5xwHcWGgAcioVLm6iLQx',
	access_token_secret: 'DDvYXvTSOhTSxibbQLjPOS7S79KoSe5nhxtPIEBOE' 
});
twit.stream('statuses/filter', { track: '#wottak' }, function(stream) {
 
  //We have a connection. Now watch the 'data' event for incomming tweets.
  stream.on('data', function(tweet) {
  	console.log(tweet)
 });
  stream.on('error', function(error, code){
  	console.log(error)
  	console.log(code)
  })
});
// connect to mongodb and start server
model.connect(function(){
	server.listen(app.get('port'), function(){
		console.log('Express server listening on port ' + app.get('port'));
	});
});

exports.sendDetails = function(data){
	// sockets.sockets.emit('details', data);
	setInterval(function(){
		sockets.sockets.emit('details', {hellow : 'world'});
	}, 2000)
};
// exports.sendDetails();
app.get('/', function (req, res) {
	res.render('index');
});

app.post('/', function(req, res){
	model.getDetails(function(data){
		res.send(data);
	});
});

