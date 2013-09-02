var express = require('express')
  , io = require('socket.io')
  , app = express()
  , http = require('http')
  , model = require('./models/')
  , passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , server = http.createServer(app);

// routers
var index = require('./controllers/index')
  , admin = require('./controllers/admin');

// Passport session setup.  
passport.serializeUser(function(user, done) {
 	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

passport.use(new TwitterStrategy({
	consumerKey : 'wDonkYzJEDcZbhXDDrG5rg',
	consumerSecret : 'TfWeZPHJBMv2AEKbO0hBHRQyzFEiYZu3qGtnd6rDiKA',
	callbackURL: "http://ec2-23-22-150-11.compute-1.amazonaws.com/auth/twitter/callback"
}, function(token, tokenSecret, profile, done){
		return done(null, profile);
	}
));

// configure Express
app.set('port', process.env.PORT || 8080);
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret : 'password'}));
// Initialize Passport!
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static( __dirname + '/public' ));

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
	// send to all connection share detail
	sockets.sockets.emit('details', data);
};

app.get('/', index.index);
app.get('/admin', admin.index);
app.get('/admin/login', admin.login);
app.get('/admin/edit', admin.getAll);
app.delete('/admin/edit', admin.remove);

//   Use passport.authenticate() as route middleware to authenticate the request.
app.get('/auth/twitter', 
	passport.authenticate('twitter'),
	function(req, res){
		// The request will be redirected to Twitter for authentication, so this
    	// function will not be called.
	});
app.get('/auth/twitter/callback',
	passport.authenticate('twitter', { failureRedirect: '/#login' }),
	function(req, res){  // Successful authentication, redirect home.
		res.redirect('/');
	});

