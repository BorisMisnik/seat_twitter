// GET */*
var array = new Array(30)
  , model = require('../models/');

exports.index = function(req, res){
	if( !req.session.passport.hasOwnProperty('user') ){ // if user not authorized
		res.cookie('login', true);  // show popup authorized
		res.render('index', {items:array}); // render page
	}
	else{
		var id = req.session.passport.user.id; // find user in seat group
		model.checkUser(id, 
			function(){ 
				res.clearCookie('login', {path : '/'}); // if user finded remove cookie and shpw page
				res.render('index', {items:array});
			}, function(){
				res.render('index', {items:array});				
			})
	}
}