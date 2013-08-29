var app = angular.module('admin', []);

function adminCtrl($scope, $http){
	$scope.items = [];
	// get share tweets
	function tweets(){
		$http({
			method : 'GET',
			url : '/admin/edit'
		}).success(function(data){
			console.log( data );
			$scope.items = data;
		});
	}
	tweets();
	// remove detail
	$scope.remove = function(db, tweet){
		$http({
			method : 'DELETE',
			url : '/admin/edit',
			params : {
				db_id : db,
				tweet_id : tweet
			}
		}).success(function(data, status, headers, config){
			if( status === 200 )
				tweets();
		})
	};
}