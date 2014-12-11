angular.module('meringue')
.factory('player', function() {
	var playerService = {
		// Provider a url that the player begins to play immediately
		podcastUrl: 'http://gamedesignadvance.com/podcast/002_anna_full_complete.mp3'
	}

	return playerService;
});