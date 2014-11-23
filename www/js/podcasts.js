angular.module('meringue', ['ngRoute', 'ngCordova'])
.controller('PodcastsController', function() {
	// TODO: Handle slashes in podcast name
	this.podcasts = [
		{name: "Lantz Podcast", url: encodeURIComponent(encodeURIComponent("http://gamedesignadvance.com/podcast/001_lantz_full_complete.mp3"))},
		{name: "Anna Podcast", url: encodeURIComponent(encodeURIComponent("http://gamedesignadvance.com/podcast/002_anna_full_complete.mp3"))},
		{name: "Trefry Podcast", url: encodeURIComponent(encodeURIComponent("http://gamedesignadvance.com/podcast/003_trefry_full_complete.mp3"))}
	];
})
.controller('PlayerController', function($scope, $interval, $location, $routeParams, $cordovaMedia) {
	// TODO: Handle slashes in podcast name
	this.podcastName = $routeParams.podcastName;
	this.podcastUrl = decodeURIComponent($routeParams.podcastUrl);
	$scope.position = 0;
	document.addEventListener('deviceready', function () {
		// Begin playing the media file immediately
		var mediaSource = $cordovaMedia.newMedia(decodeURIComponent($routeParams.podcastUrl));
		var media = mediaSource.media;
		$cordovaMedia.play(media);
		
		// Handle the back button, stop the music
		document.addEventListener('backbutton', function () {
			$cordovaMedia.stop(media);
			$location.path('/');
		}, false);
		
		// Update the position of the music
		$interval(function() {
			$cordovaMedia.getCurrentPosition(media).then(function(position) {
				// Update the position
				$scope.position = position;
			}, function(error) {
				// Do nothing
			});
		}, 1000);
	}, false);
})
.config(function($routeProvider) {
	$routeProvider
		.when('/player/:podcastName/:podcastUrl', {
			templateUrl: 'player.html',
			controller: 'PlayerController as player'
		})
		.otherwise({
			templateUrl: 'podcasts.html',
			controller: 'PodcastsController as podcasts'
		});
});