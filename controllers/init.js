var model = require('../models/init');
var socketIO;
exports.connect = function(io){
	io.sockets.on('connection', function (socket) {
    	model.detail('all');
 		socketIO = socket;
	});
};
// Send a tweet to the client 
exports.sendTweet = function(tweet){
	console.log( 13 );
	if( socketIO )
		socketIO.emit('tweet', tweet);
};

// Send details
exports.sendDetails = function(type, details){
	if( socketIO ){
		if( type === 'all' )
			socketIO.emit('all', details);
		else if( type === 'visual' )
			socketIO.emit('visual', details);
		else
			socketIO.emit('noVisual', details);
	}
}