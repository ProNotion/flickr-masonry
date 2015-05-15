angular.module('flickrApp')
.controller('PhotosController', ["$scope", "$http", "myCache", "localStorageService", "analyticsService", 'utilitiesService', 'appConstants', function($scope, $http, myCache, localStorageService, analyticsService, utilitiesService, appConstants) {
  var cachedData = myCache.get('faves') || localStorageService.getFaves();
  var photosAtATime = 50;
  var photosLoaded = 0;
  var controller = this;
  
  $scope.page = "faves";
  
  $scope.$on('handleBroadcast', function(event, args) {
    if (args.page) {
      $scope.page = args.page;
    }
    
    if (args.show) {
      controller.display();
    }
  });
  
  this.freshPhotosFetched = function(data) {
    $scope.faves = data.photos.photo;
    $scope.photosToShow = $scope.faves.slice(0, photosAtATime);
    photosLoaded = photosAtATime;
    $scope.morePhotosToShow = $scope.faves.length > $scope.photosToShow.length;
    myCache.put('faves', $scope.faves); // 'session' cache
    localStorageService.setTimeSinceLastPhotoGet(); // longterm storage
    localStorageService.setFaves($scope.faves); // longterm storage
    App.postRenderOnControllerEmit($scope);
  };
  
  this.showCachedPhotos = function() {
    utilitiesService.debugConsole('using cached data! yay!');
    $scope.faves = cachedData;
    $scope.photosToShow = $scope.faves.slice(0, photosLoaded + photosAtATime);
    photosLoaded = photosAtATime;
    $scope.morePhotosToShow = $scope.faves.length > $scope.photosToShow.length;
    App.postRenderOnControllerEmit($scope);
  };

  this.display = function() {
    if (cachedData) { // If there’s something in the cache, use it!
      this.showCachedPhotos();
    } else {
      var getUrl = appConstants.baseUrl + "?method=flickr.favorites.getPublicList&api_key=" + appConstants.apiKey + "&user_id=49782305@N02&extras=url_t,url_s,url_m,url_z,url_l,url_sq&per_page=" + appConstants.maxPhotosToRequest + "&format=json&jsoncallback=JSON_CALLBACK";

      $http.jsonp(getUrl)
        .success(this.freshPhotosFetched);
    }
  };

  // sometimes the large image size isn't available. fall back onto other versions.
  this.largestHREFSizeAvailable = function(photo) {
    return photo.url_l || photo.url_m || photo.url_s || photo.url_t;
  };
  
  this.showMorePhotos = function() {
    // analyticsService.logAnalytics(['_trackEvent', 'flickr masonry nav', 'more button clicked' ]);
    // App.destroyMasonry();

    $scope.photosToShow = $scope.faves.slice(0, photosLoaded + photosAtATime);
    photosLoaded = photosLoaded + photosAtATime;
    $scope.morePhotosToShow = $scope.faves.length > $scope.photosToShow.length;
    App.postPhotosRender();
  };
  
  this.display();
}])
.directive("favePhotos", function() {
  return {
    restrict: "E",
    templateUrl: "partials/fave-photos.html",
    controller: "PhotosController",
    controllerAs: "fCtrl"
  };
});
