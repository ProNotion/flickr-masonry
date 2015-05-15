angular.module('flickrApp')
.factory('myCache', function($cacheFactory) {
 return $cacheFactory('flickrData');
});
