var canvas = {
	update:true,
	position : 'front',
	details : [],
	visualDetails : [],
	noVisualDetails : [],
	load : function(){
		// Create a preloader. There is no manifest added to it up-front, we will add items on-demand.
		var preload = new createjs.LoadQueue(true, "img/");
		var manifest = ['stagefront.jpg', 'stageback.jpg', 'stagetop.jpg'];
		var div = $('.preload');

		for (var i = manifest.length - 1; i >= 0; i--) {
			preload.loadFile(manifest[i]);
		};
		preload.addEventListener('fileload', handleFileLoad);
        preload.addEventListener('progress', handleOverallProgress);

        function handleFileLoad(event){
        	div.fadeOut(function(){
        		$('.car').fadeIn();
        		canvas.init();
        	})
        };

        function handleOverallProgress(){
        	div.text(Math.floor(preload.progress * 100) + '%');
        };
	},
	init : function(){
		var c = document.getElementById('canvas');
		this.stage = new createjs.Stage(c);
		// enable touch interactions if supported on the current device:
		createjs.Touch.enable(this.stage);
		// enabled mouse over / out events
		this.stage.enableMouseOver(10);
		this.stage.mouseMoveOutside = true; // keep tracking the mouse even when it leaves the canvas

		this.nav = $('.car li');
		this.blockTweet = $('.car .tweet');
		this.blockTweet.css('opacity','0');
		this.car = $('.car');
		this.imgNews = $('#img-news');
		// set stage background image
		this.car.css('background-image', 'url(img/stagefront.jpg)');
		this.newsTweet = $('#priz-tweet');
		//  add to stage tick event
		createjs.Ticker.addEventListener("tick", canvas.tick.bind(canvas));

		// get all shared detail
		$.post('/', function(data){
			canvas.details = data;
			// sorting detail
			canvas.sortDetail();
		})
		.done(function(){console.log( 'items loaded');})
		.fail(function(){console.log( 'items loaded error' );})
	},
	// sorting items on the visual and no-visual
	sortDetail : function(){
		var _this = this;
		this.details.forEach(function(item, index){
			if( item.type === 'visual')
				_this.visualDetails.push(item);
			else
				_this.noVisualDetails.push(item);
		});
		this.visual();
		this.noVisual();
	},
	// processing of all visual detail
	visual : function(){
		var _this = this;
		// clear stage
		this.stage.removeAllChildren();
		this.visualDetails.forEach(function(item, index){
			// add visual detail on canvas
			_this.renderVisual(item);
			// displaying news on the last item
			if( _this.visualDetails.length - 1 === index )
				_this.renderNews(item);
		});
	},
	noVisual : function(){
		this.noVisualDetails.forEach(function(item, index){
		});
	},
	// add visual detail on canvas
	renderVisual : function(data){
		// crate new image
		var image = new Image();
		var name = data.name;
		// Exclusion of non-existent images
		if( canvas.position === 'front' && ( name === 'v18' || name === 'v17' || name === 'v19' || name === 'v20')) return;
		if( canvas.position === 'back' && ( name === 'v2' || name === 'v11' || name === 'v13' || name === 'v16' || name === 'v20')) return;
		if( canvas.position === 'top' && ( name === 'v17' || name === '20') ) return;

		image.src = 'img/'+name+'-'+this.position+'.png';
		image.onload = function(event){
			canvas.handleDetailLoad(event, data);
		};
	},
	renderNoVisual : function(data){

	},
	// image upload
	handleDetailLoad : function(event, item){
		var image = event.target;
		var bitmap;
		var container = new createjs.Container();
		// update stage tick
		this.update = true;
		// crate new bitmap
		bitmap = new createjs.Bitmap(image);
		bitmap.x = 0;
		bitmap.y = 0;
		bitmap.cursor = 'pointer';

		// add bitmap to stage
		container.addChild(bitmap);
		this.stage.addChild(container);

		// mouseOver and mouseLeave events on bitmap
		(function(target, tweet) {
			bitmap.onMouseOver = function(event) {
				// show block with tweet
				canvas.showBlockTweet(tweet, event.stageX, event.stageY);
			}
			bitmap.onMouseOut = function() {
				// hide block with tweet
				canvas.hideBlockTweet();
			}	
		})(bitmap, item);
		// update stage
		createjs.Ticker.addEventListener("tick", canvas.tick.bind(canvas));
	},
	showBlockTweet : function(tweet, x, y){
		// update content
		var text = this.formatText(tweet.user.text);
		this.blockTweet.show().css('opacity','1')
		this.blockTweet.find('.img').css('background-image', 'url(' + tweet.user.avatar + ')');
		this.blockTweet.find('.name').text(tweet.user.name);
		this.blockTweet.find('.nick_name').text('@' + tweet.user.screen_name);
		this.blockTweet.find('p').html(text);
		// set position block
		var w = this.blockTweet.outerWidth(true);
		var h = this.blockTweet.outerHeight(true)
		var left, top;
		// block out of page
		if( (x - 56) + w > 850){
			left = 	(x + 56) - w;
			this.blockTweet.addClass('right').removeClass('left');
		}
		else{
			left = (x - 56);
			this.blockTweet.addClass('left').removeClass('right');
		}
		// block out of page 
		if( y - h < -50 )
			top = y + 50
		else
			top = y - h - 20; 

		this.blockTweet.css({'left' : left , 'top' : top})

	},
	hideBlockTweet : function(){
		this.blockTweet.css('opacity', 0).hide();
	},
	// find hashtag in tweуt
	formatText : function(text){
		var t = text;
		var result = VerEx().find( '#' ).replace(t, '<span>#wottak</span> ');
		return result;
	},
	// displaying news
	renderNews : function(data){
		var textNews = data['news-text']+' '+data.user.name + ' награждается мини-призом.';
		var text = this.formatText(data.user.text);

		$('#text-news').text(textNews);
		if( !this.imgNews.is(':visible') )
			this.imgNews.show();
		this.imgNews.attr('src', 'img/' + data.name + '.png');
		this.newsTweet.find('.img').css('background-image', 'url('+data.user.avatar+')');
		this.newsTweet.find('.name').text(data.user.name);
		this.newsTweet.find('.nick_name').text('@' + data.user.screen_name);
		this.newsTweet.find('p').html(text);

	},
	// stage tick event
	tick: function(event){
		if (this.update) {
			this.update = false; // only update once
			this.stage.update(event);
		}
	},
	// clock on button next
	next : function(){
		// change stage position
		if( this.position === 'front' )
			this.position = 'back';
		else if( this.position === 'back' )
			this.position = 'top';
		else if( this.position === 'top' )
			this.position = 'front';
		// update stage 
		this.renderStage();
	},
	// click on button prev
	prev : function(){
		// change stage position
		if( this.position === 'back' )
			this.position = 'front';
		else if( this.position === 'front' )
			this.position = 'top';
		else if( this.position === 'top' )
			this.position = 'back';
		// update stage 
		this.renderStage();
	},
	renderStage : function(type){

		if( type ) //  method was called from html
			this.position = type; 
		// clear stage
		this.stage.removeAllChildren();

		// select current nav button
		this.nav.removeClass();
		if( this.position === 'front' )
			this.nav.eq(0).addClass('active');
		else if( this.position === 'back' )
			this.nav.eq(1).addClass('active');
		else if( this.position === 'top' )
			this.nav.eq(2).addClass('active');

		// render visual detail
		this.visual();
		// change stage background image
		this.car.css('background-image', 'url(img/stage'+this.position+'.jpg)');
	}
}

$(document).ready(function(){
	// init stage
	canvas.load();
});
// connection socket IO
var socket = io.connect(window.location.origin); 
// get all share detail
socket.on('details', function (data) {
	canvas.details = data;
	// sorting detail
	canvas.sortDetail();
});
