angular.module('meringue')
.factory('player', function(database) {
	var playerService = {
		playingIndex: null,
		playIndexInPlaylist: function() { /*stub*/ },
		playNextInPlaylist: function() { /*stub*/ },
		playWithUrl: function() { /*stub*/ },
		updatePlaylist: function() { /*stub*/ },
		updatePlayingIndex: function(index) {
			playerService.playingIndex = index;
			database.setPreference('currentIndexInPlaylist', index, function() {
				console.log("Updated playing index in playlist");
				playerService.updatePlaylist();
			});
		}
	}

	return playerService;
});