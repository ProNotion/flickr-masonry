angular.module('flickrApp')
.controller('TagsController', ['$scope', '$http', 'myCache', 'localStorageService', 'appConstants', 'utilitiesService', function($scope, $http, myCache, localStorageService, appConstants, utilitiesService) {
  var cachedData;
  var photosAtATime = 50;
  var photosLoaded = 0;
  var tag = "";

  $.suggestedTags = [];
  $scope.search = { term: "" };
  
  this.tagSearch = function() {
    $scope.page = "tagged";
    tag = encodeURIComponent($scope.search.term);
    $scope.search.term = tag;
    $scope.$emit('handleEmit', {page: "tagged", searchTerm: tag});
    this.getPhotosByTag(tag);
    // this.setSearchQueryParam(tag);
  };
  
  this.freshPhotosFetched = function(data) {
    $scope.tagged = data.photos.photo;
    if ($scope.tagged.length > 0) {
      $scope.photosToShow = $scope.tagged.slice(0, photosLoaded + photosAtATime);
      photosLoaded = photosAtATime;
      myCache.put('tagged:' + tag, $scope.tagged); // 'session' cache
      localStorageService.set("tagged:" + tag, $scope.tagged); // longterm storage
      angular.module('flickrApp').postRenderOnControllerEmit($scope);
      $scope.showTagLimit = true;
      this.getSimilarTags();
    } else {
      $scope.photosToShow = [];
      $scope.showTagLimit = false;
      $scope.similarTags = [];
    }
  };

  this.showCachedPhotos = function() {
    utilitiesService.debugConsole('using cached __tagged__ data! yay!');
    $scope.tagged = cachedData;
    $scope.photosToShow = $scope.tagged.slice(0, photosLoaded + photosAtATime);
    photosLoaded = photosAtATime;
    this.getSimilarTags();
    angular.module('flickrApp').postRenderOnControllerEmit($scope);
  };
  
  this.getSimilarTags = function () {
    var getURL = appConstants.baseUrl + "?method=flickr.tags.getRelated";
      getURL += "&tag=" + tag;
      getURL += "&cluster_id=&api_key=" + appConstants.apiKey;
      getURL += "&format=json&jsoncallback=JSON_CALLBACK";

    $http.jsonp(getURL)
      .success(function (data) {
        $scope.similarTags = data.tags.tag;
      });
  };

  this.getPhotosByTag = function(tag) {
    cachedData = myCache.get('tagged:' + tag) || localStorageService.get("tagged:" + tag);
    
    if (cachedData) { // If there’s something in the cache, use it!
      this.showCachedPhotos();
    } else {
      var getURL = appConstants.baseUrl + "?method=flickr.tags.getClusterPhotos";
        getURL += "&tag=" + tag;
        getURL += "&cluster_id=&api_key=" + appConstants.apiKey + "&extras=url_t,url_s,url_m,url_z,url_l,url_sq";
        getURL += "&per_page=" + appConstants.maxPhotosToRequest + "&format=json&jsoncallback=JSON_CALLBACK";

      $http.jsonp(getURL)
        .success(angular.bind(this, this.freshPhotosFetched));
    }
  };
}])
.directive('tagLimit', function() {
  return {
    restrict: "E",
    templateUrl: "partials/tag-limit.html",
    controller: 'TagsController',
    controllerAs: 'tCtrl'
  };
})
.directive('tagSearch', function() {
  return {
    restrict: "E",
    templateUrl: "partials/tag-search.html",
    controller: 'TagsController',
    controllerAs: 'tCtrl'
  };
});

angular.module('flickrApp')
.directive('similarTags', function() {
  return {
    restrict: "E",
    templateUrl: "partials/similar-tags.html"
  };
});

angular.module('flickrApp')
.directive('taggedPhotos', function() {
  return {
    restrict: "E",
    templateUrl: "partials/tagged-photos.html"
  };
});
