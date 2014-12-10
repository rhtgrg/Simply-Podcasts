angular.module('meringue')
.factory('database', function() {
	var databaseService = {
		db: undefined,
		init: function() {
			document.addEventListener("deviceready", function() {
				databaseService.db = window.openDatabase("meringue", "1.0", "Meringue DB", 1000000);
				databaseService.initTables();
				window.ds = databaseService;
				console.log("Database initialized");
			}, false);
		},
		errorCallback: function(error) {
			console.log("Database error! " + error.message);
		},
		initTables: function() {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('CREATE TABLE IF NOT EXISTS COLLECTIONS (url unique, name, description)');
				tx.executeSql('CREATE TABLE IF NOT EXISTS PODCASTS (url unique, collection, filepath, name, description, duration, position, favorited, notes, in_playlist)');
			},
			databaseService.errorCallback);
		},
		insertCollection: function(collection, callback) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('INSERT INTO COLLECTIONS (url, name) VALUES (?, ?)', [collection.url, collection.name]);
			},
			databaseService.errorCallback, callback);
		},
		removeCollection: function(collectionUrl, callback) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('DELETE FROM COLLECTIONS WHERE url = ?', [collectionUrl]);
				tx.executeSql('DELETE FROM PODCASTS WHERE collection = ?', [collectionUrl]);
			},
			databaseService.errorCallback, callback);
		},
		insertPodcasts: function(podcasts, callback) {
			databaseService.db.transaction(function(tx) {
				for(var i=0; i < podcasts.length; i++) {
					tx.executeSql('INSERT INTO PODCASTS (url, name, duration, collection) VALUES (?, ?, ?, ?)',
					[podcasts[i].url, podcasts[i].name, podcasts[i].duration, podcasts[i].collection]);
					//tx.executeSql('DELETE FROM PODCASTS WHERE url = ?', [podcasts[i].url]);
				}
			},
			databaseService.errorCallback, callback);
		},
		getCollections: function(callback) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM COLLECTIONS', [], function(tx, results) {
					var collections = [];
					for(var i=0; i<results.rows.length; i++) {
						collections.push({
							url: results.rows.item(i).url,
							name: results.rows.item(i).name
						});
					}
					callback(collections);
				}, databaseService.errorCallback);
			}, databaseService.errorCallback);
		},
		getCollection: function(collectionUrl, callback) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM COLLECTIONS WHERE url = ?', [collectionUrl], function(tx, results) {
					var collection = {};
					for(var i=0; i<results.rows.length; i++) {
						collection = {
							url: results.rows.item(i).url,
							name: results.rows.item(i).name
						};
					}
					callback(collection);
				}, databaseService.errorCallback);
			}, databaseService.errorCallback);
		},
		getPodcasts: function(collectionUrl, callback) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM PODCASTS WHERE collection = ?', [collectionUrl], function(tx, results) {
					var podcasts = [];
					for(var i=0; i<results.rows.length; i++) {
						podcasts.push({
							url: results.rows.item(i).url,
							filepath: results.rows.item(i).filepath,
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
					var podcastDetails = {};
					for(var i=0; i<results.rows.length; i++) {
						podcastDetails = {
							url: results.rows.item(i).url,
							filepath: results.rows.item(i).filepath,
							name: results.rows.item(i).name,
							duration: results.rows.item(i).duration,
							position: results.rows.item(i).position,
							notes: results.rows.item(i).notes
						};
					}
					callback(podcastDetails);
				}, databaseService.errorCallback);
			}, databaseService.errorCallback);		
		},
		updatePodcastPlayPosition: function(podcastUrl, duration, position, notes, callback) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('UPDATE PODCASTS SET duration = ?, position = ?, notes = ? WHERE url = ?', [duration, position, notes, podcastUrl]);
			},
			databaseService.errorCallback, callback);
		},
		updatePodcastFileLocation: function(podcastUrl, filePath, callback) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('UPDATE PODCASTS SET filepath = ? WHERE url = ?', [filePath, podcastUrl]);
			},
			databaseService.errorCallback, callback);
		},
		erasePodcastFile: function(podcastUrl) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('UPDATE PODCASTS SET filepath = NULL WHERE url = ?', [podcastUrl]);
				console.log("Set it to null file: "+podcastUrl);
			},
			databaseService.errorCallback, callback);		
		},
		addToPlaylist: function(podcastUrl) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('UPDATE PODCASTS SET in_playlist = ? WHERE url = ?', [true, podcastUrl]);
			},
			databaseService.errorCallback, callback);
		},
		removeFromPlaylist: function(podcastUrl) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('UPDATE PODCASTS SET in_playlist = ? WHERE url = ?', [false, podcastUrl]);
			},
			databaseService.errorCallback, callback);		
		},
		markPlayingPodcastInPlaylist: function(podcastUrl) {
		
		},
		getPlaylistPodcasts: function(callback) {
			databaseService.db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM PODCASTS WHERE in_playlist = ?', [true], function(tx, results) {
					var podcasts = [];
					for(var i=0; i<results.rows.length; i++) {
						podcasts.push({
							url: results.rows.item(i).url,
							filepath: results.rows.item(i).filepath,
							name: results.rows.item(i).name,
							duration: results.rows.item(i).duration,
							position: results.rows.item(i).position
						});
					}
					callback(podcasts);
				}, databaseService.errorCallback);
			}, databaseService.errorCallback);

		}
	};
	
	databaseService.init();
	
	return databaseService;
});