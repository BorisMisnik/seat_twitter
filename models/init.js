var MongoClient = require('mongodb').MongoClient
  , util = require('util')
  , format = util.format
  , details = require('../details.json')
  , twitter = require('twitter')
  , server = require('../server')
  , events = require('events')
  , emiter = new events.EventEmitter();
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
	tweetsCount : 0,
	dateTomorrow : Date.tomorrow().toFormat('YYYY-MM-DD'),
	today : Date.today().toFormat('YYYY-MM-DD'),

	// search shared detail today
	search : function(startServer){
		var _this = this;
		// find shared detail today
		this.collection.find().toArray(function(err, result){
			if( err ) throw err;
			result.forEach(function(item, index){
				//  get share details today
				if( item.share && item.date === _this.today )
					item.type === 'visual' ? _this.visual++ : _this.noVisual++;
				// get id last record and get 100 tweets
				if( result.length - 1 === index )
					_this.searchTweets({since_id : item.id, count : 100}); 	

			});
			// run server
			startServer();
		});
	},
	// search latest tweets
	searchTweets : function(option){
		var _this = this;
		// search tweets by hashtag and parametrs
		twit.search('#wottak',option,function(data){
			// amount tweets 
			_this.tweetsCount = data.statuses.length;
			// console.log('missed tweets amount', _this.tweetsCount );
			// search for every 20 tweets 
			data.statuses.forEach(function(item, index){
				if( index !== 0 && index % 20 === 0 && ( _this.visual < 3 || _this.noVisual < 7))
					_this.shareDetail(item);
			})
		});
	},
	// share detail
	shareDetail : function(item){
		var tweet = this.adaptationTweet(item);
		this.updateModel();
		if( this.visual < 3 && this.noVisual === 3 ){
			this.visual++;
			// update visual detail in db;
			this.updateDetailInDb('visual', tweet);
		}
		else if( this.visual < 3 && this.noVisual === 6 ){
			this.visual++;
			// update visual detail in db;
			this.updateDetailInDb('visual', tweet);
		}
		else if( this.noVisual < 7 ){
			this.noVisual++;
			// update no-visual detail in db;
			this.updateDetailInDb('noVisual', tweet);
		}

	},
	adaptationTweet : function(tweet){
		var d = new Date().toFormat('YYYY-MM-DD-HH24-MI');
		return {
			time : d,
			id : tweet.id_str,
			text : tweet.text,
			name : tweet.user.name,
			screen_name : tweet.user.screen_name,
			avatar : tweet.user.profile_image_url_https
		}
	},
	updateModel : function(data){
		if( this.dateTomorrow === Date.today() ){
			// reset amount details
			this.visual = 0;
			this.noVisual = 0;
			// update date
			this.dateTomorrow = Date.tomorrow();
		}
	},
	updateDetailInDb : function(category, tweet, scoket){
		var _this = this;
		var query = {share:false, type:category};
		var set = {id:tweet.id, date:_this.today, user:tweet, share:true}
		this.collection.update(query, {$set : set},function(err, object){
			if( err ) console.warn(err.message);
			else if( object ){
				console.log( object )
				// sending detail to the client
				_this.sendDetails(category);
			}
		});
	},
	tweet : function(item){
		this.tweetsCount++;
		console.log( tweetsCount );
		if( this.tweetsCount % 2 === 0 )
			this.shareDetail(item);
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
			if( count === 0 ){
				// Insert records
				model.collection.insert(details, function(docs) {
					console.log( 'Details insert to db' );
					// start server
					callback(); 
				});
			}
			// if server restrat search shared details today and missed tweets
			else{
				// search
				model.search(callback);
				
			}
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

// events
exports.getDetails = function(socket){
	model.
};
