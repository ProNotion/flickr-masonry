/*global gup, logAnalytics, debugConsole, console */

var App = angular.module('flickrApp', []);

App.constant('appConstants', {
  "apiKey": "79f2e11b6b4e3213f8971bed7f17b4c4",
  'baseUrl': 'https://api.flickr.com/services/rest/',
  'maxPhotosToRequest' : 400
});

// http://stackoverflow.com/questions/9293423/can-one-controller-call-another#comment15870834_11847277
// http://jsfiddle.net/VxafF/
App.run(function($rootScope) {
  /*
  Receive emitted message and broadcast it.
  Event names must be distinct or browser will blow up!
  */
  $rootScope.$on('handleEmit', function(event, args) {
    $rootScope.$broadcast('handleBroadcast', args);
  });
});

App.factory('myCache', function($cacheFactory) {
 return $cacheFactory('flickrData');
});

App.service('analyticsService', function () {
  return {
    logAnalytics: function(valArray){
    	try{
    		if( typeof _gaq !== "undefined" ){
    			_gaq.push(valArray);
    			// for debugging
    			if( location.search.indexOf( "analytics=1" ) > 0 ){
    				debugConsole( 'analytics event:', "debug");
    				debugConsole( valArray, "debug");
    			}
    		}
    	}catch(e){
    		debugConsole( 'problem in logAnalytics: ' + e.message, "debug");
    	}
    }
  };
});

App.service('localStorageService', function () {
  var timeSinceLastPhotoGet = localStorage.getItem('flickr_masonry_time_retrieved_at');
  var faves = localStorage.getItem('flickrPhotos');
  
  return {
    getTimeSinceLastPhotoGet: function() {return parseInt(timeSinceLastPhotoGet, 10);},
    
    setTimeSinceLastPhotoGet: function() {
      timeSinceLastPhotoGet = new Date().getTime();
      localStorage.setItem('flickr_masonry_time_retrieved_at', timeSinceLastPhotoGet);
    },
    
    getFaves: function() { return JSON.parse(faves); },
    
    setFaves: function(data) {
      faves = JSON.stringify(data);
      localStorage.setItem('flickrPhotos', faves);
    },
    
    getTagged: function(tag) {
      return JSON.parse(localStorage.getItem('tagged:' + tag));
    },
    
    setTagged: function(tag, data) {
      localStorage.setItem('tagged:' + tag, JSON.stringify(data));
    }
  };
});


App.controller('MainController', ['$scope', function($scope) {
  $scope.page = "faves";
  
  this.backToMine = function() {
    $scope.page = "faves";
    $scope.$emit('handleEmit', {page: "faves", show: true});
  };
  
  $scope.$on('handleBroadcast', function(event, args) {
    if (args.page) {
      $scope.page = args.page;
    }
    if (args.searchTerm) {
      $scope.searchTerm = args.searchTerm;
    }
  });
}]);

App.directive("credits", ["$timeout", function($timeout) {
  return {
    restrict: "E",
    templateUrl: "templates/credits.html",
    link: function(scope, elem, attrs) {
      $timeout(function() {
        elem.find("footer").removeClass('opacityZero');
      }, 2000);
    }
  };
}]);

App.controller('PhotosController', ["$scope", "$http", "myCache", "localStorageService", "analyticsService", 'appConstants', function($scope, $http, myCache, localStorageService, analyticsService, appConstants) {
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
    console.log('using cached data! yay!');
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
}]);

App.directive("favePhotos", function() {
  return {
    restrict: "E",
    templateUrl: "templates/fave-photos.html",
    controller: "PhotosController",
    controllerAs: "fCtrl"
  };
});

App.controller('TagsController', ['$scope', '$http', 'myCache', 'localStorageService', 'appConstants', function($scope, $http, myCache, localStorageService, appConstants) {
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
      localStorageService.setTagged(tag, $scope.tagged); // longterm storage
      App.postRenderOnControllerEmit($scope);
      $scope.showTagLimit = true;
      this.getSimilarTags();
    } else {
      $scope.photosToShow = [];
      $scope.showTagLimit = false;
      $scope.similarTags = [];
    }
  };

  this.showCachedPhotos = function() {
    console.log('using cached __tagged__ data! yay!');
    $scope.tagged = cachedData;
    $scope.photosToShow = $scope.tagged.slice(0, photosLoaded + photosAtATime);
    photosLoaded = photosAtATime;
    this.getSimilarTags();
    App.postRenderOnControllerEmit($scope);
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

  // sometimes the large image size isn't available. fall back onto other versions.
  this.largestHREFSizeAvailable = function(photo) {
    return photo.url_l || photo.url_m || photo.url_s || photo.url_t;
  };
  
  this.getPhotosByTag = function(tag) {
    cachedData = myCache.get('tagged:' + tag) || localStorageService.getTagged(tag);
    
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
}]);

App.controller( 'TagsILikeController', function($scope) {
  this.tags = "colors fractal grafitti skyline pattern pattern texture cute repetition urban decay spiral mandala nostalgia".split(' ');
  
  this.searchTag = function(searchTerm, tag) {
    $scope.$parent.search.term = tag;
    $scope.$parent.tCtrl.tagSearch();
  };
});


App.directive('similarTags', function() {
  return {
    restrict: "E",
    templateUrl: "templates/similar-tags.html"
  };
});

App.directive('taggedPhotos', function() {
  return {
    restrict: "E",
    templateUrl: "templates/tagged-photos.html"
  };
});

App.directive('tagsILike', function() {
  return {
    restrict: "E",
    templateUrl: "templates/tags-i-like.html",
    controller: "TagsILikeController",
    controllerAs: 'tilCtrl'
  };
});

App.directive('tagLimit', function() {
  return {
    restrict: "E",
    templateUrl: "templates/tag-limit.html",
    controller: "TagsController",
    controllerAs: 'tCtrl'
  };
});

App.directive('tagSearch', function() {
  return {
    restrict: "E",
    templateUrl: "templates/tag-search.html",
    controller: "TagsController",
    controllerAs: 'tCtrl'
  };
});

App.postRenderOnControllerEmit = function($scope) {
  $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
    App.postPhotosRender();
  });
};

App.postPhotosRender = function() {
  $('[data-toggle="tooltip"]').tooltip();
  
  // sets up the lightbox for images
  (function setupPrettyPhoto() {
  	jQuery("a[rel^='lightbox']").prettyPhoto({
  		overlay_gallery : false,
  		deeplinking: false,
  		social_tools: false
  	});
  })();
  
};


App.directive('onFinishRender', function ($timeout) {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function () {
          scope.$emit('ngRepeatFinished');
        });
      }
    }
};});


// App.destroyMasonry = function() {
//   var $container = jQuery('#photosContainer ul');
//   $container.masonry( 'destroy' );
// };
//
//
// FlickrMasonry.runMasonry = function(delay) {
//   var $containers = jQuery('.photosContainer ul');
//
//   setTimeout( function(){
//     $containers.masonry({
//       itemSelector : '.photo',
//       columnWidth : 260,
//       isFitWidth: true
//     });
//   }, delay || 10);
// };


// FlickrMasonry.setupAnalytics = function () {
//   jQuery('#seeTagsLink').click( function() {
//     logAnalytics(['_trackEvent', 'view', 'flick masonry see all images with tag', jQuery('#seeTagsName').text() ]);
//   });
//
//   jQuery('.suggestionTag').click( function() {
//     logAnalytics(['_trackEvent', 'view', 'flick masonry click suggested tag', jQuery(this).text() ]);
//   });
// };


//
// // return real name of the photo's owner if it exists
// FlickrMasonry.fetchRealName = function(data) {
//   var realname;
//   try{
//     realname = " (" + data.person.realname._content + ")";
//   }  catch(e) {
//     realname = '';
//   }
//   return realname;
// };
//
// // return username of the photo's owner if it exists
// FlickrMasonry.fetchUserName = function(data) {
//   var username;
//   try{
//     username = data.person.username._content;
//   }  catch(e) {
//     username = '';
//   }
//   return username;
// };
//
// FlickrMasonry.hyperlinkAuthorREST = function(authorId) {
//   return "<a href='http://www.flickr.com/photos/" + authorId + "' target='_blank'>" + authorId + "</a>";
// };
//
// FlickrMasonry.hyperlinkAuthor = function(authorId, authorName) {
//   return "<a href='http://www.flickr.com/photos/" + authorId + "' target='_blank'>" + authorName + "</a>";
// };


// FlickrMasonry.updateCredits = function(tag) {
//   jQuery('#seeTagsName').text(tag);
//   jQuery('#seeTagsLink').attr('href', 'http://www.flickr.com/photos/tags/' + tag + '/show/');
//   this.showSimilarTags(tag);
// };

//
// FlickrMasonry.setSearchQueryParam = function(tag) {
//   tag = encodeURIComponent(tag);
//   history.pushState(null, null, "?search=" + tag);
// };

