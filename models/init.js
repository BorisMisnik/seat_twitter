var MongoClient = require('mongodb').MongoClient
  , util = require('util')
  , format = util.format
  , details = require('../details.json')
  , twitter = require('twitter')
  , async = require('async')
	require('date-utils'); 

var twit = new twitter({
	consumer_key: 'BWx1ScD4tPkCpbQVwktcQ',
	consumer_secret: 'KsRK97iq4DLndeBd3mNkYbwFoDo2uBnqbffxi7UMJo',
	access_token_key: '536480495-OeGqKHheElDaYgB6QFwun8H0EmsZvjyzMTwqwHQA',
	access_token_secret: 'URIt1V2lq6l7HQW13qPP2OnOEusJ6V9Whh89i2g5Kg0' 
});

var model = {

	visual : 0,
	noVisual : 0,
	lastTweetId : 'null',
	tweetsCount : 0,
	dateTomorrow : Date.tomorrow(),
	today : Date.today().toFormat('YYYY-MM-DD'),

	// if tweetsCount % 20 call this method
	shareDetail : function(tweet){	
		// console.log( tweet );
		var info = this.formatTweet(tweet);

		if( this.visual === 0 && this.noVisual === 3){
			this.visual++;
			this.updateDetailInDb('visual', info);  
		}
		else if( this.visual === 1 && this.noVisual === 6 ){
			this.visual++;
			this.updateDetailInDb('visual', info);  
		}
		else if( this.noVisual < 7 ){
			this.noVisual++;
			this.updateDetailInDb('noVisual', info);
		}

	},

	formatTweet : function(tweet){
		var d = new Date().toFormat('YYYY-MM-DD-HH24-MI');
		return {
			time : d,
			userId : tweet.id_str,
			text : tweet.text,
			name : tweet.user.name,
			screen_name : tweet.user.screen_name,
			avatart : tweet.user.profile_image_url_https
		}
	},

	updateDetailInDb : function(category, tweet){
		var _this = this;
		this.collection.update({
			share : false,
			type : category 
		}, {$set : {
			share : true,
			user : tweet,
			date : _this.today
		}}, {}, function(err, object){
			if( err ) console.warn(err.message);
			else if( object )
				// sending detail to the client
				_this.sendDetails(category);
		});
	},

	sendDetails : function(category){
		// search open details 
		var result = searchDetailsInDb(category);

		// sendting details to client
		console.log( result );
	},

	searchDetailsInDb : function(category, callback){
		var resultFind;
		var _this = this;
		if( !callback ){
			this.collection.find({share : true, type : category}).toArray(function(err, result){
				if( err ) throw err;
				else if( result.length ) return resultFind = result;

			});
		}
		else{
			this.collection.find({date:_this.today, type:category, share:true}).toArray(function(err, result){
				if( err ) throw err;
				callback(null, result.length);
			});
		}
	},
	// method call when sent a tweet 
	tweet : function(tweet){
		// get info about tweet
		var info = this.formatTweet(tweet);
		// updateModel
		this.updateModel(tweet);
		// send tweet to client 
		console.log( info );
		// share detail
		if( this.tweetsCount % 2 === 0 && ( this.visual != 2 || this.noVisual != 6 ) ){
			this.shareDetail( tweet );
		}
	},

	updateModel : function(data){
		if( !data.id ) return;

		var id = data.id_str;
		this.tweetsCount++;
		// update lastTweetId
		this.update({'lastTweet' : model.lastTweetId}, {$set: {'lastTweet' : id}}, {}, function(err, object) {
			if( err ) console.warn(err.message);
			else model.lastTweetId = id;
		});

		if( this.dateTomorrow === Date.today() ){
			// reset amount details
			this.visual = 0;
			this.noVisual = 0;
			// update date
			this.dateTomorrow = Date.tomorrow();
		}
	},
	// Search shared detail in the current day
	searchDetails : function(){
		var _this = this;
		async.parallel([
			// search visual details shared today
			function(callback){ 
				model.searchDetailsInDb('visual', callback);
			},
			// search noVisual details shared today
			function(callback){
			   model.searchDetailsInDb('noVisual', callback);
			},
			// get id of the last tweet
			function(callback){
				model.collection.find({'lastTweet' : /\w+/}).toArray(function(err, result){
					callback(null, result[0].lastTweet);
				});
			}
		],
		// callback
		function(err, results){
			_this.visual = results[0]; // shared visual details today
			_this.noVisual = results[1]; // shared no-visual details today
			_this.lastTweetId = results[2]; // id last tweet
		});
	},

	searchTweets : function(option){
		var _this = this;
		twit.search('#wottak',option,function(data){
			if( data.statuses ){
				console.log( data.statuses.length );
				for (var i = 0; i < data.statuses.length; i++) {
					console.log( i );
					console.log( 'ok' ); 
					// share details if she % 20
					if( i != 0 && i % 20 === 0 && ( _this.visual != 2 || _this.noVisual != 6 ) )
						_this.shareDetail( item );
					// render last 10 tweets
					if( option.count === 10 ){
						console.log( 'ok' );
						_this.tweet( item );
					}
				};
			}
		});
	}
};

// Connect to db
exports.connect = function(callback){
	var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? 
			   process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';

	var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? 
			   process.env['MONGO_NODE_DRIVER_PORT'] : 27017;

	MongoClient.connect(format("mongodb://%s:%s/test", host, port), function(err, db) {
		console.log( 'DB connect to ' + format("mongodb://%s:%s/test", host, port ) );

		model.collection = db.collection('seat_twitter');
		// Count the number of records
		model.collection.count(function(err, count) {
			// if db empty insert records
			if( count !== 0 ){
				// start server
				callback();
				// search shared details
				model.searchDetails();
				return;
			} 
			// Insert records
			model.collection.insert(details, function(docs) {
				console.log( 'Details insert to db' );
				// start server
				callback(); 
				model.searchDetails();
			});
		});
	});
};

// start stream tweets
exports.startStriming = function(){
	twit.stream('user', {track:'#wottak'}, function(stream) {
		stream.on('data', model.tweet);
	});
	console.log( 'stream started' );
};

// search last posted tweet
exports.getLastTweet = function(type){
	// if user connect
	if ( type )
		model.searchTweets({count : 10});
	// if server restart 
	else if( model.lastTweetId !== 'null' )
		model.searchTweets({since_id : model.lastTweetId, count : 100});
}

