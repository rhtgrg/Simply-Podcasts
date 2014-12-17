angular.module('meringue')
.factory('playlist', function(database) {
	var playlistService = {
		nowPlaying: -1,
		playlist: [],
		addToPlaylist: function(podcastUrl, playPosition) {
			var index = 0;
			if(playlistService.nowPlaying == -1) {
				// Nothing is playing, index doesn't really matter
				playlistService.playlist = [podcastUrl];
				playlistService.nowPlaying = 0;
			} else {
				// Something is playing
				switch(playPosition) {
					case 'now':
					case 'next':
						playlistService.playlist.splice(playlistService.nowPlaying+1, 0, podcastUrl);
						index = playlistService.nowPlaying+1;
						break;
					case 'last':
						playlistService.playlist[playlistService.playlist.length] = podcastUrl;
						break;
				}
			}
			return index;
		},
		clearPlaylist: function() {
			playlistService.nowPlaying = -1;
			playlistService.playlist = [];
		},
		playIndex: function(index) {
			playlistService.nowPlaying = index;
		},
		playNext: function() {
		
		},
		playPrevious: function() {
		
		}
	}

	return playlistService;
});