app.popup = function(){
	if( !$.cookie('login') ) return;

	var bg = $('.background');
	var popup = $('.popup_text');

	bg.css('opacity','.5')
	  .height($(document).height() + 100)
	  .fadeIn(function(){
			popup.fadeIn();
		});
}
