angular.module('meringue')
.factory('downloads', function($cordovaFile, database) {
	var downService = {
		filePathPrefix: 'cdvfile://localhost/persistent/meringue/',
		// This object keeps track of the downloads in progress, it has a key
		// based on the collection it's tracking and the value is an array
		inProgressPodcasts: {},
		getDownloadingPodcastDetails: function(collectionUrl, podcastUrl) {
			if(downService.inProgressPodcasts.hasOwnProperty(collectionUrl)){
				if(typeof downService.inProgressPodcasts[collectionUrl][podcastUrl] !== 'undefined') {
					return downService.inProgressPodcasts[collectionUrl][podcastUrl];
				}
			}
			return null;
		},
		downloadOrDelete: function(collectionUrl, podcastDetails) {
			if(podcastDetails.filepath != null) {
				// The file has already been downloaded, delete it
				downService.deleteFile(podcastDetails);
			} else {
				// Download the file
				downService.beginDownload(collectionUrl, podcastDetails);
			}
		},
		beginDownload:function(collectionUrl, podcastDetails) {
			var fileUrl = podcastDetails.url;
			var fileName = /.*[/](.+.mp3)$/.exec(fileUrl)[1];
			var filePath = downService.filePathPrefix + fileName;
			// Create dictionary elements
			if(!downService.inProgressPodcasts.hasOwnProperty(collectionUrl)) {
				downService.inProgressPodcasts[collectionUrl] = {};
			}
			downService.inProgressPodcasts[collectionUrl][podcastDetails.url] = podcastDetails;
			// Continue to download the file
			console.log("Download started with URL:" + fileUrl);
			$cordovaFile
				.downloadFile(fileUrl, filePath, true)
				.then(function(result) {
					downService.endDownload(collectionUrl, podcastDetails, fileUrl, filePath, result);
				},
				downService.errorCallback,
				function(progress) {
					downService.progressCallback(collectionUrl, podcastDetails, progress);
				});
		},
		endDownload: function(collectionUrl, podcastDetails, fileUrl, filePath, result) {
			console.log("File successfully downloaded, updating DB");
			database.updatePodcastFileLocation(fileUrl, filePath, function() {
				podcastDetails['filepath'] = filePath;
				delete inProgressPodcasts[collectionUrl][podcastDetails.url];
			});
		},
		progressCallback: function(collectionUrl, podcastDetails, progress) {
			if (progress.lengthComputable) {
				podcastDetails['downloadProgress'] = (progress.loaded / progress.total) * 100;
				downService.inProgressPodcasts[collectionUrl][podcastDetails.url] = podcastDetails;
			}
		},
		errorCallback: function(err) {
			console.log("Error downloading file: ");
			console.log(err);
		},
		deleteFile: function(podcastDetails) {
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
		}
	}

	return downService;
});