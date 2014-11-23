angular.module('meringue')
.factory('database', function() {
	var databaseService = {
		db: undefined,
		init: function() {
			document.addEventListener("deviceready", function() {
				databaseService.db = window.openDatabase("meringue", "1.0", "Meringue DB", 1000000);
				databaseService.initTables();
				console.log("Database initialized");
			}, false);
		},
		errorCallback: function(error) {
			console.log("Database error! " + error.message);
		},
		initTables: function() {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('DROP TABLE PODCASTS');
				tx.executeSql('CREATE TABLE IF NOT EXISTS PODCASTS (url unique, name, duration, position, favorited)');
				tx.executeSql('INSERT INTO PODCASTS (url, name) VALUES ("http://gamedesignadvance.com/podcast/001_lantz_full_complete.mp3", "Lantz Complete")');
				tx.executeSql('INSERT INTO PODCASTS (url, name) VALUES ("http://gamedesignadvance.com/podcast/002_anna_full_complete.mp3", "Anna Complete")');
				tx.executeSql('INSERT INTO PODCASTS (url, name) VALUES ("http://gamedesignadvance.com/podcast/003_trefry_full_complete.mp3", "Trefry Complete")');
			},
			databaseService.errorCallback);
		},
		getPodcasts: function(callback) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM PODCASTS', [], function(tx, results) {
					// Handle the result here - remember, this is a callback
					var podcasts = [];
					for(var i=0; i<results.rows.length; i++) {
						podcasts.push({
							url: results.rows.item(i).url,
							name: results.rows.item(i).name,
							duration: results.rows.item(i).duration,
							position: results.rows.item(i).position
						});
					}
					callback(podcasts);
				}, databaseService.errorCallback);
			}, databaseService.errorCallback);
		},
		getPodcastDetails: function(podcastUrl, callback) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM PODCASTS WHERE url = ?', [podcastUrl], function(tx, results) {
					// Handle the result here - remember, this is a callback
					var podcastDetails = {};
					for(var i=0; i<results.rows.length; i++) {
						podcastDetails = {
							url: results.rows.item(i).url,
							name: results.rows.item(i).name,
							duration: results.rows.item(i).duration,
							position: results.rows.item(i).position
						};
					}
					callback(podcastDetails);
				}, databaseService.errorCallback);
			}, databaseService.errorCallback);		
		},
		updatePodcast: function(podcastUrl, duration, position, callback) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('UPDATE PODCASTS SET duration = ?, position = ? WHERE url = ?', [duration, position, podcastUrl]);
			},
			databaseService.errorCallback, callback);
		}
	};
	
	databaseService.init();
	
	return databaseService;
});