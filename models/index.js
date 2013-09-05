var MongoClient = require('mongodb').MongoClient
  , util = require('util')
  , format = util.format
  , details = require('../details.json')
  , twitter = require('twitter') 
  , server = require('../server')
  , http = require('http-get')
  , cronJob = require('cron').CronJob
  , _ = require('underscore');
	require('date-utils');  

var twit = new twitter({
	consumer_key: 'wDonkYzJEDcZbhXDDrG5rg',
	consumer_secret: 'TfWeZPHJBMv2AEKbO0hBHRQyzFEiYZu3qGtnd6rDiKA',
	access_token_key: '536480495-GedJJj8HJNSLiMcnS2qJ5xwHcWGgAcioVLm6iLQx',
	access_token_secret: 'DDvYXvTSOhTSxibbQLjPOS7S79KoSe5nhxtPIEBOE' 
});

var model = {
	visual : 0,
	noVisual : 0,
	tweetsCount : 0,
	today : Date.today().toFormat('YYYY-MM-DD'),
	// search shared detail today
	search : function(startServer){
		var _this = this;
		// find shared detail today
		this.collection.find({share:true}).toArray(function(err, result){
			if( err ) throw err;
			result.forEach(function(item, index){
				//  get share details today
				if( item.date === _this.today )
					item.type === 'visual' ? _this.visual++ : _this.noVisual++;
				// get id last record and get 100 tweets
				if( result.length - 1 === index && item.id !== '' ) 
					_this.searchTweets({since_id : item.id, count : 100}); 	
			});
			// run server
			startServer();
		});
	},
	// search latest tweets
	searchTweets : function(option){
		var _this = this;
		// search tweets by hashtag and options
		twit.search('#wottak',option,function(data){
			// search % 20  
			if( !data.statuses ) return;
			data.statuses.forEach(function(item, index){
				if( !item.user ) return;

				_this.tweetsCount++;
				if( _this.tweetsCount % 2 === 0 && ( _this.visual < 3 || _this.noVisual < 4))
					_this.shareDetail(item); 
			});
		});
	},
	// share detail
	shareDetail : function(item){
		var tweet = this.adaptationTweet(item);
		if( this.visual === 0 && this.visual !== 2 && this.noVisual === 0 ){
			this.visual++;
			// update visual detail in db;
			this.updateDetailInDb('visual', tweet);
		}
		else if( this.visual !== 2 && this.noVisual === 3 ){
			this.visual++;
			// update visual detail in db;
			this.updateDetailInDb('visual', tweet);
		}
		else if( this.noVisual !== 3 ){
			this.noVisual++;
			// update no-visual detail in db;
			this.updateDetailInDb('noVisual', tweet);
		}
	},
	adaptationTweet : function(tweet){
		var d = new Date().toFormat('YYYY-MM-DD-HH24-MI');
		// save user avatar
		this.saveImage(tweet.user.profile_image_url, tweet.user.screen_name);
		return {
			time : d,
			user_id : tweet.user.id_str,
			tweet_id : tweet.id_str,
			text : tweet.text,
			name : tweet.user.name,
			screen_name : tweet.user.screen_name,
			avatar : 'uploads/'+tweet.user.screen_name+'.png'
		}
	},
	saveImage : function(path, name){
		var options = {url : path};
		http.get(options, './public/uploads/'+name+'.png', function (error, result) {
			if (error)
				console.log(error);
		});
	},
	updateDetailInDb : function(category, tweet){
		var _this = this;
		var query = {share:false, type:category};
		var set = {id:tweet.tweet_id, date:this.today, user:tweet, share:true}
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
				else
					callback(result);
			}
				
		});
	},
	tweet : function(item){
		var _this = this;
		if( !item.user || !item.text.indexOf('#wottak') < 0 ) return;
		this.tweetsCount++;
		if( this.tweetsCount % 2 === 0 ){
			// search this user in seat group
			_this.findUser(item.user.id_str, function(){
				_this.shareDetail(item); // share detail
			});
		}	
	},
	findUser : function(user_id, callback, notFound){
		twit.get('/followers/ids.json',{screen_name:'SeatRussia', stringify_ids: true}, function(data){
			if( !data.ids ) return;
			_.find(data.ids, function(id){ // find user id in result
				if( id === user_id ){
					callback(true) // run callback
					return true;
				}
			});
			if( notFound )
				notFound(); // run if item not found callback
		});
	}
};
//Reset everything on a new day!
new cronJob('0 0 0 * * *', function(){
	// if not all detail share
	if(  model.visual !== 2 || model.noVisual !== 3 ){
		var amount = ( 2 - model.visual ) + ( 3 - model.noVisual );
		// get id last record
		model.collection.find({share : true}).toArray(function(err, result){
			if( err ) console.log( err )
			else if( result.length ){
				var tweet_id = result[result.length-1].id; // id last record;
				// search tweets and share details
				twit.search('#wottak',{max_id:tweet_id,count:amount},function(data){
					if( !data.statuses ) return;
					// share detail
					data.statuses.forEach(function(item, index){
						model.shareDetail(item);
						if( index === data.statuses.length - 1){
							// reset
							model.visual = 0;
							model.noVisual = 0;
						}
					});
				});
			}
		});
	}
	else{
		//Reset 
		model.visual = 0;
		model.noVisual = 0;
	}
}, null, true);
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
		exports.startStriming();
	});
};

// start stream tweets
exports.startStriming = function(){
	// stream russin region
	// twit.stream('statuses/filter', {'locations':'33.83,55.12,132.62,55.62,33.15,67.62,152.90,69.62'}, function(stream) {
	twit.stream('statuses/filter', {'track':'#wottak'}, function(stream) {
		console.log( 'Stream started' );
		stream.on('data', model.tweet.bind(model));
		stream.on('error', function(err){
			console.log( err );
		});
	});
};

exports.getDetails = function(callback){
	// get all share details and send to client
	model.sendDetails(callback);
};

// remove user
var ObjectID = require('mongodb').ObjectID;
exports.removeUser = function(db_id, tweet_id, callback){
	// find prev tweet
	twit.search('#wottak', {max_id:tweet_id,count:2}, function(data){
		if( !data.statuses ) return;
		if( data.statuses.length !== 2 ) return;
		// update collection
		var tweet = model.adaptationTweet(data.statuses[1]) // get info
		var query = {_id : new ObjectID(db_id)}; // find details by id
		var set = {id:tweet.tweet_id, date:model.today, user:tweet, admin:true};
		model.collection.update(query, {$set : set},function(err, object){ // update detail
			if( err ) throw new Error(err);
			else if( object ){ // if update detail success
				exports.getDetails(); // send detail to client
				callback(); // run callback 
			}
		});
	});
}
// check user in seat group
exports.checkUser = function(id, callback){
	model.findUser(id, callback) // find user in seat group;
}
