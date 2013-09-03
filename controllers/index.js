// GET */*
var array = new Array(30)
  , model = require('../models/');

exports.index = function(req, res){
	res.render('index', {items:array});
}