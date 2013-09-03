// GET */*
var array = new Array(30);
exports.index = function(req, res){
	res.render('index', {items:array});
}