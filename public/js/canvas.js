var app = {
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
				app.init();
			})
		};

		function handleOverallProgress(){
			div.text(Math.floor(preload.progress * 100) + '%');
		};
	},
	init : function(){
		var c = document.getElementById('app');
		var _this = this;
		this.stage = new createjs.Stage(c);
		// enable touch interactions if supported on the current device:
		createjs.Touch.enable(this.stage);
		// enabled mouse over / out events
		this.stage.enableMouseOver(10);
		this.stage.mouseMoveOutside = true; // keep tracking the mouse even when it leaves the app

		this.nav = $('.car li');
		this.blockTweet = $('.car .tweet');
		this.blockTweet.css('opacity','0');
		this.car = $('.car');
		this.imgNews = $('#img-news');
		this.news = $('#newsCarousel');
		// set stage background image
		this.car.css('background-image', 'url(img/stagefront.jpg)');
		this.newsTweet = $('#priz-tweet');
		this.news = $('#newsCarousel');
		//  add to stage tick event
		createjs.Ticker.addEventListener("tick", app.tick.bind(app));
		// connection socket IO
		var socket = io.connect(window.location.origin); 
		socket.once('connect', function(){
			// get all share detail
			socket.on('details', function (data) {
				// clear news
				_this.news.find('*').remove();
				_this.details = data;
				// sorting detail
				_this.sortDetail();
				console.log( data );
			});
		})
		// enable news scroll
		this.news.mCustomScrollbar({
			horizontalScroll:true
		});

		// init authorized
		app.popup();
	},
	// sorting items on the visual and no-visual
	sortDetail : function(){
		var _this = this;
		this.visualDetails = []; //clear array
		this.noVisualDetails = [];
		this.details.forEach(function(item, index){
			if( item.type === 'visual')
				_this.visualDetails.push(item);
			else
				_this.noVisualDetails.push(item);
			// render news
			_this.renderNews(item, index);
		});
		this.visual();
		this.noVisual();
		// enable news scroll
		_this.news.mCustomScrollbar("destroy");
		_this.news.mCustomScrollbar({
			horizontalScroll:true
		});
		setTimeout(function(){
			var w = $('.mCSB_container').width();
			$('.mCSB_container').width( w + 5 );
		}, 0);
		
	},
	// processing of all visual detail
	visual : function(){
		var _this = this;
		// clear stage
		this.stage.removeAllChildren();
		// change stage background image
		this.car.animate({'opacity':1}, showDetails) // show stage

		function showDetails(){
			_this.visualDetails.forEach(function(item, index){
				// add visual detail on app
				_this.renderVisual(item);
			});
		};
		
	},
	noVisual : function(){
		var _this = this;
		this.noVisualDetails.forEach(function(item, index){
			_this.renderNoVisual(item);
		});
	},
	// add visual detail on app
	renderVisual : function(data){
		// crate new image
		var image = new Image();
		var name = data.name;
		var _this = this;
		// Exclusion of non-existent images
		if( this.position === 'front' && ( name === 'v18' || name === 'v17' || name === 'v19' || name === 'v20')) return;
		if( this.position === 'back' && ( name === 'v2' || name === 'v11' || name === 'v13' || name === 'v16' || name === 'v20')) return;
		if( this.position === 'top' && ( name === 'v17' || name === '20') ) return;

		image.src = 'img/'+name+'-'+this.position+'.png';
		image.onload = function(event){
			_this.handleDetailLoad(event, data);
		};
	},
	renderNoVisual : function(data){
		var _this = this;
		$('.'+data.name).addClass('active')
			.on({
				mouseenter : function(e){
					// update content
					var $box = $('.tweet-box');
					var $this = $(this);
					var text = _this.formatText(data.user.text);
					console.log( $box.find('.nick_name') );
					$box.find('.img').css('background-image', 'url(' + data.user.avatar + ')');
					$box.find('.name').text(data.user.name);
					$box.find('.nick_name').text('@' + data.user.screen_name);
					$box.find('p').html(text);
					// set position block
					var w = $box.outerWidth(true) 
					  , h = $box.outerHeight(true) 
					  , x = $this.position().left
					  , y = $this.position().top
					  , left;
					 // block out of page
					if( (x - 56) + w > 850){
						left = 	(x + 77) - w;
						$box.addClass('right').removeClass('left');
					}
					else{
						left = x-32;
						$box.addClass('left').removeClass('right');
					} 
					var top = y - h - 8;
					$box.css({left:left,top:top}).fadeIn();
				},
				mouseleave : function(e){
					var $box = $('.tweet-box');
					$box.hide();
				}
			})
		
	},
	// image upload
	handleDetailLoad : function(event, item){
		var image = event.target;
		var bitmap;
		var container = new createjs.Container();
		var _this = this;
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
				_this.showBlockTweet(tweet, event.stageX, event.stageY);
			}
			bitmap.onMouseOut = function() {
				// hide block with tweet
				_this.hideBlockTweet();
			}	
		})(bitmap, item);
		// update stage
		createjs.Ticker.addEventListener("tick", _this.tick.bind(_this));
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
		var result = VerEx().find( '#wottak' ).replace(text, '<span>#wottak</span> ');
		return result;
	},
	// displaying news
	renderNews : function(data, index){
		var _this = this;
		var textNews, text, template, html;
		
		// visual template
		if( data.type === 'visual')
			visual();
		else
			noVisual();

		function visual(){  // add news about visual detail
			var choosenTemplate = Math.random() < 0.5 ? true : false;
			textNews = '';
			if( choosenTemplate ){
				textNews ='Пользователь <span>@' + data.user.screen_name+ '</span> получает деталь ' 
				+ data.text + ' и награждается мини-призом! Поздравляем! Участвуйте в конкурсе '
				+ 'и у Вас есть возможность получить главный приз!';
			}
			else{
				textNews ='Пользователь <span>@' + data.user.screen_name+ '</span> получает деталь ' 
				+ data.text + ' и награждается мини-призом! Поздравляем! До сборки Нового Леона осталось ' 
				+ 'деталей <b>'+(20-_this.visualDetails.length)+'</b>. Спешите поучаствовать!';
			}
			text = _this.formatText(data.user.text);
			template =  " <div class='item'>"
				+ "<p id='text-news'>"+textNews+"</p>"
				+ "<div id='img-news'>"
				+ 	"<img src='img/"+data.name+".png'/>"
				+ "</div>"
				+ "<div id='priz-tweet'>"
				+	"<div class='imgT' style='background-image:url("+data.user.avatar+")'></div>"
				+	"<div class='text'>"
				+		"<div class='names'>"
				+			"<span class='name'>"+data.user.name+"</span>"
				+			"<span class='nick_name'>@"+data.user.screen_name+"</span>"
				+		"</div>"
				+		"<p>"+text+"</p>"
				+	"</div>"
				+	"</div>"
				+"</div>";
			html =  $.parseHTML(template);
		};

		function noVisual(){ // add news about no-visual detail
			textNews = '';
			textNews ='Пользователь <span>@' + data.user.screen_name+ '</span> получает деталь '
				+ data.text + '! Поздравляем! Осталось деталей <b>'+(30 - _this.noVisualDetails.length)+'</b>.';
			text = _this.formatText(data.user.text);
			template =  " <div class='item n'>"
				+ "<p id='text-news'>"+textNews+"</p>"
				+ "<div id='priz-tweet'>"
				+	"<div class='imgT' style='background-image:url("+data.user.avatar+")'></div>"
				+	"<div class='text'>"
				+		"<div class='names'>"
				+			"<span class='name'>"+data.user.name+"</span>"
				+			"<span class='nick_name'>@"+data.user.screen_name+"</span>"
				+		"</div>"
				+		"<p>"+text+"</p>"
				+	"</div>"
				+	"</div>"
				+"</div>";
			html =  $.parseHTML(template);
		}
		this.news.append(html) // append new template in carousel
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
	app.load();
});
