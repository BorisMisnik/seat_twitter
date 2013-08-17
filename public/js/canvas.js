var canvas = {
	update:true,
	position : 'front',
	preload : null,
	details : [],
	load : function(){

		if (this.preload != null) { this.preload.close(); }
		 // Reset UI
		$('.preloader').show();
		$('.car').hide();

		preload.addEventListener("fileload", handleFileLoad);
        preload.addEventListener("progress", handleOverallProgress);
        preload.addEventListener("error", handleFileError);

        function handleFileLoad(){
        	console.log( 'handleFileLoad' );
        }

        function handleOverallProgress(){
        	console.log( 'handleOverallProgress' );
        }

        function handleFileError(){
        	console.log( 'handleFileError' );
        }

	},

	init : function(){

		var c = document.getElementById('canvas');
		this.stage = new createjs.Stage(c);

		// enable touch interactions if supported on the current device:
		createjs.Touch.enable(this.stage);
		// enabled mouse over / out events
		this.stage.enableMouseOver(10);
		this.stage.mouseMoveOutside = true; // keep tracking the mouse even when it leaves the canvas

		// show front image
		var image = new Image();
		image.src = "img/stageFront.jpg";
		image.onload = canvas.handleImageLoad.bind(canvas); 

		this.nav = $('.car li');
		
	},
	handleImageLoad : function(event){
		this.update = true;
		var image = event.target;
		var bitmap;
		var container = new createjs.Container();
		this.stage.addChild(container);

		bitmap = new createjs.Bitmap(image);
		bitmap.x = 0;
		bitmap.y = 0;

		container.addChild(bitmap);
		createjs.Ticker.addEventListener("tick", canvas.tick.bind(canvas));

		canvas.renderImage();

	},
	renderImage : function(data){
		var images = this.details;
		images.forEach(function(item, index){
			var image = new Image();
			var name = item[index].name;
			if( canvas.position === 'front' && ( name === 'v18' || name === 'v17' || name === 'v19' || name === 'v20')) return;
			if( canvas.position === 'back' && ( name === 'v2' || name === 'v11' || name === 'v13' || name === 'v16' || name === 'v20')) return;
			if( canvas.position === 'top' && ( name === 'v17' || name === '20') ) return;
			image.src = 'img/'+name+'-'+canvas.position+'.png';
			image.onload = function(event){
				canvas.handleDetailLoad(event, item);
			}
		})
		
	},
	handleDetailLoad : function(event, item){
		var image = event.target;
		var bitmap;
		var container = new createjs.Container();

		this.stage.addChild(container);
		this.update = true;
		bitmap = new createjs.Bitmap(image);
		bitmap.name = name;
		bitmap.x = 0;
		bitmap.y = 0;

		container.addChild(bitmap);

		(function(target) {
			bitmap.onMouseOver = function() {
				console.log( target.name );
			}
			bitmap.onMouseOut = function() {
				console.log( target.name );
			}	
		})(bitmap);

		createjs.Ticker.addEventListener("tick", canvas.tick.bind(canvas));
	},
	tick: function(event){
		if (this.update) {
			this.update = false; // only update once
			this.stage.update(event);
		}
	},
	next : function(){
		if( this.position === 'front' )
			this.position = 'back';
		else if( this.position === 'back' )
			this.position = 'top';
		else if( this.position === 'top' )
			this.position = 'front';

		this.renderStage();
	},
	prev : function(){
		if( this.position === 'back' )
			this.position = 'front';
		else if( this.position === 'front' )
			this.position = 'top';
		else if( this.position === 'top' )
			this.position = 'back';

		this.renderStage();
	},
	renderStage : function(type){
		var image = new Image();
		if( type )
			this.position = type; 

		this.stage.clear();
		image.src = "img/stage"+this.position+".jpg";
		image.onload = canvas.handleImageLoad.bind(canvas); 

		this.nav.removeClass();
		
		if( this.position === 'front' )
			this.nav.eq(0).addClass('active');
		else if( this.position === 'back' )
			this.nav.eq(1).addClass('active');
		else if( this.position === 'top' )
			this.nav.eq(2).addClass('active');
	}
}

$(document).ready(function(){
	canvas.init();
	$.post('/', function(data){
		canvas.details.push(data);
		canvas.renderImage();
	})
	.done(function(){console.log( 'items loaded');})
	.fail(function(){console.log( 'items loaded error' );})


});
var socket = io.connect(window.location.origin); 
socket.on('details', function (data) {
	console.log(data); 
});