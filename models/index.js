var MongoClient = require('mongodb').MongoClient
  , util = require('util')
  , format = util.format
  , details = require('../details.json')
  , twitter = require('twitter') 
  , server = require('../server')
	require('date-utils');  

// var twit = new twitter({
// 	consumer_key: 'wDonkYzJEDcZbhXDDrG5rg',
// 	consumer_secret: 'TfWeZPHJBMv2AEKbO0hBHRQyzFEiYZu3qGtnd6rDiKA',
// 	access_token_key: '536480495-GedJJj8HJNSLiMcnS2qJ5xwHcWGgAcioVLm6iLQx',
// 	access_token_secret: 'DDvYXvTSOhTSxibbQLjPOS7S79KoSe5nhxtPIEBOE' 
// });

var model = {
	visual : 0,
	noVisual : 0,
	tweetsCount : 1,
	dateTomorrow : Date.tomorrow().toFormat('YYYY-MM-DD'),
	today : Date.today().toFormat('YYYY-MM-DD'),

	// search shared detail today
	search : function(startServer){
		var _this = this;
		// find shared detail today
		this.collection.find({share:true}).toArray(function(err, result){
			if( err ) throw err;
			// run server
			startServer();

			result.forEach(function(item, index){
				//  get share details today
				if( item.date === _this.today )
					item.type === 'visual' ? _this.visual++ : _this.noVisual++;
				// get id last record and get 100 tweets
				if( result.length - 1 === index && item.id !== '' ) 
					_this.searchTweets({since_id : item.id, count : 100}); 	

			});
		});
	},
	// search latest tweets
	searchTweets : function(option){
		console.log(id)
		var _this = this;
		// search tweets by hashtag and options
		twit.search('#wottak',option,function(data){
			// search % 20
			data.statuses.forEach(function(item, index){
				_this.tweetsCount++;
				if( _this.tweetsCount % 2 === 0 && ( _this.visual < 3 || _this.noVisual < 7))
					_this.shareDetail(item);
			});
		});
	},
	// share detail
	shareDetail : function(item){
		var tweet = this.adaptationTweet(item);
		this.updateModel();
		this.updateDetailInDb('visual', tweet);
		// if( this.visual < 3 && this.noVisual === 3 ){
		// 	this.visual++;
		// 	// update visual detail in db;
		// 	this.updateDetailInDb('visual', tweet);
		// }
		// else if( this.visual < 3 && this.noVisual === 6 ){
		// 	this.visual++;
		// 	// update visual detail in db;
		// 	this.updateDetailInDb('visual', tweet);
		// }
		// else if( this.noVisual < 7 ){
		// 	this.noVisual++;
		// 	// update no-visual detail in db;
		// 	this.updateDetailInDb('noVisual', tweet);
		// }

	},
	adaptationTweet : function(tweet){
		var d = new Date().toFormat('YYYY-MM-DD-HH24-MI');
		return {
			time : d,
			id : tweet.id_str,
			text : tweet.text,
			name : tweet.user.name,
			screen_name : tweet.user.screen_name,
			avatar : tweet.user.profile_image_url
		}
	},
	updateModel : function(data){
		// if today is tomorrow's update counters
		if( this.dateTomorrow === this.today ){
			// reset amount details
			this.visual = 0;
			this.noVisual = 0;
			// update date tomorrow
			this.dateTomorrow = Date.tomorrow().toFormat('YYYY-MM-DD');
		}
	},
	updateDetailInDb : function(category, tweet){
		var _this = this;
		var query = {share:false, type:category};
		var set = {id:tweet.id, date:_this.today, user:tweet, share:true}
		this.collection.update(query, {$set : set},function(err, object){
			if( err ) console.warn(err.message);
			else if( object ){
				// sending detail to the client
				_this.sendDetails();
			}
		});
	},
	sendDetails : function(callback){
		this.collection.find({share:true}).toArray(function(err, result){
			if( err ) throw err;
			else{
				// send items with socket
				if( !callback )
					server.sendDetails(result);
				// sending items through the post
				else
					callback(result);
			}
				
		});
	},
	tweet : function(item){  
		var _this = this;
		this.tweetsCount++;
		console.log( _this.tweetsCount );
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
		// exports.startStriming();
	});
};

// start stream tweets
exports.startStriming = function(){
	// console.log(twit.stream('user', {track:'#wottak'}))
	twit.stream('user', {track:'#wottak'}, function(stream) {
		console.log( 'Stream started' );
		stream.on('data', model.tweet.bind(model));
		stream.on('error', function(error, code) {
			console.log("My error: " + error + ": " + code);
		});
	});
};

// events
exports.getDetails = function(callback){
	// get all share details and send to client
	model.sendDetails(callback);
};
