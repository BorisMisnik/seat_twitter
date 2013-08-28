var canvas = {
	update:true,
	position : 'front',
	details : [],
	visualDetails : [],
	noVisualDetails : [],
	load : function(){
		var preload = new createjs.LoadQueue(true, "img/");
		var manifest = ['stagefront.jpg', 'stageback.jpg', 'stagetop.jpg'];
		var div = $('.preload');

		for (var i = manifest.length - 1; i >= 0; i--) {
			preload.loadFile(manifest[i]);
		};
		preload.addEventListener('complete', handleComplete);
        preload.addEventListener('progress', handleOverallProgress);

        function handleComplete(event){
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

		// get  shared detail
		$.post('/', function(data){
			canvas.details = data;
			// sorting detail
			canvas.sortDetail();
		})
		.done(function(){console.log( 'items load');})
		.fail(function(){console.log( 'items load error' );})
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
		// displaying news
		this.renderNews();
	},
	// processing of all visual detail
	visual : function(){
		var _this = this;
		// clear stage
		this.stage.removeAllChildren();
		// change stage background image
		this.car.animate({'opacity':1}, showDetails) // sgow stage

		function showDetails(){
			_this.visualDetails.forEach(function(item, index){
				// add visual detail on canvas
				_this.renderVisual(item);
			});
		}
		
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
		var result = VerEx().find( '#wottak' ).replace(t, '<span>#wottak</span> ');
		return result;
	},
	// displaying news
	renderNews : function(){
		var _this = this;
		// clear html
		$('#newsCarousel .carousel-inner').html('');
		// crated new item
		this.visualDetails.forEach(function(item){
			renderTemplate(item);
		});
		// show first item
		$('.item').eq(0).addClass('active');
		// crate template with mustache.js
		function renderTemplate(data){
			var textNews = data['news-text']+' '+data.user.name + ' награждается мини-призом.';
			var text = _this.formatText(data.user.text);
			var template = " <div class='item'>"
				+ "<p id='text-news'>{{textnews}}</p>"
				+ "<div id='img-news'>"
				+ 	"<img src='img/{{name}}.png'/>"
				+ "</div>"
				+ "<div id='priz-tweet'>"
				+	"<div class='imgT' style='background-image:url({{user.avatar}})'></div>"
				+	"<div class='text'>"
				+		"<div class='names'>"
				+			"<span class='name'>{{user.name}}</span>"
				+			"<span class='nick_name'>@{{user.screen_name}}</span>"
				+		"</div>"
				+		"<p>{{text}}</p>"
				+	"</div>"
				+	"</div>"
				+"</div>";

			data.textnews = textNews;
			data.text = text;

			var html = Mustache.to_html(template, data);
			$('#newsCarousel .carousel-inner').append(html); // append new template in carousel
			var lastItem = $('#newsCarousel .item').last(); // add twitter hashtag to span element
			var t = lastItem.find('.text p').text();
			lastItem.find('.text p').html(t);
		}
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

		// select current nav button
		this.nav.removeClass();
		if( this.position === 'front' )
			this.nav.eq(0).addClass('active');
		else if( this.position === 'back' )
			this.nav.eq(1).addClass('active');
		else if( this.position === 'top' )
			this.nav.eq(2).addClass('active');

		this.stage.clear();

		// change stage background image
		this.car.css('background-image', 'url(img/stage'+this.position+'.jpg)')
			.css('opacity',0) // hide stage

		// render visual detail
		this.visual();
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
