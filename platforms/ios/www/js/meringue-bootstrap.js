document.addEventListener('deviceready', function() {
	// Bootstraps the application after device ready so we don't have to worry about it
    var domElement = $('#meringue-app')[0];
    angular.bootstrap(domElement, ['meringue']);
}, false);