// http://docs.phonegap.com/en/2.1.0/cordova_storage_storage.md.html#openDatabase
// http://stackoverflow.com/questions/16286605/initialize-angularjs-service-with-asynchronous-data
angular.module('meringue', ['ngRoute', 'ngCordova'])
.controller('WebsourceController', function($scope, $http, $location, database) {
	//$scope.url = "http://gamedesignadvance.com/?page_id=1616";
	$scope.url = "http://192.168.1.102/mp3/";
	$scope.submit = function() {
		// Fetch the URL
		$http.get($scope.url).success(function(data) {
			var str = data;
			var podcasts = [];
			// Parse the podcast names and MP3 locations
			// var regex = /["]([^"]+.mp3)["]>([a-zA-Z ]+)/gi;
			var regex = /["]([^"]+.mp3)["]/gi;
			while((result = regex.exec(str))) {
				podcasts.push({
					name: decodeURIComponent(result[1]),
					url: "http://192.168.1.102/mp3/" + decodeURIComponent(result[1])
				});
			}
			// Insert the data into the database
			database.insertPodcasts(podcasts, function() {
				$location.url('/collection');
			});
		}). error(function() {
			console.log("Error fetching URL");
		});
	}
})
.controller('PodcastsController', function($scope, $cordovaFile, database) {
	// Get data from database
	database.getPodcasts(function(podcasts) {
		$scope.podcasts = podcasts;
		$scope.$apply();
	});
	
	// Function to download a file given the URL (currently only MP3)
	$scope.downloadFile = function(podcastDetails) {
		if(podcastDetails.filepath != null) {
			alert("Already downloaded!");
			return;
		}
		var fileUrl = podcastDetails.url;
		var fileName = /.*[/](.+.mp3)$/.exec(fileUrl)[1];
		var filePath = 'cdvfile://localhost/persistent/' + fileName;
		console.log("Download started with URL:" + fileUrl);
		$cordovaFile
			.downloadFile(fileUrl, filePath, true)
			.then(function(result) {
					console.log("File successfully downloaded, updating DB");
					database.updatePodcastFileLocation(fileUrl, filePath, function() {
						podcastDetails['filepath'] = filePath;
						$scope.podcasts[$scope.podcasts.indexOf(podcastDetails)] = podcastDetails;
						console.log("DB updated");
					});
				}, function(err) {
					console.log("Error downloading file: ");
					console.log(err);
				}, function (progress) {
					// constant progress updates
					if (progress.lengthComputable) {
						podcastDetails['downloadProgress'] = (progress.loaded / progress.total) * 100;
						$scope.podcasts[$scope.podcasts.indexOf(podcastDetails)] = podcastDetails;
					}
				});
	}
	
	// Returns the current download progress, or the play progress
	$scope.getProgressValue = function(podcastDetails) {
		if(typeof podcastDetails.downloadProgress == "undefined") {
			var interim = (podcastDetails.position/podcastDetails.duration) * 100;
			if(isNaN(interim)) {
				return 0;
			} else {
				return interim;
			}
		}
		return podcastDetails.downloadProgress;
	}
})
.controller('PlayerController', function($scope, database, $interval, $location, $routeParams, $cordovaMedia) {
	// Get the details of the given podcast from the database
	var podcastUrl = decodeURIComponent($routeParams.podcastUrl);
	database.getPodcastDetails(podcastUrl, function(podcastDetails) {
		$scope.podcastDetails = podcastDetails;
		var loaded = false;
		
		$scope.podcastPlayPath = function() {
			if(podcastDetails.filepath == null) 
				return podcastDetails.url;
			else
				return podcastDetails.filepath;
		}
		
		var mediaSource = $cordovaMedia.newMedia($scope.podcastPlayPath());
		var media = mediaSource.media;
		// Play the media file
		$cordovaMedia.play(media);
		// Seek to the last played position
		$cordovaMedia.seekTo(media, podcastDetails.position * 1000);
		
		// Initiate the slider / player
		var $slider = $('#player').slider().on('slideStop', function() {
			// The value of the slider is the % completion the audio is at
			var playPosition = ($slider.slider('getValue')/100) * $cordovaMedia.getDuration(media);
			$cordovaMedia.seekTo(media, playPosition * 1000);
		});
		
		// Keep the slider updated
		var sliderUpdater = $interval(function() {
			$cordovaMedia.getCurrentPosition(media).then(function(position) {
				$slider.slider('setValue', (position / $cordovaMedia.getDuration(media)) * 100);
			});
		}, 1000);
		
		function handleBackButton() {
			$cordovaMedia.getCurrentPosition(media).then(function(position) {
				database.updatePodcastPlayPosition(podcastUrl, $cordovaMedia.getDuration(media), position, function(){
					document.removeEventListener('backbutton', handleBackButton, false);
					$interval.cancel(sliderUpdater);
					$cordovaMedia.release(media);
					$location.url('/collection');
					$scope.$apply();
				});
			});
		}
		
		// Handle the back button
		document.addEventListener('backbutton', handleBackButton, false);
		
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
		if(isNaN(value)) return "0%";
		return Math.floor(value) + "%";
	};
})
.filter('trusted', ['$sce', function ($sce) {
	return function(url) {
		return $sce.trustAsResourceUrl(url);
	};
}])
.filter('podcastFilter', function() {
	return function(filepath, dictKey) {
		var dict = {
			playText: ["Stream", "Play"],
			actionText: ["Download", "Delete"],
			btnClass: ["btn-default", "btn-primary"]
		}
	
		var index = (filepath == null) ? 0 : 1;
		return dict[dictKey][index];
	}
})
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