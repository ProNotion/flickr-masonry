
var FLICKR_MASONRY = {
	apiKey: "79f2e11b6b4e3213f8971bed7f17b4c4",
	timeSinceLastPhotoGet : null,
	forcePatternAJAXGet : false,
	maxPhotosToRequest : 500,
	flickrPhotos: null,
	photosAtATime: 58,
	photosLoaded: 0,
	loadLocalStorage: function(){
		var milliseconds = localStorage.getItem('flickr_masonry_time_retrieved_at');
		if (milliseconds){
			FLICKR_MASONRY.timeSinceLastPhotoGet = parseInt(milliseconds, 10);
		}
	}
};

// begin/ready
jQuery(function(){

	jQuery.fn.center = function () {
		// this.css("position","absolute"); // assume center position
		this.css("top", (($(window).height() - this.outerHeight()) / 2) + $(window).scrollTop() + "px");
		this.css("left", (($(window).width() - this.outerWidth()) / 2) + $(window).scrollLeft() + "px");
		return this;
	};

	FLICKR_MASONRY.originalTitle = jQuery('header .title').text(); // TODO probably somewhere better to do this

	FLICKR_MASONRY.loadLocalStorage();
	FLICKR_MASONRY.getPhotos(); // get the initial photos the first time the page loads
	FLICKR_MASONRY.setupMoreButton();
	FLICKR_MASONRY.setupTagForm();
	FLICKR_MASONRY.setupAnalytics();
	FLICKR_MASONRY.setupAddToFavorites();
	
	// experimental
	FLICKR_MASONRY.reflectPlugin();
});


FLICKR_MASONRY.setupAnalytics = function (){
	jQuery('#seeTagsLink').click( function(event){
		TELE.logAnalytics(['_trackEvent', 'view', 'flick masonry see all images with tag', jQuery('#seeTagsName').text() ]);
	});	
	
	jQuery('.suggestionTag').click( function(event){
		TELE.logAnalytics(['_trackEvent', 'view', 'flick masonry click suggested tag', jQuery(this).text() ]);
	});
}


FLICKR_MASONRY.reflectPlugin = function(){
	if ( location.href.match(/reflect=(1|true)/) ){
		var s = document.createElement('script');
		s.src='https://raw.github.com/dguzzo/reflections/master/javascripts/jquery.reflections.js'; 
		document.getElementsByTagName('head')[0].appendChild(s);

		s = jQuery('<link/>', {'href' : 'http://www.telecommutetojuryduty.com/misc/reflections/stylesheets/reflections.css', 'type' : 'text/css', 'rel' : 'stylesheet' } );
		jQuery('head').append(s);

	  jQuery(document).delegate('body', 'keyup', function(e){
	    try{
	      switch( e.which ){
	        case 39: // right key
	            // location = jQuery('#wordNavNext').attr('href');
						jQuery('li img').reflectImages({ 'delay': 50, 'stripLinks' : true });
	          break;
	        case 37: // left key
						jQuery('li img').reflectImages({'destroy' : true });
	          break;
	      }
	    }
		catch(e){
	      // nothing
	  }
	 });
	}
}

FLICKR_MASONRY.getPhotos = function(){
	FLICKR_MASONRY.hideCommonElements();
	var searchTerm = gup('search');
	
	// allow search by tag to be done via a query string
	if ( searchTerm ){
		FLICKR_MASONRY.getPhotosByTag(encodeURI(searchTerm));
	}
	else{
		if ( FLICKR_MASONRY.timeForFreshAJAXRequest() ){
			debug_console( 'using ajax call to flickr for photos retrieval', 'debug' );

			// var getURL = 'http://api.flickr.com/services/feeds/photos_faves.gne?id=49782305@N02&format=json&jsoncallback=?';
			var getURL = "http://api.flickr.com/services/rest/?method=flickr.favorites.getPublicList&api_key="+FLICKR_MASONRY.apiKey+"&user_id=49782305@N02&extras=url_t,url_s,url_m,url_z,url_l,url_o&per_page="+FLICKR_MASONRY.maxPhotosToRequest+"&format=json&jsoncallback=?";
			jQuery('#loader').center().show().fadeTo(1, 1);

			jQuery.getJSON( getURL, 
				function(data) { 
					// console.log(data);
					localStorage.setItem('flickr_masonry_time_retrieved_at', new Date().getTime() );
					localStorage.setItem('flickrPhotos', JSON.stringify( data ) );
					FLICKR_MASONRY.flickrPhotos = data;
					FLICKR_MASONRY.displayPhotos(data);
				}
			);
		}
		else{
			console.log( 'using local storage for photos retrieval' );
			FLICKR_MASONRY.flickrPhotos = JSON.parse(localStorage.getItem('flickrPhotos'));	
			FLICKR_MASONRY.displayPhotos(FLICKR_MASONRY.flickrPhotos);
		}
	}
}

FLICKR_MASONRY.getPhotosByTag = function(tag){
	var getURL = "http://api.flickr.com/services/rest/?method=flickr.tags.getClusterPhotos";
	getURL += "&tag="+tag;
	getURL += "&cluster_id=&api_key="+FLICKR_MASONRY.apiKey+"&extras=url_t,url_s,url_m,url_z,url_l,url_o";
	getURL += "&per_page="+FLICKR_MASONRY.maxPhotosToRequest+"&format=json&jsoncallback=?";

	FLICKR_MASONRY.hideCommonElements();
	
	jQuery('#loader').center().show().fadeTo(1, 1);
	
	jQuery.getJSON( getURL, 
		function(data) { 
			// console.log(data);
			// localStorage.setItem('flickr_masonry_time_retrieved_at', new Date().getTime() );
			// localStorage.setItem('flickrPhotos', JSON.stringify( data ) );
			FLICKR_MASONRY.flickrPhotos = data;
			
			//TODO display message if no photos were found with the tag
			if (data.photos.photo.length > 0 ){
				FLICKR_MASONRY.displayPhotos(data, {'taggedPhotos' : true, 'searchedTag' : tag });	
			}
			else{
				// todo - make sure to guard against security vulnerabilities here
				FLICKR_MASONRY.noTaggedImagesResult(tag);
			}
			FLICKR_MASONRY.setupBackToMine();
		}
	);

}

// no images with the user-input tag were found; show something a message and some suggestions
FLICKR_MASONRY.noTaggedImagesResult = function(tag){
	var $tagsILikeMarkup = jQuery('<ul class="suggestionTags tagsILike group" />'), 
			tagsILike = "colors fractal grafitti skyline complex pattern texture cute repetition urban decay spiral mandala nostalgia";

	// todo use jQuery.tmpl for this
	jQuery(tagsILike.split(' ')).each(function(item, elem){
		$tagsILikeMarkup.append("<li class='suggestionTag tagsILikeTag'>"+elem+"</li>");
	});
			
	jQuery('#loader').hide();		
	
	jQuery('#noTagsFound')
		.html('<h3>no photos tagged <span class="bold italic">' + tag + "</span></h3>")
		.append($tagsILikeMarkup)
		.fadeIn();
		
	$tagsILikeMarkup.before("<p>some tags i suggest:</p>");		
			
	FLICKR_MASONRY.delayFooterVisibility();

	// not happy with this, as the top tags don't always return photos when searched via flickr.tags.getClusterPhotos

	/*
	var tagsToFetch = 10;
	var getURL = "http://api.flickr.com/services/rest/?method=flickr.tags.getHotList";
	getURL += "&api_key=79f2e11b6b4e3213f8971bed7f17b4c4";
	getURL += "&period=week&count="+ tagsToFetch;
	getURL += "&format=json&jsoncallback=?";

	jQuery.getJSON( getURL, 
		function(data) { 
			// console.log(data);
				var hottags = data.hottags.tag,
						$markup = jQuery('<ul class="suggestionTags popularTags group" />'), 
						hottag;
				
				for (var item in hottags ){
					if (item >= tagsToFetch ){break;}
					hottag = hottags[item]['_content'];
					$markup.append("<li class='suggestionTag popularTag'>"+hottag+"</li>");
				}
				
				// debug_console( markup, "debug");
				jQuery('#tagLimit').hide();
				jQuery('#noTagsFound')
					.html('no photos tagged <span class="bold italic">' + tag + "</span>")
					.append($tagsILikeMarkup, $markup);
					
				$markup.before("<p>trending tags:</p>");
		}
	);
	*/
}


FLICKR_MASONRY.displayPhotos = function(jsonData, options){
	
	debug_console( jsonData, "debug");
	
	options = options || {};
	
	var $container = jQuery('#flickrFaves ul'),
			// for RSS feed
			// photos = jsonData.items.slice(FLICKR_MASONRY.photosLoaded, FLICKR_MASONRY.photosLoaded + FLICKR_MASONRY.photosAtATime ),
			// for REST API
			photos = jsonData.photos.photo.slice(FLICKR_MASONRY.photosLoaded, FLICKR_MASONRY.photosLoaded + FLICKR_MASONRY.photosAtATime ),
			newPhoto, 
			$listItem, 
			$photoLink,
			$ajaxLoader = jQuery('#loader');

	$ajaxLoader.center().show().fadeTo(1, 1);
	$container.addClass('disabled').fadeTo(0, 0);
	
	jQuery.each(photos, function(i, item) {
		
		var itemTitle;
		
		// if the photo's index is above the quoto per fetch, then return
		if ( i >= FLICKR_MASONRY.photosAtATime ){
			return;
		}
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
											"href" :  FLICKR_MASONRY.getLargestImageSizeAvailable(item), 
											"rel" : "lightbox['flickr']"
											// "data-time": item.date_taken,
											// "data-tags": hyperlinkTags(item.tags) 
											});
		
		newPhoto.src = item.url_s;
		
		itemTitle = item.title || "[untitled]";
		
		jQuery(newPhoto).attr({
				"data-flickr-url" : "http://www.flickr.com/" + item.owner + "/" + item.id + "/lightbox/",
				"data-author-url": FLICKR_MASONRY.hyperlinkAuthorREST(item.owner),
				"data-author-id" : item.owner,
				"data-title": itemTitle,
				"data-photo-id" : item.id,
				'alt' : "<a href='http://www.flickr.com/" + item.owner + "/" + item.id + "/lightbox/' target='_blank'>"+itemTitle+"</a>"
				// 'alt' : item.title || "[untitled]"
		});
		
		$photoLink.append(newPhoto);
		$listItem.append($photoLink);
		$container.append($listItem);
	});
	
	// needed for masonry layout to be recalculated properly
	if ( FLICKR_MASONRY.photosLoaded > 0 ){
		debug_console( 'masonry reloadItems', "debug");
		$container.masonry( 'reloadItems' );
	}
	
	// run the masonry plugin
	$container.imagesLoaded(function(){
		
	  $container.masonry({
	    itemSelector : '.photo',
	    columnWidth : 260,
			isFitWidth: true
	  });

		$ajaxLoader.fadeTo(200, 0, function(){
			$ajaxLoader.hide();
			$container.removeClass('disabled').fadeTo(570, 1, function(){
				
				// try to set the height/width of each image (for better rendering performance/best practices)
				jQuery('img').each( function(){
					try{
						if (jQuery(this)[0].width === 0 ){
							throw new Error(jQuery(this)[0].src + " has a width of 0" );
						}
						jQuery(this).attr('width', jQuery(this)[0].width)
												.attr('height', jQuery(this)[0].height);
					}
					catch (e){
						debug_console( e.message, "error");
					}
				});

				// only fade the 'more' button back in if there are still images remaining to be shown
				if ( !options.taggedPhotos && FLICKR_MASONRY.photosLoaded < FLICKR_MASONRY.flickrPhotos.photos.photo.length ){
					jQuery('#moreButton').fadeTo( 650, 1, 'swing');
				}
				if ( options.taggedPhotos ){
					jQuery('#tagLimit').show();
				}
				
				FLICKR_MASONRY.photosLoaded = FLICKR_MASONRY.photosLoaded + FLICKR_MASONRY.photosAtATime;
				FLICKR_MASONRY.delayFooterVisibility();

				// Setup tooltips for each image
				FLICKR_MASONRY.setupImageTooltips();
				// setup pretty photo gallery
				FLICKR_MASONRY.setupPrettyPhoto();
				
				if (options.taggedPhotos){
					FLICKR_MASONRY.updateCredits(options.searchedTag);
				}
				// temp off
				// jQuery('img:even').statick({opacity: 0.06, timing:{baseTime: 140}});
				
			});
			
		});
	});
}


// sometimes the large image size isn't available. fall back onto other versions.
FLICKR_MASONRY.getLargestImageSizeAvailable = function(item){
	return item.url_l || item.url_m || item.url_s || item.url_t;
}


FLICKR_MASONRY.setupImageTooltips = function(){
	// TODO might be able to optimize this; possible to only run qtip on the images that haven't had it run on yet?
	jQuery('.flickrFaveItem img').each(function(){
		
		var $image = jQuery(this),
				userId = $image.data('authorId'),
				userUrl = $image.data('authorUrl'),
				flickrUrl = $image.data('flickrUrl'),
				title = $image.data('title');
		
		$image.qtip({
			content: {
				text: "<div class='loading'><span>loading...</span></div>",
				ajax: {
          url: "http://api.flickr.com/services/rest/?method=flickr.people.getInfo&api_key="+FLICKR_MASONRY.apiKey+"&user_id="+userId+"&format=json&jsoncallback=?", 
          type: 'GET', // POST or GET,
          dataType: "json",
          success: function(data, status) {
						// debug_console(data, 'log');
						var realname = FLICKR_MASONRY.fetchRealName(data),
						    username = FLICKR_MASONRY.fetchUserName(data),
								photoId = FLICKR_MASONRY.fetchPhotoId($image),
						    markup =  "<p class='photoTitle'><a href='"+flickrUrl+"' target='_blank'>" + title + "</a></p>\
										<p>by: <a class='authorName' href='http://www.flickr.com/photos/"+userId+"' target='_blank'>" + username + realname + "</a></p>\
										<a href='#' class='addToFavorites' data-photo-id='"+photoId+"'>add to favorites</a>";

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
        effect: function(offset) {
          jQuery(this).fadeIn(300); // "this" refers to the tooltip
        }
      },
      hide: { 
        delay: 50,
        fixed: true,  
        effect: function(){
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
}

// todo
FLICKR_MASONRY.fetchPhotoId = function($photo){
	return $photo.data('photoId');
}

// return real name of the photo's owner if it exists
FLICKR_MASONRY.fetchRealName = function(data){
	var realname;
	try{
		realname = " (" + data.person.realname._content + ")";
	}
	catch(e){
		realname = '';
	}
	return realname;
}

// return username of the photo's owner if it exists
FLICKR_MASONRY.fetchUserName = function(data){
	var username;
	try{
		username = data.person.username._content;
	}
	catch(e){
		username = '';
	}
	return username;
}

FLICKR_MASONRY.hyperlinkAuthorREST = function(authorId, authorName){
	return "<a href='http://www.flickr.com/photos/" + authorId + "' target='_blank'>" + authorId + "</a>";
}

FLICKR_MASONRY.hyperlinkAuthor = function(authorId, authorName){
	return "<a href='http://www.flickr.com/photos/" + authorId + "' target='_blank'>" + authorName + "</a>";
}

FLICKR_MASONRY.hyperlinkTags = function(tags){
	var tagsArray = tags.split(' '),
			linkedTags = [], 
			tag;
	
	for (tag in tagsArray){
    if ( tagsArray.hasOwnProperty(tag) ){
      linkedTags.push("<a class='tag' href='http://www.flickr.com/photos/tags/"+tagsArray[tag]+"' target='_blank'>"+tagsArray[tag]+"</span>");
    }
	}
	return linkedTags.join(' ');
}

FLICKR_MASONRY.setupMoreButton = function(){
	var $button = jQuery('#moreButton');
	$button.click( function(evt){
		
		TELE.logAnalytics(['_trackEvent', 'flickr masonry nav', 'more button clicked' ]);
		
		$button.fadeTo(1, 0);
		FLICKR_MASONRY.displayPhotos(FLICKR_MASONRY.flickrPhotos);
	});
}


// only make an ajax call to flickr if it's been over a day
FLICKR_MASONRY.timeForFreshAJAXRequest = function(){
	return FLICKR_MASONRY.timeSinceLastPhotoGet === null // if we've never made an ajax call for photos
					|| ((new Date().getTime() - FLICKR_MASONRY.timeSinceLastPhotoGet) / (1000 * 60 * 60 * 24)) > 1  // if the last time we made an ajax call was over a day ago
					|| FLICKR_MASONRY.forcePatternAJAXGet; // or if we want to force an ajax retrieval
}


// sets up the lightbox for images
FLICKR_MASONRY.setupPrettyPhoto = function(){
	// debug_console( "setting up prettyPhoto", "debug");
	jQuery("a[rel^='lightbox']").prettyPhoto({
		overlay_gallery : false,
		deeplinking: false,
		social_tools: false,
		changepicturecallback: function(){
			// hide all image tooltips
			FLICKR_MASONRY.hideTooltips();
		}
	});
}

// don't want the footer showing before other stuff is loaded b/c the reflow looks bad
FLICKR_MASONRY.delayFooterVisibility = function(){
	jQuery('#credits').fadeIn(2000);
}

FLICKR_MASONRY.updateCredits = function(tag){
	jQuery('#seeTagsName').text(tag);
	jQuery('#seeTagsLink').attr('href', 'http://www.flickr.com/photos/tags/'+tag+'/show/');
	FLICKR_MASONRY.showSimilarTags(tag);
}

FLICKR_MASONRY.showSimilarTags = function(tag){
	var getURL = "http://api.flickr.com/services/rest/?method=flickr.tags.getRelated";
	getURL += "&tag="+tag;
	getURL += "&cluster_id=&api_key=" + FLICKR_MASONRY.apiKey;
	getURL += "&format=json&jsoncallback=?";
	
	jQuery.getJSON( getURL, 
		function(data) { 
			// console.log(data);
			try{
				for( var item in data.tags.tag ){
					if ( item > 10 ){ break;}
					var tagName = data.tags.tag[item]._content;
					// console.log( data.tags.tag[item]._content );
					jQuery('<li>', {"text" : tagName, 'class' : 'suggestionTag' }).appendTo('#seeSimilarTags ul');
				}
			}catch(e){
				debug_console( 'error in showSimilarTags: ' + e.message, "error");
			}
		}
	);
}


FLICKR_MASONRY.setupTagForm = function(){
	jQuery('#tagForm').submit( function(event){
		var tag = jQuery(this).find('input').val();
		event.preventDefault();
		
		TELE.logAnalytics(['_trackEvent', 'search', 'flickr masonry search', tag ]);

		FLICKR_MASONRY.hideTooltips();
		FLICKR_MASONRY.clearPhotos();
		FLICKR_MASONRY.updateTitleForTag(tag);
		FLICKR_MASONRY.getPhotosByTag(tag);
	});
	FLICKR_MASONRY.setupPopularTags();
}

FLICKR_MASONRY.updateTitleForTag = function(tag){
	jQuery('header .title')
		.html('<a href="http://www.flickr.com" class="stealthLink" target="_blank">flickr</a> photos tagged <a href="http://www.flickr.com/photos/tags/' + tag + '/show/" class="bold italic stealthLink" target="_blank">' + tag + '</span>');
}

// clears existing photos, destroys masonry setup. for use with a completely new set of photos to be loaded in
FLICKR_MASONRY.clearPhotos = function(){
	try{
		debug_console( 'clearing past photos', "debug");
		FLICKR_MASONRY.flickrPhotos = null;
		FLICKR_MASONRY.photosLoaded = 0;
		var $container  = jQuery('#flickrFaves ul');
		$container.masonry( 'destroy' ).empty();
		jQuery('.suggestionTags').empty();
		jQuery('#noTagsFound').hide();
	}catch(e){
		debug_console( 'error in clearPhotos(): ' + e.message, "debug");
	}
}


// for UX purposes
FLICKR_MASONRY.hideCommonElements = function(){
	jQuery('#credits, #moreButton, #tagLimit').hide();
}


// hides any open tooltips, for the sake of UX
FLICKR_MASONRY.hideTooltips = function (){
	jQuery('.flickrFaveItem img').qtip('hide');
};

FLICKR_MASONRY.setupBackToMine = function(){
	jQuery('#backToMine').fadeIn()
		.click( function(event){
			FLICKR_MASONRY.clearPhotos();
			jQuery('header .title').text(FLICKR_MASONRY.originalTitle);
			jQuery('#tagForm input').val('');
			FLICKR_MASONRY.getPhotos();
			// setupMoreButton()
		});
}

FLICKR_MASONRY.setupPopularTags = function(){
	jQuery(document).delegate( '.suggestionTag', 'click', function(event){
		jQuery('#tagForm')
			.find('input')
			.val(jQuery(this).text())
			.end()
			.submit();
	});
}

FLICKR_MASONRY.setupAddToFavorites = function(){
	jQuery(document).delegate( '.addToFavorites', 'click', function(event){
		var photoId = jQuery(this).data('photoId');
		FLICKR_MASONRY.addPhotoToFavorites(photoId);
	});
};


FLICKR_MASONRY.addPhotoToFavorites = function(photoId) {
	
	// TODO: need to go through oAuth flow to get an auth token for this post
	jQuery.ajax({
	  type: 'POST',
	  url: 'http://api.flickr.com/services/rest/?method=flickr.favorites.add&format=json&jsoncallback=?',
	  data: { 'api_key' : FLICKR_MASONRY.apiKey, 'photo_id' : photoId },
	  success: function(data, textStatus, jqXHR){
			console.log(data);
		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log('error');
			console.log(errorThrown);
		}
	});
	
};