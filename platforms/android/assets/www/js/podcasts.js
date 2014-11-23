angular.module('meringue', ['ngCordova'])
.controller('PodcastsController', function($cordovaMedia) {
	this.podcasts = ['Love', 'You', 'Ma'];
	document.addEventListener("deviceready", function () {
		var mediaSource = $cordovaMedia.newMedia("http://viuspace.viu.ca/bitstream/handle/10613/218/NanaimoHistoryJohnson29.mp3?sequence=1");
		var media = mediaSource.media;
		$cordovaMedia.play(media);
	}, false);
});