angular.module('meringue')
.factory('miniplayer', function(database, playlist, $rootScope, $interval, $cordovaMedia) {
	var miniPlayerService = {
		sliderValue: 0,
		isPlaying: false,
		media: null,
		notes: "",
		init: function() {
			// Periodically save progress, also responsible for updating the slider value
			$interval(function() {
				if(isPlaying) {
					$cordovaMedia.getCurrentPosition(miniPlayerService.media).then(function(position) {
						// Update slider value
						miniPlayerService.sliderValue = (position / $cordovaMedia.getDuration(miniPlayerService.media)) * 100;
						// Check if the song is over and go to the next thing
						if(miniPlayerService.sliderValue < 0) {
							playlist.playNext();
						}
						// Save progress
						database.updatePodcastPlayPosition(playlist.playlist[playlist.nowPlaying],
							$cordovaMedia.getDuration(miniPlayerService.media),
							position,
							miniPlayerService.notes);
					});
				}
			}, 1000);
			// Sets a watch on the playlist, if now playing changes, plays that
			$rootScope.$watch(function() {
				return playlist.nowPlaying;
			}, function watchCallback(newVal, oldVal) {
				// Play the new media
				database.getPodcastDetails(playlist.playlist[newVal], function(podcastDetails) {
					if(miniPlayerService.media != null) {
						$cordovaMedia.release(miniPlayerService.media);
					}
					mediaSource = $cordovaMedia.newMedia(miniPlayerService.getPlayPath(podcastDetails));
					miniPlayerService.media = mediaSource.media;
					miniPlayerService.notes = podcastDetails.notes;
					$cordovaMedia.play(miniPlayerService.media);
					miniPlayerService.isPlaying = true;
				});
			});
		},
		setSliderValue: function(val) {
			// Update the media position to the given value (slider value updated by interval)
			$cordovaMedia.seekTo(miniPlayerService.media, (val/100) * $cordovaMedia.getDuration(miniPlayerService.media) * 1000);
		},
		playOrPauseMedia: function() {
			if(miniPlayerService.isPlaying) {
				$cordovaMedia.pause(miniPlayerService.media);
				miniPlayerService.isPlaying = false;
			} else {
				$cordovaMedia.play(miniPlayerService.media);
				miniPlayerService.isPlaying = true;
			}
		},
		getPlayPath: function(podcastDetails) {
			if(podcastDetails.filepath == null) 
				return podcastDetails.url;
			else
				return podcastDetails.filepath;
		}
	}

	return miniPlayerService;
});