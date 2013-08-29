var model = require('../models/');
// GET */admin*
exports.index = function(req, res){
	// if authorized
	if(req.session.login)
		res.render('admin', {authorized : true});
	else
		res.render('admin', {authorized : false});
};
// GET */admin/login*
exports.login = function(req, res){
	var login = req.query.login
	  , password = req.query.password; 

	if( login === "rmuhortov@g2moscow.ru" && password === "seat1seat.com")
		req.session.login = true;  
		
	res.redirect('/admin');
};
// GET */admin/edit/*
exports.getAll = function(req, res){
	model.getDetails(function(data){
		res.send(data);
	})
};
// DELETE */admint/edit*
exports.remove = function(req, res){
	model.removeUser(req.query.db_id, req.query.tweet_id, function(){
		res.send('ok', 200 );
	});
}