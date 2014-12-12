// http://docs.phonegap.com/en/2.1.0/cordova_storage_storage.md.html#openDatabase
// http://stackoverflow.com/questions/16286605/initialize-angularjs-service-with-asynchronous-data
angular.module('meringue', ['ngRoute', 'ngCordova'])
.controller('SearchController', function($scope, $http, $location, database) {
	$scope.searchTerm = "";
	$scope.noResults = false;
	
	$scope.addCollection = function(collectionUrl) {
		// Fetch the URL (TODO: Make this a service)
		$.get(collectionUrl, function(data) {
			var podcasts = [];
			var collection = {
				name: $(data).find("channel").find("title").first().text(),
				url: collectionUrl
			}
			$(data).find("item").each(function() {
				var $item = $(this);
				podcasts.push({
					name: $item.find("title").text(),
					url: $item.find("enclosure").attr("url"),
					duration: $item.find("enclosure").attr("length"),
					collection: collectionUrl
				});
			});
			// Insert the data into the database
			database.insertCollection(collection, function() {
				database.insertPodcasts(podcasts, function() {
					$location.url('/collections');
					$scope.$apply();
				});
			});
		});
	}
	
	$scope.searchApple = function() {
		$scope.noResults = false;
		// Search itunes using the given term
		$.getJSON('http://itunes.apple.com/search?media=podcast&term=' +
			encodeURIComponent($scope.searchTerm),
			function(data) {
				var collections = [];
				$.each(data.results, function(i, result) {
					collections.push({
						name: result.collectionName,
						url: result.feedUrl,
						count: result.trackCount,
						artUrl: result.artworkUrl100
					});
				});
				$scope.collections = collections;
				if(data.results.length == 0) $scope.noResults = true;
				$scope.$apply();
			});
	}
})
.controller('WebsourceController', function($scope, $http, $location, database) {
	$scope.url = "";
	$scope.submit = function() {
		// Fetch the URL
		$.get($scope.url, function(data) {
			var podcasts = [];
			var collection = {
				name: $(data).find("channel").find("title").first().text(),
				url: $scope.url
			}
			$(data).find("item").each(function() {
				var $item = $(this);
				podcasts.push({
					name: $item.find("title").text(),
					url: $item.find("enclosure").attr("url"),
					duration: $item.find("enclosure").attr("length"),
					collection: $scope.url
				});
			});
			// Insert the data into the database
			database.insertCollection(collection, function() {
				database.insertPodcasts(podcasts, function() {
					$location.url('/collections');
					$scope.$apply();
				});
			});
		});
	}
})
.controller('CollectionsController', function($scope, $route, $cordovaFile, database) {
	$scope.noResults = false;
	
	$scope.removeCollection = function(collectionUrl) {
		if(confirm("Are you sure?")) {
			database.removeCollection(collectionUrl, function() {
				$route.reload();
			});
		}
	}
	
	// Get data from database
	database.getCollections(function(collections) {
		$scope.collections = collections;
		if($scope.collections.length == 0) $scope.noResults = true;
		$scope.$apply();
	});
})
.controller('PodcastsController', function($scope, $routeParams, $cordovaFile, player, database) {
	var collectionUrl = decodeURIComponent($routeParams.collectionUrl);

	// Get data from database
	database.getPodcasts(collectionUrl, function(podcasts) {
		$scope.podcasts = podcasts;
		$scope.$apply();
	});
	
	database.getCollection(collectionUrl, function(collection) {
		$scope.collectionName = collection.name;
		$scope.$apply();
	});
	
	// Function to download a file given the URL (currently only MP3)
	$scope.downloadOrDeleteFile = function(podcastDetails) {
		if(podcastDetails.filepath != null) {
			// The file has already been downloaded, delete it
			if(confirm("Are you sure?")) {
				resolveLocalFileSystemURL(podcastDetails.filepath, function(file) {
					// Substring to remove preceding 'file://'
					$cordovaFile.removeFile(file.nativeURL.substr(7)).then(function(result) {
						database.erasePodcastFile(podcastDetails.url, function() {
							console.log("File successfully erased");
						});
					}, function(err) {
						console.log("There was an error deleting the file "+podcastDetails.filepath);
						console.log(err);
					});
				});
			}
			return;
		}
		
		// The file hasn't been downloaded, download it
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
		if(typeof podcastDetails.downloadProgress == 'undefined') {
			var interim = (podcastDetails.position/podcastDetails.duration) * 100;
			if(isNaN(interim)) {
				return 0;
			} else {
				return interim;
			}
		}
		return podcastDetails.downloadProgress;
	}
	
	// Function to favorite or unfavorite a podcast
	$scope.favoriteUnfavorite = function(podcastDetails) {
		var commonCallback = function(favorited) {
			podcastDetails['favorited'] = favorited;
			$scope.podcasts[$scope.podcasts.indexOf(podcastDetails)] = podcastDetails;
			$scope.$apply();
		}
		if(podcastDetails.favorited == null || podcastDetails.favorited == 'false') {
			database.setPodcastFavorited(podcastDetails.url, 'true', function() {
				commonCallback('true');
			});		
		} else {
			database.setPodcastFavorited(podcastDetails.url, 'false', function() {
				commonCallback('false');
			});
		}
	}
	
	$scope.starClass = function(favorited) {
		return ((favorited == null || favorited == 'false') ? "star-empty" : "star");
	}
	
	$scope.addToPlaylist = function(podcastUrl) {
		database.addToPlaylist(podcastUrl, function() {
			player.playNextInPlaylist(false);
			player.updatePlaylist(); // Doing this here because above method may just 'return'
		});
	}
})
.controller('MiniPlayerController', function($scope, database, player, $interval, $cordovaMedia) {
	$scope.playing = false;
	var firstLaunch = true;
	var mediaSource, media, progressSaver;
	
	player.playIndexInPlaylist = function(index) {
		database.getPlaylistIndex(index, function(podcast) {
			// Can only play if there is something there
			if(!$.isEmptyObject(podcast)) {
				player.playWithUrl(podcast.url);
				player.updatePlayingIndex(index);
			} else {
				// In here, we are probably done with the playlist, so hide the mini player
				$('#plist-mini-player').addClass('hide');
			}
		});
	}
	
	player.playNextInPlaylist = function(forcedPlay) {
		var index = (player.playingIndex == null) ? 0 : player.playingIndex + 1;
		// Forced play signifies whether it is absolutely necessary to begin playing
		if(index != 0 && !forcedPlay) return; // Don't play if already begun
		player.playIndexInPlaylist(index);
	}
	$scope.playNextInPlaylist = player.playNextInPlaylist;
	
	player.playWithUrl = function(podcastUrl) {
		// Stop saving progress for previous thing (if any)
		if(typeof progressSaver !== 'undefined') {
			$interval.cancel(progressSaver);
		}
		// Attempt to clear media to prevent issues
		if(typeof media !== 'undefined') {
			$cordovaMedia.release(media);
		}
		// Show player
		$('#plist-mini-player').removeClass('hide');
		// Fetch podcast details and play it
		database.getPodcastDetails(podcastUrl, function(podcastDetails) {
			$scope.podcastDetails = podcastDetails;
			
			$scope.podcastPlayPath = function() {
				if(podcastDetails.filepath == null) 
					return podcastDetails.url;
				else
					return podcastDetails.filepath;
			}
			
			mediaSource = $cordovaMedia.newMedia($scope.podcastPlayPath());
			media = mediaSource.media;
			
			// Play the media file
			$cordovaMedia.play(media);
			$scope.playing = true;
			
			// Perform initial setup if necessary
			if(firstLaunch) {
				firstLaunchSetup();
			}
			
			// Seek to the correct position - there's no player callback, so improvise with an interval
			var beginPlayPromise = $interval(function() {
				$cordovaMedia.getCurrentPosition(media).then(function(position) {
					if(position > 0) {
						// Seek to the last played position
						$cordovaMedia.seekTo(media, podcastDetails.position * 1000);
						$interval.cancel(beginPlayPromise);
						// TODO: Have a loading spinner (if streaming) and at this point hide it
						periodicallySaveProgress();
					}
				});
			}, 100);
			
			$scope.$apply();
		});
		
		var firstLaunchSetup = function() {
			// Initiate the slider / player
			var $slider = $('#slider-handle').slider().on('slideStop', function() {
				// The value of the slider is the % completion the audio is at
				var playPosition = ($slider.slider('getValue')/100) * $cordovaMedia.getDuration(media);
				$cordovaMedia.seekTo(media, playPosition * 1000);
			});
			
			// Keep the slider updated
			$interval(function() {
				$cordovaMedia.getCurrentPosition(media).then(function(position) {
					var sliderValue = (position / $cordovaMedia.getDuration(media)) * 100;
					$slider.slider('setValue', (position / $cordovaMedia.getDuration(media)) * 100);
					// Check if the song is over and go to the next thing
					// TODO: Test this well
					if(sliderValue < 0) {
						player.playNextInPlaylist(true);
					}
				});
			}, 1000);
			
			// Pause/play functionality
			$scope.pausePlay = function() {
				if($scope.playing) {
					$cordovaMedia.pause(media);
					$scope.playing = false;
				} else {
					$cordovaMedia.play(media);
					$scope.playing = true;
				}
			};
			
			firstLaunch = false;
		}
		
		var periodicallySaveProgress = function() {
			progressSaver = $interval(function() {
				$cordovaMedia.getCurrentPosition(media).then(function(position) {
					database.updatePodcastPlayPosition($scope.podcastDetails.url, $cordovaMedia.getDuration(media), position, $scope.podcastDetails.notes, function(){
						// Do nothing on successful progress saving
					});
				});
			}, 1000);
		}
	}

	// If we were playing something last time, try to resume it
	database.getPreference('currentIndexInPlaylist', function(index) {
		if(typeof index !== 'undefined' || index != null) {
			player.playIndexInPlaylist(player.playingIndex);
		}
	});
})
.controller('PlaylistController', function($scope, player, database) {
	$scope.clearPlaylist = function() {
		database.clearPlaylist(function() {
			$scope.podcasts = [];
			player.updatePlayingIndex(null);
			$scope.$apply();
		});
	}
	
	player.updatePlaylist = function() {
		// In here, update $scope.podcasts and also the current playing index and then
		// apply scope and highlight the playing index
		database.getPlaylistPodcasts(function(podcasts) {
			$scope.podcasts = podcasts;
			if(player.playingIndex != null) {
				podcasts[player.playingIndex]['class'] = 'active';
			}
			$scope.$apply();
		});
	}
	
	$scope.playIndexInPlaylist = player.playIndexInPlaylist;
	
	player.updatePlaylist();
})
.run(function() {
	var hammerjs = new Hammer($('body')[0]);
	hammerjs.on('panleft', function(e) {
		console.log("Pan left");
	});
	hammerjs.on('panright', function(e) {
		console.log("Pan right");
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
.filter('playButton', function() {
	return function(playing) {
		return (playing ? "pause" : "play");
	}
})
.config(function($routeProvider) {
	$routeProvider
		// .when('/', {
			// templateUrl: 'websource.html',
			// controller: 'WebsourceController'
		// })
		.when('/', {
			templateUrl: 'collections.html',
			controller: 'CollectionsController'
		})
		.when('/search', {
			templateUrl: 'search.html',
			controller: 'SearchController'
		})
		.when('/collections', {
			templateUrl: 'collections.html',
			controller: 'CollectionsController'		
		})
		.when('/collection/:collectionUrl', {
			templateUrl: 'podcasts.html',
			controller: 'PodcastsController'
		})
		.when('/playlist', {
			templateUrl: 'playlist.html',
			controller: 'PlaylistController'
		});
});