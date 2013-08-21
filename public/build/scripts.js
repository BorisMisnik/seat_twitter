/*!
 * VerbalExpressions JavaScript Library v0.1
 * https://github.com/jehna/VerbalExpressions
 *
 *
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-07-19
 * 
 */

// Define the collection class.
(function(){

		var root = this;

    // I am the constructor function.
    function VerbalExpression(){
        var verbalExpression = Object.create( RegExp.prototype );
        
        // Initialize 
        verbalExpression = (RegExp.apply( verbalExpression, arguments ) || verbalExpression);
     
        // Add all the class methods
        VerbalExpression.injectClassMethods( verbalExpression );

        // Return the new object.
        return( verbalExpression );
    }
 
 
    // Define the static methods.
    VerbalExpression.injectClassMethods = function( verbalExpression ){
 
        // Loop over all the prototype methods
        for (var method in VerbalExpression.prototype){
 
            // Make sure this is a local method.
            if (VerbalExpression.prototype.hasOwnProperty( method )){
 
                // Add the method
                verbalExpression[ method ] = VerbalExpression.prototype[ method ];
 
            }
 
        }
        
        return( verbalExpression );
 
    };
 
    // Define the class methods.
    VerbalExpression.prototype = {
        
        // Variables to hold the whole
        // expression construction in order
        _prefixes : "",
        _source : "",
        _suffixes : "",
        _modifiers : "gm", // default to global multiline matching
        
        
        // Sanitation function for adding
        // anything safely to the expression
        sanitize : function( value ) {
            if(value.source) return value.source;
            return value.replace(/[^\w]/g, function(character) { return "\\" + character; });
        },
        
        // Function to add stuff to the
        // expression. Also compiles the
        // new expression so it's ready to
        // be used.
        add: function( value ) {
            this._source += value || "";
            this.compile(this._prefixes + this._source + this._suffixes, this._modifiers);
            return( this );
        },
        
        // Start and end of line functions
        startOfLine: function( enable ) {
            enable = ( enable != false );
            this._prefixes = enable ? "^" : "";
            this.add( "" );
            return( this );
        },
        
        endOfLine : function( enable ) {
            enable = ( enable != false );
            this._suffixes = enable ? "$" : "";
            this.add( "" );
            return( this );
        },
        
        // We try to keep the syntax as
        // user-friendly as possible.
        // So we can use the "normal"
        // behaviour to split the "sentences"
        // naturally.
        then : function( value ) {
            value = this.sanitize( value );
            this.add( "(?:" + value + ")" );
            return( this );
        },
        
        // And because we can't start with
        // "then" function, we create an alias
        // to be used as the first function
        // of the chain.
        find : function( value ) {
            return( this.then( value ) );
        },
        
        // Maybe is used to add values with ?
        maybe : function( value ) {
            value = this.sanitize(value);
            this.add( "(?:" + value + ")?" );
            return( this );
        },
        
        // Any character any number of times
        anything : function() {
            this.add( "(?:.*)" );
            return( this );
        },
        
        // Anything but these characters
        anythingBut : function( value ) {
            value = this.sanitize( value );
            this.add( "(?:[^" + value + "]*)" );
            return( this );
        },

        // Any character at least one time
        something : function() {
            this.add( "(?:.+)" );
            return( this );
        },

        // Any character at least one time except for these characters
        somethingBut : function( value ) {
            value = this.sanitize( value );
            this.add( "(?:[^" + value + "]+)" );
            return( this );
        },

        // Shorthand function for the
        // String.replace function to
        // give more logical flow if, for
        // example, we're doing multiple
        // replacements on one regexp.
        replace : function( source, value ) {
            source = source.toString();
            return source.replace( this, value );
        },
        
        
        /// Add regular expression special ///
        /// characters                     ///
        
        // Line break
        lineBreak : function() {
            this.add( "(?:(?:\\n)|(?:\\r\\n))" ); // Unix + windows CLRF
            return( this );
        },
        // And a shorthand for html-minded
        br : function() {
            return this.lineBreak();
        },
        
        // Tab (duh?)
        tab : function() {
            this.add( "\\t" );
            return( this );
        },
        
        // Any alphanumeric
        word : function() {
            this.add( "\\w+" );
            return( this );
        },
        
        // Any given character
        anyOf : function( value ) {
            value = this.sanitize(value);
            this.add( "["+ value +"]" );
            return( this );
        },
        
        // Shorthand
        any : function( value ) {
            return( this.anyOf( value ) );
        },
        
        // Usage: .range( from, to [, from, to ... ] )
        range : function() {
            
            var value = "[";
            
            for(var _from = 0; _from < arguments.length; _from += 2) {
                var _to = _from+1;
                if(arguments.length <= to) break;
                
                var from = this.sanitize( arguments[_from] );
                var to = this.sanitize( arguments[_to] );
                
                value += from + "-" + to;
            }
            
            value += "]";
            
            this.add( value );
            return( this );
        },
        
        
        /// Modifiers      ///
        
        // Modifier abstraction
        addModifier : function( modifier ) {
            if( this._modifiers.indexOf( modifier ) == -1 ) {
                this._modifiers += modifier;
            }
            this.add("");
            return( this );
        },
        removeModifier : function( modifier ) {
            this._modifiers = this._modifiers.replace( modifier, "" );
            this.add("");
            return( this );
        },
        
        // Case-insensitivity modifier
        withAnyCase : function( enable ) {
            
            if(enable != false) this.addModifier( "i" );
            else this.removeModifier( "i" );
            
            this.add( "" );
            return( this );
            
        },
        
        // Default behaviour is with "g" modifier,
        // so we can turn this another way around
        // than other modifiers
        stopAtFirst : function( enable ) {
            
            if(enable != false) this.removeModifier( "g" );
            else this.addModifier( "g" );
            
            this.add( "" );
            return( this );
            
        },
        
        // Multiline, also reversed
        searchOneLine : function( enable ) {
            
            if(enable != false) this.removeModifier( "m" );
            else this.addModifier( "m" );
            
            this.add( "" );
            return( this );
            
        },
        
        
        
        /// Loops  ///
        
        multiple : function( value ) {
            // Use expression or string
            value = value.source ? value.source : this.sanitize(value);
            switch(value.substr(-1)) {
                case "*":
                case "+":
                    break;
                default:
                    value += "+";
            }
            this.add( value );
            return( this );
        },
        
        // Adds alternative expressions
        or : function( value ) {
            
            this._prefixes += "(?:";
            this._suffixes = ")" + this._suffixes;
            
            this.add( ")|(?:" );
            if(value) this.then( value );
            
            return( this );
        },

        //starts a capturing group
        beginCapture : function() {
            //add the end of the capture group to the suffixes for now so compilation continues to work
            this._suffixes += ")";
            this.add( "(", false );

            return( this );
        },

        //ends a capturing group
        endCapture : function() {
						//remove the last parentheses from the _suffixes and add to the regex itself
            this._suffixes = this._suffixes.substring(0, this._suffixes.length - 1 );
            this.add( ")", true );
            
            return( this );
        }
        
    };

    function createVerbalExpression() {
        return new VerbalExpression();
    }

    // support both browser and node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = createVerbalExpression;
    }
    else if (typeof define === 'function' && define.amd) {
        define(VerbalExpression);
    }
    else {
        root.VerEx = createVerbalExpression;
    }
 
}).call();

/* ========================================================================
 * Bootstrap: carousel.js v3.0.0
 * http://twbs.github.com/bootstrap/javascript.html#carousel
 * ========================================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================================== */


+function ($) { "use strict";

  // CAROUSEL CLASS DEFINITION
  // =========================

  var Carousel = function (element, options) {
    this.$element    = $(element)
    this.$indicators = this.$element.parent().find('.carousel-indicators')
    this.options     = options
    this.paused      =
    this.sliding     =
    this.interval    =
    this.$active     =
    this.$items      = null

    this.options.pause == 'hover' && this.$element
      .on('mouseenter', $.proxy(this.pause, this))
      .on('mouseleave', $.proxy(this.cycle, this))
  }

  Carousel.DEFAULTS = {
    interval: 5000
  , pause: 'hover'
  }

  Carousel.prototype.cycle =  function (e) {
    e || (this.paused = false)

    this.interval && clearInterval(this.interval)

    this.options.interval
      && !this.paused
      && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))

    return this
  }

  Carousel.prototype.getActiveIndex = function () {
    this.$active = this.$element.find('.item.active')
    this.$items  = this.$active.parent().children()

    return this.$items.index(this.$active)
  }

  Carousel.prototype.to = function (pos) {
    var that        = this
    var activeIndex = this.getActiveIndex()

    if (pos > (this.$items.length - 1) || pos < 0) return

    if (this.sliding)       return this.$element.one('slid', function () { that.to(pos) })
    if (activeIndex == pos) return this.pause().cycle()

    return this.slide(pos > activeIndex ? 'next' : 'prev', $(this.$items[pos]))
  }

  Carousel.prototype.pause = function (e) {
    e || (this.paused = true)

    if (this.$element.find('.next, .prev').length && $.support.transition.end) {
      this.$element.trigger($.support.transition.end)
      this.cycle(true)
    }

    this.interval = clearInterval(this.interval)

    return this
  }

  Carousel.prototype.next = function () {
    if (this.sliding) return
    return this.slide('next')
  }

  Carousel.prototype.prev = function () {
    if (this.sliding) return
    return this.slide('prev')
  }

  Carousel.prototype.slide = function (type, next) {
    var $active   = this.$element.find('.item.active')
    var $next     = next || $active[type]()
    var isCycling = this.interval
    var direction = type == 'next' ? 'left' : 'right'
    var fallback  = type == 'next' ? 'first' : 'last'
    var that      = this

    this.sliding = true

    isCycling && this.pause()

    $next = $next.length ? $next : this.$element.find('.item')[fallback]()

    var e = $.Event('slide.bs.carousel', { relatedTarget: $next[0], direction: direction })

    if ($next.hasClass('active')) return

    if (this.$indicators.length) {
      this.$indicators.find('.active').removeClass('active')
      this.$element.one('slid', function () {
        var $nextIndicator = $(that.$indicators.children()[that.getActiveIndex()])
        $nextIndicator && $nextIndicator.addClass('active')
      })
    }

    if ($.support.transition && this.$element.hasClass('slide')) {
      this.$element.trigger(e)
      if (e.isDefaultPrevented()) return
      $next.addClass(type)
      $next[0].offsetWidth // force reflow
      $active.addClass(direction)
      $next.addClass(direction)
      $active
        .one($.support.transition.end, function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () { that.$element.trigger('slid') }, 0)
        })
        .emulateTransitionEnd(600)
    } else {
      this.$element.trigger(e)
      if (e.isDefaultPrevented()) return
      $active.removeClass('active')
      $next.addClass('active')
      this.sliding = false
      this.$element.trigger('slid')
    }

    isCycling && this.cycle()

    return this
  }


  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  var old = $.fn.carousel

  $.fn.carousel = function (option) {  
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.carousel')
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option)
      var action  = typeof option == 'string' ? option : options.slide

      if (!data) $this.data('bs.carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) data[action]()
      else if (options.interval) data.pause().cycle()
    })
  }

  $.fn.carousel.Constructor = Carousel


  // CAROUSEL NO CONFLICT
  // ====================

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old 
    return this
  }


  // CAROUSEL DATA-API
  // =================

  $(document).on('click.bs.carousel.data-api', '[data-slide], [data-slide-to]', function (e) {
    var $this   = $(this), href
    var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
    var options = $.extend({}, $target.data(), $this.data())
    var slideIndex = $this.attr('data-slide-to')
    if (slideIndex) options.interval = false

    $target.carousel(options)

    if (slideIndex = $this.attr('data-slide-to')) {
      $target.data('bs.carousel').to(slideIndex)
    }

    e.preventDefault()
  })

  $(window).on('load', function () {
    $('[data-ride="carousel"]').each(function () {
      var $carousel = $(this)
      $carousel.carousel($carousel.data())
    })
  })

}(window.jQuery);

/* ========================================================================
 * Bootstrap: transition.js v3.0.0
 * http://twbs.github.com/bootstrap/javascript.html#transitions
 * ========================================================================
 * Copyright 2013 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================================== */


+function ($) { "use strict";  

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap') 

    var transEndEventNames = {
      'WebkitTransition' : 'webkitTransitionEnd'
    , 'MozTransition'    : 'transitionend'
    , 'OTransition'      : 'oTransitionEnd otransitionend'
    , 'transition'       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }  
      }
    }
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false, $el    = this
    $(this).one($.support.transition.end, function () { called = true })
    var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

  $(function () {
    $.support.transition = transitionEnd()
  })

}(window.jQuery);

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
