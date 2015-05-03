/*global gup, logAnalytics, debugConsole, console */

var App = angular.module('flickrApp', []);

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

App.controller('PhotosController', ["$scope", "$http", "myCache", "localStorageService", "analyticsService", function($scope, $http, myCache, localStorageService, analyticsService) {
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
      var getUrl = FlickrMasonry.baseUrl + "?method=flickr.favorites.getPublicList&api_key=" + FlickrMasonry.apiKey + "&user_id=49782305@N02&extras=url_t,url_s,url_m,url_z,url_l,url_sq&per_page=" + FlickrMasonry.maxPhotosToRequest + "&format=json&jsoncallback=JSON_CALLBACK";

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

App.controller('TagsController', ['$scope', '$http', 'myCache', 'localStorageService', function($scope, $http, myCache, localStorageService) {
  var cachedData;
  var photosAtATime = 50;
  var photosLoaded = 0;
  var tag = "";

  this.search = { term: "" };
  
  this.tagSearch = function() {
    $scope.page = "tagged";
    tag = encodeURIComponent(this.search.term);
    $scope.$emit('handleEmit', {page: "tagged", searchTerm: tag});
    this.getPhotosByTag(tag);
    // this.setSearchQueryParam(tag);
  };
  
  this.freshPhotosFetched = function(data) {
    $scope.tagged = data.photos.photo;
    $scope.photosToShow = $scope.tagged.slice(0, photosLoaded + photosAtATime);
    photosLoaded = photosAtATime;
    $scope.morePhotosToShow = $scope.tagged.length > $scope.photosToShow.length;
    myCache.put('tagged:' + tag, $scope.tagged); // 'session' cache
    // localStorageService.setTimeSinceLastPhotoGet(); // longterm storage
    localStorageService.setTagged(tag, $scope.tagged); // longterm storage
    App.postRenderOnControllerEmit($scope);

      // //TODO display message if no photos were found with the tag
      // if (data.photos.photo.length > 0 ) {
      //  self.displayPhotos(data, {'taggedPhotos' : true, 'searchedTag' : tag });
      // } else {
      //  // todo - make sure to guard against security vulnerabilities here
      //  self.noTaggedImagesResult(tag);
      // }
      // 
  };

  this.showCachedPhotos = function() {
    console.log('using cached __tagged__ data! yay!');
    $scope.tagged = cachedData;
    $scope.photosToShow = $scope.tagged.slice(0, photosLoaded + photosAtATime);
    photosLoaded = photosAtATime;
    $scope.morePhotosToShow = $scope.tagged.length > $scope.photosToShow.length;
    App.postRenderOnControllerEmit($scope);
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
      var getURL = FlickrMasonry.baseUrl + "/?method=flickr.tags.getClusterPhotos";
        getURL += "&tag=" + tag;
        getURL += "&cluster_id=&api_key=" + FlickrMasonry.apiKey + "&extras=url_t,url_s,url_m,url_z,url_l,url_sq";
        getURL += "&per_page=" + FlickrMasonry.maxPhotosToRequest + "&format=json&jsoncallback=JSON_CALLBACK";
      
      $http.jsonp(getURL)
        .success(this.freshPhotosFetched);
    }
  };
  
  // this.showTagLimit = false;
}]);

App.directive('taggedPhotos', function() {
  return {
    restrict: "E",
    templateUrl: "templates/tagged-photos.html"
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
  // FlickrMasonry.setupImageTooltips();
  FlickrMasonry.setupPrettyPhoto();
  // FlickrMasonry.runMasonry(300);
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


var FlickrMasonry = {
	apiKey: "79f2e11b6b4e3213f8971bed7f17b4c4",
	baseUrl: 'https://api.flickr.com/services/rest/',
	timeSinceLastPhotoGet : null,
	forcePatternAJAXGet : false,
	maxPhotosToRequest : 400,
	flickrPhotos: null,
	photosAtATime: 48,
	photosLoaded: 0,
	
	loadLocalStorage: function() {
		var milliseconds = localStorage.getItem('flickr_masonry_time_retrieved_at');
		if (milliseconds) {
			this.timeSinceLastPhotoGet = parseInt(milliseconds, 10);
		}
	},
	
	initialize: function() {
    // this.setupTagForm();
    // this.setupAnalytics();
    // this.setupAddToFavorites();
    // 
	}
};

App.destroyMasonry = function() {
  var $container = jQuery('#photosContainer ul');
  $container.masonry( 'destroy' );
};


FlickrMasonry.runMasonry = function(delay) {
  var $containers = jQuery('.photosContainer ul');
  
  setTimeout( function(){
    $containers.masonry({
      itemSelector : '.photo',
      columnWidth : 260,
      isFitWidth: true
    });
  }, delay || 10);
};


FlickrMasonry.setupAnalytics = function () {
	jQuery('#seeTagsLink').click( function() {
		logAnalytics(['_trackEvent', 'view', 'flick masonry see all images with tag', jQuery('#seeTagsName').text() ]);
	});
	
	jQuery('.suggestionTag').click( function() {
		logAnalytics(['_trackEvent', 'view', 'flick masonry click suggested tag', jQuery(this).text() ]);
	});
};


FlickrMasonry.getPhotos = function() {
	var searchTerm = gup('search');
	
	// allow search by tag to be done via a query string
	if (searchTerm) {
		this.getPhotosByTag(encodeURIComponent(searchTerm));
	}	else if (this.timeForFreshAJAXRequest()) {
    this.getFavoritePhotos();
	}	else {
    console.log( 'using local storage for photos retrieval' );
    this.flickrPhotos = JSON.parse(localStorage.getItem('flickrPhotos'));
    this.displayPhotos(this.flickrPhotos);
	}
};


// no images with the user-input tag were found; show something a message and some suggestions
FlickrMasonry.noTaggedImagesResult = function(tag) {
	var $tagsILikeMarkup = jQuery('<ul class="suggestionTags tagsILike group" />'),
			tagsILike = "colors fractal grafitti skyline complex pattern texture cute repetition urban decay spiral mandala nostalgia";

	// todo use jQuery.tmpl for this
	jQuery(tagsILike.split(' ')).each(function(item, elem) {
		$tagsILikeMarkup.append("<li class='suggestionTag tagsILikeTag'>" + elem + "</li>");
	});
			
	jQuery('#loader').hide();
	
	jQuery('#noTagsFound')
		.html('<h3>no photos tagged <span class="bold italic">' + tag + "</span></h3>")
		.append($tagsILikeMarkup)
		.fadeIn();
		
	$tagsILikeMarkup.before("<p>some tags i suggest:</p>");
};


FlickrMasonry.displayPhotos = function(jsonData, options) {
	options = options || {};
	
	var elems = [];
	var self = this;
	
	var $container = self.$masonryContainer,
			// for RSS feed
			// photos = jsonData.items.slice(this.photosLoaded, this.photosLoaded + this.photosAtATime ),
			// for REST API
			photos = jsonData.photos.photo.slice(self.photosLoaded, self.photosLoaded + self.photosAtATime ), // crude way of achieving offset
			newPhoto,
			$listItem,
			$photoLink,
			$ajaxLoader = jQuery('#loader');

  // only show this loader on initial load
  if (!self.photosLoaded) {
    $ajaxLoader.center().show().fadeTo(1, 1);
    $container.addClass('disabled').fadeTo(0, 0);
  }
	
	jQuery.each(photos, function(i, item) {
		var itemTitle;
		
		// if the photo's index is above the quoto per fetch, then return
		if ( i >= self.photosAtATime ) { return; }
		
		newPhoto = new Image();
		$listItem = jQuery('<li>', { "class" : "photo" } );

		// for REST API
		$photoLink = jQuery('<a>',
										{ "target": "_blank",
											"class": "flickrFaveItem",
											"href" :  FlickrMasonry.getLargestImageSizeAvailable(item),
											"rel" : "lightbox['flickr']"
											// "data-time": item.date_taken,
											// "data-tags": hyperlinkTags(item.tags)
											});
		
		newPhoto.src = item.url_s;
		
		itemTitle = item.title || "[untitled]";
		
		jQuery(newPhoto).attr({
      "data-flickr-url" : "http://www.flickr.com/" + item.owner + "/" + item.id + "/lightbox/",
      "data-author-url": FlickrMasonry.hyperlinkAuthorREST(item.owner),
      "data-author-id" : item.owner,
      "data-title": itemTitle,
      "data-photo-id" : item.id,
      "alt" : "<a href='http://www.flickr.com/" + item.owner + "/" + item.id + "/lightbox/' target='_blank'>" + itemTitle + "</a>",
      "width": item.width_s
		});
		
		$photoLink.append(newPhoto);
		$listItem.append($photoLink);
		
    $container.append($listItem);
    elems.push($listItem[0]);
	});
	
	if (self.photosLoaded) {
    $container.append(elems);
    FlickrMasonry.$masonryContainer.masonry('appended', elems);
	}
	
  // run the masonry plugin
	$container.imagesLoaded(function() {
    // TODO not sure why this is necessary; should only be run once initially, but run into masonry layout issues
    // if i don't run it each time.
    $container.masonry({
      itemSelector : '.photo',
      columnWidth : 260,
      isFitWidth: true
    });
    
    var imagesCallback = function() {
			// only fade the 'more' button back in if there are still images remaining to be shown
      if ( !options.taggedPhotos && self.photosLoaded < self.flickrPhotos.photos.photo.length ) {
       jQuery('#moreButton').fadeTo( 650, 1, 'swing');
      }
			if ( options.taggedPhotos ) {
				jQuery('#tagLimit').show();
			}

			self.photosLoaded = self.photosLoaded + self.photosAtATime;

			// Setup tooltips for each image
      self.setupImageTooltips();
      // setup pretty photo gallery
      self.setupPrettyPhoto();

			if (options.taggedPhotos) {
				self.updateCredits(options.searchedTag);
			}

			// temp off
			// jQuery('img:even').statick({opacity: 0.06, timing:{baseTime: 140}});
    };

    if (!self.photosLoaded) {
      $ajaxLoader.fadeTo(200, 0, function() {
        $ajaxLoader.hide();
        $container.removeClass('disabled').fadeTo(570, 1, imagesCallback);
      });
    } else {
      imagesCallback();
    }
	});
};


FlickrMasonry.clearAllTooltips = function() {
  jQuery('.flickrPhotoLink img').each( function() {
    jQuery(this).qtip('api').destroy();  
  });
};

FlickrMasonry.setupImageTooltips = function() {
  var self = this;
	// TODO might be able to optimize this; possible to only run qtip on the images that haven't had it run on yet?
	jQuery('.flickrPhotoLink img').each(function() {
		
		var $image = jQuery(this),
				userId = $image.data('authorId'),
				flickrUrl = $image.data('flickrUrl'),
				title = $image.data('title');
		
		$image.qtip({
			content: {
				text: "<div class='loading'><span>loading...</span></div>",
				ajax: {
          url: FlickrMasonry.baseUrl + "/?method=flickr.people.getInfo&api_key=" + FlickrMasonry.apiKey + "&user_id=" + userId + "&format=json&jsoncallback=?",
          type: 'GET', // POST or GET,
          dataType: "json",
          success: function(data) {
						var realname = self.fetchRealName(data),
                username = self.fetchUserName(data),
								photoId = self.fetchPhotoId($image),
                markup = "<p class='photoTitle'><a href='" + flickrUrl + "' target='_blank'>" + title + "</a></p><p>by: <a class='authorName' href='http://www.flickr.com/photos/" + userId + "' target='_blank'>" + username + realname + "</a></p><a href='#' class='addToFavorites' data-photo-id='" + photoId + "'>add to favorites</a>";

						// TODO: don't really like this, try and clean it up
            jQuery(jQuery(this)[0].elements.content[0]).find('.loading').html(markup);
          }
        }
			},
      position:{
        my: 'left center',
        at: 'right center',
        viewport: self.$masonryContainer
      },
      show: {
        delay: 260,
        effect: function() {
          jQuery(this).fadeIn(300); // "this" refers to the tooltip
        }
      },
      hide: {
        delay: 50,
        fixed: true,
        effect: function() {
          jQuery(this).fadeOut(220); // "this" refers to the tooltip
        }
      },
      style: {
        tip:{
          width: 7,
          height: 19
        },
        classes: "flickrTip"
      }
    });
	});
};

// todo
FlickrMasonry.fetchPhotoId = function($photo) {
	return $photo.data('photoId');
};

// return real name of the photo's owner if it exists
FlickrMasonry.fetchRealName = function(data) {
	var realname;
	try{
		realname = " (" + data.person.realname._content + ")";
	}	catch(e) {
		realname = '';
	}
	return realname;
};

// return username of the photo's owner if it exists
FlickrMasonry.fetchUserName = function(data) {
	var username;
	try{
		username = data.person.username._content;
	}	catch(e) {
		username = '';
	}
	return username;
};

FlickrMasonry.hyperlinkAuthorREST = function(authorId) {
	return "<a href='http://www.flickr.com/photos/" + authorId + "' target='_blank'>" + authorId + "</a>";
};

FlickrMasonry.hyperlinkAuthor = function(authorId, authorName) {
	return "<a href='http://www.flickr.com/photos/" + authorId + "' target='_blank'>" + authorName + "</a>";
};

FlickrMasonry.hyperlinkTags = function(tags) {
	var tagsArray = tags.split(' '),
			linkedTags = [];
	
	for (var tag in tagsArray) {
    if ( tagsArray.hasOwnProperty(tag) ) {
      linkedTags.push("<a class='tag' href='http://www.flickr.com/photos/tags/" + tagsArray[tag] + "' target='_blank'>" + tagsArray[tag] + "</span>");
    }
	}
	return linkedTags.join(' ');
};


// only make an ajax call to flickr if it's been over a day
FlickrMasonry.timeForFreshAJAXRequest = function() {
  // if the last time we made an ajax call was over a day ago
  // or if we want to force an ajax retrieval
	return this.timeSinceLastPhotoGet === null || ((new Date().getTime() - this.timeSinceLastPhotoGet) / (1000 * 60 * 60 * 24)) > 1 || this.forcePatternAJAXGet;
};


// sets up the lightbox for images
FlickrMasonry.setupPrettyPhoto = function() {
  var self = this;
	jQuery("a[rel^='lightbox']").prettyPhoto({
		overlay_gallery : false,
		deeplinking: false,
		social_tools: false,
		changepicturecallback: function() {
      // self.hideTooltips(); // hide all image tooltips
		}
	});
};


FlickrMasonry.updateCredits = function(tag) {
	jQuery('#seeTagsName').text(tag);
	jQuery('#seeTagsLink').attr('href', 'http://www.flickr.com/photos/tags/' + tag + '/show/');
	this.showSimilarTags(tag);
};

FlickrMasonry.showSimilarTags = function(tag) {
	var getURL = this.baseUrl + "/?method=flickr.tags.getRelated";
    getURL += "&tag=" + tag;
    getURL += "&cluster_id=&api_key=" + FlickrMasonry.apiKey;
    getURL += "&format=json&jsoncallback=?";
	
	jQuery.getJSON( getURL,
		function(data) {
			try{
				for( var item in data.tags.tag ) {
          if (data.tags.tag.hasOwnProperty(item)) {
            if ( item > 10 ) { break;}

            var tagName = data.tags.tag[item]._content,
              $link = jQuery('<a>', {"text" : tagName, 'class' : 'suggestionTag', href: "#" });
              
            jQuery('#seeSimilarTags ul').append(jQuery('<li></li>').append($link));
          }
				}
			} catch(e) {
				debugConsole( 'error in showSimilarTags: ' + e.message, "error");
			}
		}
	);
};


FlickrMasonry.setupTagForm = function() {
  var self = this;
	jQuery('#tagForm').submit(function(event) {
		var tag = jQuery.trim(jQuery(this).find('input').val());
		event.preventDefault();
		
		logAnalytics(['_trackEvent', 'search', 'flickr masonry search', tag ]);

		self.hideTooltips();
		self.clearPhotos();
    self.setSearchQueryParam(tag);
		self.getPhotosByTag(tag);
		return false;
	});
  
  this.setupPopularTags();
};


FlickrMasonry.setSearchQueryParam = function(tag) {
  tag = encodeURIComponent(tag);
  history.pushState(null, null, "?search=" + tag);
};

FlickrMasonry.updateTitleForTag = function(tag) {
	jQuery('header .title')
		.html('<a href="http://www.flickr.com" class="stealthLink" target="_blank">flickr</a> photos tagged <a href="http://www.flickr.com/photos/tags/' + tag + '/show/" class="bold italic stealthLink" target="_blank">' + tag + '</span>');
};

// clears existing photos, destroys masonry setup. for use with a completely new set of photos to be loaded in
FlickrMasonry.clearPhotos = function() {
  this.flickrPhotos = null;
	this.photosLoaded = 0;

	try{
		this.$masonryContainer.masonry( 'destroy' ).empty();
		jQuery('.suggestionTags').empty();
		jQuery('#noTagsFound').hide();
	} catch(e) {
    // debugConsole( 'error in clearPhotos(): ' + e.message, "debug");
	}
};

// hides any open tooltips, for the sake of UX
FlickrMasonry.hideTooltips = function () {
	jQuery('.flickrPhotoLink img').qtip('hide');
};


FlickrMasonry.setupPopularTags = function() {
	jQuery(document).delegate( '.suggestionTag', 'click', function(event) {
    event.preventDefault();
		jQuery('#tagForm')
			.find('input')
			.val(jQuery(this).text())
			.end()
			.submit();
	});
};

FlickrMasonry.setupAddToFavorites = function() {
  var self = this;
	jQuery(document).delegate( '.addToFavorites', 'click', function() {
		var photoId = jQuery(this).data('photoId');
		self.addPhotoToFavorites(photoId);
	});
};


FlickrMasonry.addPhotoToFavorites = function(photoId) {
	// TODO: need to go through oAuth flow to get an auth token for this post
	jQuery.ajax({
    type: 'POST',
    url: FlickrMasonry.baseUrl + '?method=flickr.favorites.add&format=json&jsoncallback=?',
    data: { 'api_key' : FlickrMasonry.apiKey, 'photo_id' : photoId },
    success: function(data) {
			console.log(data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log('error');
			console.log(errorThrown);
		}
	});
};
