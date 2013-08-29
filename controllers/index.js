// GET */*
exports.index = function(req, res){
	var array = new Array(30);
	res.render('index', {items:array});
}