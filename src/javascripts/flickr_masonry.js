/*global TELE, gup, debug_console, console */

var FlickrMasonry = {
	apiKey: "79f2e11b6b4e3213f8971bed7f17b4c4",
	baseUrl: 'https://api.flickr.com/services/rest/',
	timeSinceLastPhotoGet : null,
	forcePatternAJAXGet : false,
	maxPhotosToRequest : 500,
	flickrPhotos: null,
	photosAtATime: 58,
	photosLoaded: 0,
	
	loadLocalStorage: function() {
		var milliseconds = localStorage.getItem('flickr_masonry_time_retrieved_at');
		if (milliseconds) {
			this.timeSinceLastPhotoGet = parseInt(milliseconds, 10);
		}
	},
	
	initialize: function() {
    jQuery.fn.center = function () {
      this.css("top", (($(window).height() - this.outerHeight()) / 2) + $(window).scrollTop() + "px");
      this.css("left", (($(window).width() - this.outerWidth()) / 2) + $(window).scrollLeft() + "px");
      return this;
    };

    this.originalTitle = jQuery('header .title').text(); // TODO probably somewhere better to do this

    this.loadLocalStorage();
    this.getPhotos(); // get the initial photos the first time the page loads
    this.setupMoreButton();
    this.setupTagForm();
    this.setupAnalytics();
    this.setupAddToFavorites();

    // experimental
    this.reflectPlugin();
	}
};


FlickrMasonry.setupAnalytics = function () {
	jQuery('#seeTagsLink').click( function() {
		TELE.logAnalytics(['_trackEvent', 'view', 'flick masonry see all images with tag', jQuery('#seeTagsName').text() ]);
	});
	
	jQuery('.suggestionTag').click( function() {
		TELE.logAnalytics(['_trackEvent', 'view', 'flick masonry click suggested tag', jQuery(this).text() ]);
	});
};


FlickrMasonry.reflectPlugin = function() {
	if (location.href.match(/reflect=(1|true)/)) {
		var s = document.createElement('script');
		s.src = 'https://raw.github.com/dguzzo/reflections/master/javascripts/jquery.reflections.js';
		document.getElementsByTagName('head')[0].appendChild(s);

		s = jQuery('<link/>', {
      href : 'http://www.telecommutetojuryduty.com/misc/reflections/stylesheets/reflections.css',
      type : 'text/css',
      rel : 'stylesheet'
		});
		
		jQuery('head').append(s);

    jQuery(document).delegate('body', 'keyup', function(e) {
      try{
        switch( e.which ) {
          case 39: // right key
						jQuery('li img').reflectImages({ 'delay': 50, 'stripLinks' : true });
            break;
          case 37: // left key
						jQuery('li img').reflectImages({'destroy' : true });
            break;
        }
      } catch(err) {}
    });
	}
};

FlickrMasonry.getPhotos = function() {
	this.hideCommonElements();
	var searchTerm = gup('search');
	
	// allow search by tag to be done via a query string
	if ( searchTerm ) {
		this.getPhotosByTag(encodeURI(searchTerm));
	}	else if (this.timeForFreshAJAXRequest()) {
    this.getFavoritePhotos();
	}	else {
    console.log( 'using local storage for photos retrieval' );
    this.flickrPhotos = JSON.parse(localStorage.getItem('flickrPhotos'));
    this.displayPhotos(this.flickrPhotos);
	}
};

FlickrMasonry.getFavoritePhotos = function() {
  debug_console( 'using ajax call to flickr for photos retrieval', 'debug' );

  var getURL = this.baseUrl + "?method=flickr.favorites.getPublicList&api_key=" + this.apiKey + "&user_id=49782305@N02&extras=url_t,url_s,url_m,url_z,url_l,url_o&per_page=" + this.maxPhotosToRequest + "&format=json&jsoncallback=?";

  jQuery('#loader').center().show().fadeTo(1, 1);

  jQuery.getJSON( getURL,
    function(data) {
      localStorage.setItem('flickr_masonry_time_retrieved_at', new Date().getTime() );
      localStorage.setItem('flickrPhotos', JSON.stringify( data ) );
      this.flickrPhotos = data;
      this.displayPhotos(data);
    }
  );
};

FlickrMasonry.getPhotosByTag = function(tag) {
	var getURL = this.baseUrl + "/?method=flickr.tags.getClusterPhotos";
    getURL += "&tag=" + tag;
    getURL += "&cluster_id=&api_key=" + this.apiKey + "&extras=url_t,url_s,url_m,url_z,url_l,url_o";
    getURL += "&per_page=" + this.maxPhotosToRequest + "&format=json&jsoncallback=?";

	this.hideCommonElements();
	
	jQuery('#loader').center().show().fadeTo(1, 1);
	
	jQuery.getJSON( getURL,
		function(data) {
			this.flickrPhotos = data;
			
			//TODO display message if no photos were found with the tag
			if (data.photos.photo.length > 0 ) {
				this.displayPhotos(data, {'taggedPhotos' : true, 'searchedTag' : tag });
			} else {
				// todo - make sure to guard against security vulnerabilities here
				this.noTaggedImagesResult(tag);
			}
			
			this.setupBackToMine();
		}
	);
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
			
	this.delayFooterVisibility();
};


FlickrMasonry.displayPhotos = function(jsonData, options) {
	options = options || {};
	
	var $container = jQuery('#flickrFaves ul'),
			// for RSS feed
			// photos = jsonData.items.slice(this.photosLoaded, this.photosLoaded + this.photosAtATime ),
			// for REST API
			photos = jsonData.photos.photo.slice(this.photosLoaded, this.photosLoaded + this.photosAtATime ), // crude way of achieving offset
			newPhoto,
			$listItem,
			$photoLink,
			$ajaxLoader = jQuery('#loader');

	$ajaxLoader.center().show().fadeTo(1, 1);
	$container.addClass('disabled').fadeTo(0, 0);
	
	jQuery.each(photos, function(i, item) {
		var itemTitle;
		
		// if the photo's index is above the quoto per fetch, then return
		if ( i >= this.photosAtATime ) { return; }
		
		newPhoto = new Image();
		$listItem = jQuery('<li>', { "class" : "photo" } );

    // for RSS
    // $photoLink = jQuery('<a>',
    //                 { "target": "_blank",
    //                   "class": "flickrFaveItem",
    //                   "href" :  item.link + "lightbox/",
    //                   "data-author": hyperlinkAuthor(item.author_id, item.author),
    //                   "data-title": item.title,
    //                   "data-time": item.date_taken,
    //                   "data-tags": hyperlinkTags(item.tags)
    //                 });
    // newPhoto.src = item.media.m;
		
		// for REST API
		$photoLink = jQuery('<a>',
										{ "target": "_blank",
											"class": "flickrFaveItem",
											"href" :  this.getLargestImageSizeAvailable(item),
											"rel" : "lightbox['flickr']"
											// "data-time": item.date_taken,
											// "data-tags": hyperlinkTags(item.tags)
											});
		
		newPhoto.src = item.url_s;
		
		itemTitle = item.title || "[untitled]";
		
		jQuery(newPhoto).attr({
				"data-flickr-url" : "http://www.flickr.com/" + item.owner + "/" + item.id + "/lightbox/",
				"data-author-url": this.hyperlinkAuthorREST(item.owner),
				"data-author-id" : item.owner,
				"data-title": itemTitle,
				"data-photo-id" : item.id,
				'alt' : "<a href='http://www.flickr.com/" + item.owner + "/" + item.id + "/lightbox/' target='_blank'>" + itemTitle + "</a>"
				// 'alt' : item.title || "[untitled]"
		});
		
		$photoLink.append(newPhoto);
		$listItem.append($photoLink);
		$container.append($listItem);
	});
	
	// needed for masonry layout to be recalculated properly
	if ( this.photosLoaded > 0 ) {
		debug_console( 'masonry reloadItems', "debug");
		$container.masonry( 'reloadItems' );
	}
	
	// run the masonry plugin
	$container.imagesLoaded(function() {
		
    $container.masonry({
      itemSelector : '.photo',
      columnWidth : 260,
      isFitWidth: true
    });

		$ajaxLoader.fadeTo(200, 0, function() {
			$ajaxLoader.hide();
			$container.removeClass('disabled').fadeTo(570, 1, function() {
				
				// try to set the height/width of each image (for better rendering performance/best practices)
				jQuery('img').each( function() {
					try{
						if (jQuery(this)[0].width === 0 ) {
							throw new Error(jQuery(this)[0].src + " has a width of 0" );
						}
						jQuery(this).attr('width', jQuery(this)[0].width)
												.attr('height', jQuery(this)[0].height);
					} catch (e) {
						debug_console( e.message, "error");
					}
				});

				// only fade the 'more' button back in if there are still images remaining to be shown
				if ( !options.taggedPhotos && this.photosLoaded < this.flickrPhotos.photos.photo.length ) {
					jQuery('#moreButton').fadeTo( 650, 1, 'swing');
				}
				if ( options.taggedPhotos ) {
					jQuery('#tagLimit').show();
				}
				
				this.photosLoaded = this.photosLoaded + this.photosAtATime;
				this.delayFooterVisibility();

				// Setup tooltips for each image
				this.setupImageTooltips();
				// setup pretty photo gallery
				this.setupPrettyPhoto();
				
				if (options.taggedPhotos) {
					this.updateCredits(options.searchedTag);
				}
				// temp off
				// jQuery('img:even').statick({opacity: 0.06, timing:{baseTime: 140}});
				
			});
		});
	});
};


// sometimes the large image size isn't available. fall back onto other versions.
FlickrMasonry.getLargestImageSizeAvailable = function(item) {
	return item.url_l || item.url_m || item.url_s || item.url_t;
};


FlickrMasonry.setupImageTooltips = function() {
	// TODO might be able to optimize this; possible to only run qtip on the images that haven't had it run on yet?
	jQuery('.flickrFaveItem img').each(function() {
		
		var $image = jQuery(this),
				userId = $image.data('authorId'),
				flickrUrl = $image.data('flickrUrl'),
				title = $image.data('title');
		
		$image.qtip({
			content: {
				text: "<div class='loading'><span>loading...</span></div>",
				ajax: {
          url: FlickrMasonry.baseUrl + "/?method=flickr.people.getInfo&api_key=" + this.apiKey + "&user_id=" + userId + "&format=json&jsoncallback=?",
          type: 'GET', // POST or GET,
          dataType: "json",
          success: function(data) {
						// debug_console(data, 'log');
						var realname = this.fetchRealName(data),
                username = this.fetchUserName(data),
								photoId = this.fetchPhotoId($image),
                markup = "<p class='photoTitle'><a href='" + flickrUrl + "' target='_blank'>" + title + "</a></p><p>by: <a class='authorName' href='http://www.flickr.com/photos/" + userId + "' target='_blank'>" + username + realname + "</a></p><a href='#' class='addToFavorites' data-photo-id='" + photoId + "'>add to favorites</a>";

						// TODO: don't really like this, try and clean it up
            jQuery(jQuery(this)[0].elements.content[0]).find('.loading').html(markup);
          }
        }
			},
      position:{
        my: 'left center',
        at: 'right center',
        viewport: jQuery('#flickrFaves ul')
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

FlickrMasonry.setupMoreButton = function() {
	var $button = jQuery('#moreButton'),
    self = this;
	    
	$button.click( function() {
		TELE.logAnalytics(['_trackEvent', 'flickr masonry nav', 'more button clicked' ]);
		
		$button.fadeTo(1, 0);
		self.displayPhotos(self.flickrPhotos);
	});
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
			self.hideTooltips(); // hide all image tooltips
		}
	});
};

// don't want the footer showing before other stuff is loaded b/c the reflow looks bad
FlickrMasonry.delayFooterVisibility = function() {
	jQuery('#credits').fadeIn(2000);
};

FlickrMasonry.updateCredits = function(tag) {
	jQuery('#seeTagsName').text(tag);
	jQuery('#seeTagsLink').attr('href', 'http://www.flickr.com/photos/tags/' + tag + '/show/');
	this.showSimilarTags(tag);
};

FlickrMasonry.showSimilarTags = function(tag) {
	var getURL = this.baseUrl + "/?method=flickr.tags.getRelated";
    getURL += "&tag=" + tag;
    getURL += "&cluster_id=&api_key=" + this.apiKey;
    getURL += "&format=json&jsoncallback=?";
	
	jQuery.getJSON( getURL,
		function(data) {
			try{
				for( var item in data.tags.tag ) {
          if (data.tags.tag.hasOwnProperty(item)) {
            if ( item > 10 ) { break;}
            
            var tagName = data.tags.tag[item]._content;
            jQuery('<li>', {"text" : tagName, 'class' : 'suggestionTag' }).appendTo('#seeSimilarTags ul');
          }
				}
			} catch(e) {
				debug_console( 'error in showSimilarTags: ' + e.message, "error");
			}
		}
	);
};


FlickrMasonry.setupTagForm = function() {
	jQuery('#tagForm').submit( function(event) {
		var tag = jQuery(this).find('input').val();
		event.preventDefault();
		
		TELE.logAnalytics(['_trackEvent', 'search', 'flickr masonry search', tag ]);

		this.hideTooltips();
		this.clearPhotos();
		this.updateTitleForTag(tag);
		this.getPhotosByTag(tag);
	});
	this.setupPopularTags();
};

FlickrMasonry.updateTitleForTag = function(tag) {
	jQuery('header .title')
		.html('<a href="http://www.flickr.com" class="stealthLink" target="_blank">flickr</a> photos tagged <a href="http://www.flickr.com/photos/tags/' + tag + '/show/" class="bold italic stealthLink" target="_blank">' + tag + '</span>');
};

// clears existing photos, destroys masonry setup. for use with a completely new set of photos to be loaded in
FlickrMasonry.clearPhotos = function() {
	try{
    // debug_console( 'clearing past photos', "debug");
		this.flickrPhotos = null;
		this.photosLoaded = 0;
		var $container  = jQuery('#flickrFaves ul');
		$container.masonry( 'destroy' ).empty();
		jQuery('.suggestionTags').empty();
		jQuery('#noTagsFound').hide();
	} catch(e) {
    // debug_console( 'error in clearPhotos(): ' + e.message, "debug");
	}
};


// for UX purposes
FlickrMasonry.hideCommonElements = function() {
	jQuery('#credits, #moreButton, #tagLimit').hide();
};


// hides any open tooltips, for the sake of UX
FlickrMasonry.hideTooltips = function () {
	jQuery('.flickrFaveItem img').qtip('hide');
};

FlickrMasonry.setupBackToMine = function() {
  var self = this;
	jQuery('#backToMine').fadeIn()
		.click( function() {
			self.clearPhotos();
			jQuery('header .title').text(FlickrMasonry.originalTitle);
			jQuery('#tagForm input').val('');
			self.getPhotos();
		});
};

FlickrMasonry.setupPopularTags = function() {
	jQuery(document).delegate( '.suggestionTag', 'click', function() {
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
    data: { 'api_key' : this.apiKey, 'photo_id' : photoId },
    success: function(data) {
			console.log(data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log('error');
			console.log(errorThrown);
		}
	});
};
