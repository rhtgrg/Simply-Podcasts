angular.module('meringue', ['ngCordova'])
.controller('PodcastsController', function($cordovaMedia) {
	this.podcasts = ['Phi', 'Kappa', 'Psi'];
	document.addEventListener("deviceready", function () {
		var mediaSource = $cordovaMedia.newMedia("mp3-url.mp3");
		var media = mediaSource.media;
		$cordovaMedia.play(media);
	}, false);
});