var app = angular.module('admin', []);

function adminCtrl($scope, $http){
	// get share tweets
	$http({
		method : 'GET',
		url : '/admin/getAll'
	}).success(function(data){
		console.log( data );
		$scope.items = data;
	})
}