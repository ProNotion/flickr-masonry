
var FLICKR_MASONRY = {
	timeSinceLastPhotoGet : null,
	forcePatternAJAXGet : false,
	maxPhotosToRequest : 500,
	flickrPhotos: null,
	photosAtATime: 50,
	photosLoaded: 0,
	loadLocalStorage: function(){
		var milliseconds = localStorage.getItem('flickr_masonry_time_retrieved_at');
		if (milliseconds){
			FLICKR_MASONRY.timeSinceLastPhotoGet = parseInt(milliseconds, 10);
		}
	}
};


jQuery(function(){

	jQuery.fn.center = function () {
		// this.css("position","absolute"); // assume center position
		this.css("top", (($(window).height() - this.outerHeight()) / 2) + $(window).scrollTop() + "px");
		this.css("left", (($(window).width() - this.outerWidth()) / 2) + $(window).scrollLeft() + "px");
		return this;
	};

	FLICKR_MASONRY.originalTitle = jQuery('header .title').text(); // TODO probably somewhere better to do this

	FLICKR_MASONRY.loadLocalStorage();
	getPhotos(); // get the initial photos the first time the page loads
	setupMoreButton();
	setupTagForm();
	
	// experimental
	reflectPlugin();
});

function reflectPlugin(){
	if( location.href.match(/reflect=(1|true)/) ){
		var s = document.createElement('script');
		s.src='/misc/test-jquery-plugins/reflect-images/javascripts/jquery.reflect-images.js'; 
		document.getElementsByTagName('head')[0].appendChild(s);

		s = jQuery('<link/>', {'href' : '/misc/test-jquery-plugins/reflect-images/stylesheets/test.css', 'type' : 'text/css', 'rel' : 'stylesheet' } );
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

function getPhotos(){
	hideCommonElements();
	
	if ( timeForFreshAJAXRequest() ){
		debug_console( 'using ajax call to flickr for photos retrieval', 'debug' );

		// var getURL = 'http://api.flickr.com/services/feeds/photos_faves.gne?id=49782305@N02&format=json&jsoncallback=?';
		var getURL = "http://api.flickr.com/services/rest/?method=flickr.favorites.getPublicList&api_key=79f2e11b6b4e3213f8971bed7f17b4c4&user_id=49782305@N02&extras=url_t,url_s,url_m,url_z,url_l,url_o&per_page="+FLICKR_MASONRY.maxPhotosToRequest+"&format=json&jsoncallback=?";

		jQuery.getJSON( getURL, 
			function(data) { 
				// console.log(data);
				localStorage.setItem('flickr_masonry_time_retrieved_at', new Date().getTime() );
				localStorage.setItem('flickrPhotos', JSON.stringify( data ) );
				FLICKR_MASONRY.flickrPhotos = data;
				displayPhotos(data);
			}
		);
	}
	else{
		console.log( 'using local storage for photos retrieval' );
		FLICKR_MASONRY.flickrPhotos = JSON.parse(localStorage.getItem('flickrPhotos'));	
		displayPhotos(FLICKR_MASONRY.flickrPhotos);
	}
}

function getPhotosByTag(tag){
	var getURL = "http://api.flickr.com/services/rest/?method=flickr.tags.getClusterPhotos";
	getURL += "&tag="+tag;
	getURL += "&cluster_id=&api_key=79f2e11b6b4e3213f8971bed7f17b4c4&extras=url_t,url_s,url_m,url_z,url_l,url_o";
	getURL += "&per_page="+FLICKR_MASONRY.maxPhotosToRequest+"&format=json&jsoncallback=?";

	hideCommonElements();
	
	jQuery.getJSON( getURL, 
		function(data) { 
			// console.log(data);
			// localStorage.setItem('flickr_masonry_time_retrieved_at', new Date().getTime() );
			// localStorage.setItem('flickrPhotos', JSON.stringify( data ) );
			FLICKR_MASONRY.flickrPhotos = data;
			
			//TODO display message if no photos were found with the tag
			if (data.photos.photo.length > 0 ){
				displayPhotos(data, {'taggedPhotos' : true, 'searchedTag' : tag });	
			}
			else{
				// todo - make sure to guard against security vulnerabilities here
				noTaggedImagesResult(tag);
			}
			setupBackToMine();
		}
	);

}

// no images with the user-input tag were found; show something a message and some suggestions
function noTaggedImagesResult(tag){
	var $tagsILikeMarkup = jQuery('<ul class="suggestionTags tagsILike group" />'), 
			tagsILike = "colors fractal grafitti skyline complex pattern texture cute repetition urban decay spiral mandala nostalgia";

	// todo use jQuery.tmpl for this
	jQuery(tagsILike.split(' ')).each(function(item, elem){
		$tagsILikeMarkup.append("<li class='suggestionTag tagsILikeTag'>"+elem+"</li>");
	});
			
	jQuery('#noTagsFound')
		.html('<h3>no photos tagged <span class="bold italic">' + tag + "</span></h3>")
		.append($tagsILikeMarkup)
		.fadeIn();
		
	$tagsILikeMarkup.before("<p>some tags i suggest:</p>");		
			
	delayFooterVisibility();

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


function displayPhotos(jsonData, options){
	
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
											"href" :  getLargestImageSizeAvailable(item), 
											"rel" : "lightbox['flickr']"
											// "data-time": item.date_taken,
											// "data-tags": hyperlinkTags(item.tags) 
											});
		
		newPhoto.src = item.url_s;
		
		jQuery(newPhoto).attr({
				"data-flickr-url" : "http://www.flickr.com/" + item.owner + "/" + item.id + "/lightbox/",
				"data-author-url": hyperlinkAuthorREST(item.owner),
				"data-author-id" : item.owner,
				"data-title": item.title || "[untitled]",
				'alt' : item.title || "[untitled]"
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
				if( options.taggedPhotos ){
					jQuery('#tagLimit').show();
				}
				
				FLICKR_MASONRY.photosLoaded = FLICKR_MASONRY.photosLoaded + FLICKR_MASONRY.photosAtATime;
				delayFooterVisibility();

				// Setup tooltips for each image
				setupImageTooltips();
				// setup pretty photo gallery
				setupPrettyPhoto();
				
				if (options.taggedPhotos){
					updateCredits(options.searchedTag);
				}
				// temp off
				// jQuery('img:even').statick({opacity: 0.06, timing:{baseTime: 140}});
				
			});
			
		});
	});
}


// sometimes the large image size isn't available. fall back onto other versions.
function getLargestImageSizeAvailable(item){
	return item.url_l || item.url_m || item.url_s || item.url_t;
}


function setupImageTooltips(){
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
          url: "http://api.flickr.com/services/rest/?method=flickr.people.getInfo&api_key=79f2e11b6b4e3213f8971bed7f17b4c4&user_id="+userId+"&format=json&jsoncallback=?", 
          type: 'GET', // POST or GET,
          dataType: "json",
          success: function(data, status) {
						// debug_console(data, 'log');
						var realname = fetchRealName(data),
						    username = fetchUserName(data),
						    markup =  "<p class='photoTitle'><a href='"+flickrUrl+"' target='_blank'>" + title + "</a></p>\
										<p>by: <a class='authorName' href='http://www.flickr.com/photos/"+userId+"' target='_blank'>" + username + realname + "</a></p>";

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

// return real name of the photo's owner if it exists
function fetchRealName(data){
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
function fetchUserName(data){
	var username;
	try{
		username = data.person.username._content;
	}
	catch(e){
		username = '';
	}
	return username;
}

function hyperlinkAuthorREST(authorId, authorName){
	return "<a href='http://www.flickr.com/photos/" + authorId + "' target='_blank'>" + authorId + "</a>";
}

function hyperlinkAuthor(authorId, authorName){
	return "<a href='http://www.flickr.com/photos/" + authorId + "' target='_blank'>" + authorName + "</a>";
}

function hyperlinkTags(tags){
	var tagsArray = tags.split(' '),
			linkedTags = [], 
			tag;
	
	for (tag in tagsArray){
    if( tagsArray.hasOwnProperty(tag) ){
      linkedTags.push("<a class='tag' href='http://www.flickr.com/photos/tags/"+tagsArray[tag]+"' target='_blank'>"+tagsArray[tag]+"</span>");
    }
	}
	return linkedTags.join(' ');
}

function setupMoreButton(){
	var $button = jQuery('#moreButton');
	$button.click( function(evt){
		$button.fadeTo(1, 0);
		displayPhotos(FLICKR_MASONRY.flickrPhotos);
	});
}


// only make an ajax call to flickr if it's been over a day
function timeForFreshAJAXRequest(){
	return FLICKR_MASONRY.timeSinceLastPhotoGet === null // if we've never made an ajax call for photos
					|| ((new Date().getTime() - FLICKR_MASONRY.timeSinceLastPhotoGet) / (1000 * 60 * 60 * 24)) > 1  // if the last time we made an ajax call was over a day ago
					|| FLICKR_MASONRY.forcePatternAJAXGet; // or if we want to force an ajax retrieval
}


// sets up the lightbox for images
function setupPrettyPhoto(){
	// debug_console( "setting up prettyPhoto", "debug");
	jQuery("a[rel^='lightbox']").prettyPhoto({
		overlay_gallery : false,
		deeplinking: false,
		social_tools: false,
		changepicturecallback: function(){
			// hide all image tooltips
			jQuery('.flickrFaveItem img').qtip('hide');
		}
	});
}

// don't want the footer showing before other stuff is loaded b/c the reflow looks bad
function delayFooterVisibility(){
	jQuery('#credits').fadeIn(2000);
}

function updateCredits(tag){
	jQuery('#seeTagsName').text(tag);
	jQuery('#seeTagsLink').attr('href', 'http://www.flickr.com/photos/tags/'+tag+'/show/');
	showSimilarTags(tag);
}

function showSimilarTags(tag){
	var getURL = "http://api.flickr.com/services/rest/?method=flickr.tags.getRelated";
	getURL += "&tag="+tag;
	getURL += "&cluster_id=&api_key=79f2e11b6b4e3213f8971bed7f17b4c4";
	getURL += "&format=json&jsoncallback=?";
	
	jQuery.getJSON( getURL, 
		function(data) { 
			// console.log(data);
			try{
				for( var item in data.tags.tag ){
					if( item > 10 ){ break;}
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


function setupTagForm(){
	jQuery('#tagForm').submit( function(event){
		var tag = jQuery(this).find('input').val();
		event.preventDefault();
		clearPhotos();
		updateTitleForTag(tag);
		getPhotosByTag(tag);
	});
	setupPopularTags();
}

function updateTitleForTag(tag){
	jQuery('header .title')
		.html('<a href="http://www.flickr.com" class="stealthLink" target="_blank">flickr</a> photos tagged <a href="http://www.flickr.com/photos/tags/' + tag + '/show/" class="bold italic stealthLink" target="_blank">' + tag + '</span>');
}

// clears existing photos, destroys masonry setup. for use with a completely new set of photos to be loaded in
function clearPhotos(){
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
function hideCommonElements(){
	jQuery('#credits, #moreButton, #tagLimit').hide();
}

// might not be needed.
function showCommonElements(){
	jQuery('#credits, #moreButton').hide();	
}

function setupBackToMine(){
	jQuery('#backToMine').fadeIn()
		.click( function(event){
			clearPhotos();
			jQuery('header .title').text(FLICKR_MASONRY.originalTitle);
			jQuery('#tagForm input').val('');
			getPhotos();
			// setupMoreButton()
		});
}

function setupPopularTags(){
	jQuery(document).delegate( '.suggestionTag', 'click', function(event){
		jQuery('#tagForm')
			.find('input')
			.val(jQuery(this).text())
			.end()
			.submit();
	});
}
