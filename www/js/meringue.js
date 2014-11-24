// http://docs.phonegap.com/en/2.1.0/cordova_storage_storage.md.html#openDatabase
// http://stackoverflow.com/questions/16286605/initialize-angularjs-service-with-asynchronous-data
angular.module('meringue', ['ngRoute', 'ngCordova'])
.controller('WebsourceController', function(database) {

})
.controller('PodcastsController', function($scope, database) {
	// TODO: Handle slashes in podcast name
	// Get data from database
	database.getPodcasts(function(podcasts) {
		$scope.podcasts = podcasts;
		$scope.$apply();
	});
})
.controller('PlayerController', function($scope, database, $interval, $window, $routeParams, $cordovaMedia) {
	// Get the details of the given podcast from the database
	var podcastUrl = decodeURIComponent($routeParams.podcastUrl);
	database.getPodcastDetails(podcastUrl, function(podcastDetails) {
		$scope.podcastDetails = podcastDetails;
		if(typeof $scope.podcastDetails.position == undefined) {
			$scope.podcastDetails.position = 0;
		}
		
		$scope.updateAudioProperties = function (initialLoad) {
			if(initialLoad) {
				console.log("Loading audio props");
				$('audio').load();
			}
			$scope.podcastDetails.duration = $('audio')[0].duration;
			$scope.podcastDetails.position = $('audio')[0].currentTime;
			$scope.$apply();
		}
		
		// Handle the back button
		document.addEventListener('backbutton', function() {
			$scope.updateAudioProperties(false);
			database.updatePodcast(podcastUrl, $scope.podcastDetails.duration, $scope.podcastDetails.position, function(){
				$window.history.back();
			});
		}, false);
		
		$scope.$apply();
	});
})
.filter('encoded', function() {
	return function(input) {
		return encodeURIComponent(encodeURIComponent(input));
	};
})
.filter('time', function() {
	return function secondsToTime(secs) {
		var t = new Date(1970,0,1);
		t.setSeconds(secs);
		var s = t.toTimeString().substr(0,8);
		if(secs > 86399)
			s = Math.floor((t - Date.parse("1/1/70")) / 3600000) + s.substr(2);
		if(s.substr(0, 2) == 00)
			return s.substr(3);
		return s;
	};
})
.filter('percent', function() {
	return function formatPercent(value) {
		return Math.floor(value) + "%";
	};
})
.filter('trusted', ['$sce', function ($sce) {
	return function(url) {
		return $sce.trustAsResourceUrl(url);
	};
}])
.config(function($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'websource.html',
			controller: 'WebsourceController'
		})
		.when('/player/:podcastUrl', {
			templateUrl: 'player.html',
			controller: 'PlayerController as player'
		})
		.when('/collection', {
			templateUrl: 'podcasts.html',
			controller: 'PodcastsController'
		});
});