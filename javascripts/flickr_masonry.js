var FLICKR_MASONRY = {
	timeSinceLastPhotoGet : null,
	forcePatternAJAXGet : false,
	maxPhotosToRequest : 500,
	flickrPhotos: null,
	photosAtATime: 40,
	photosLoaded: 0
};


jQuery(function(){

	jQuery.fn.center = function () {
		// this.css("position","absolute"); // assume center position
		this.css("top", (($(window).height() - this.outerHeight()) / 2) + $(window).scrollTop() + "px");
		this.css("left", (($(window).width() - this.outerWidth()) / 2) + $(window).scrollLeft() + "px");
		return this;
	}

	loadLocalStorage();
	getPhotos();
	setupMoreButton();
	setupTagForm();
});

function getPhotos(){
		if ( timeForFreshAJAXRequest() ){
			console.log( 'using ajax call to flickr for photos retrieval' );

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
	var getURL = "http://api.flickr.com/services/rest/?method=flickr.tags.getClusterPhotos&tag="+tag+"&cluster_id=&api_key=79f2e11b6b4e3213f8971bed7f17b4c4&extras=url_t,url_s,url_m,url_z,url_l,url_o&per_page="+FLICKR_MASONRY.maxPhotosToRequest+"&format=json&jsoncallback=?";

	jQuery.getJSON( getURL, 
		function(data) { 
			// console.log('got photos for tag: ' + tag );
			console.log(data);
			// localStorage.setItem('flickr_masonry_time_retrieved_at', new Date().getTime() );
			// localStorage.setItem('flickrPhotos', JSON.stringify( data ) );
			FLICKR_MASONRY.flickrPhotos = data;
			
			//TODO display message if no photos were found with the tag
			displayPhotos(data);
		}
	);

}

function displayPhotos(jsonData){
	var $container = jQuery('#flickrFaves ul'),
			// for RSS feed
			// photos = jsonData.items.slice(FLICKR_MASONRY.photosLoaded, FLICKR_MASONRY.photosLoaded + FLICKR_MASONRY.photosAtATime ),
			// for REST API
			photos = jsonData.photos.photo.slice(FLICKR_MASONRY.photosLoaded, FLICKR_MASONRY.photosLoaded + FLICKR_MASONRY.photosAtATime ),
			newPhoto, 
			$listItem, 
			$photoLink,
			$ajaxLoader = jQuery('#loader');

	$ajaxLoader.center().fadeTo(1, 1);
	$container.fadeTo(0, 0);
	
	jQuery.each(photos, function(i, item) {
		
		// if the photo's index is above the quoto per fetch, then return
		if ( i >= FLICKR_MASONRY.photosAtATime ){
			return;
		}
		newPhoto = new Image();
		$listItem = jQuery('<li>', { "class" : "photo" } );

		// for RSS
		// $photoLink = jQuery('<a>', 
		// 								{ "target": "_blank", 
		// 									"class": "flickrFaveItem", 
		// 									"href" :  item.link + "lightbox/", 
		// 									"data-author": hyperlinkAuthor(item.author_id, item.author),
		// 									"data-title": item.title,
		// 									"data-time": item.date_taken,
		// 									"data-tags": hyperlinkTags(item.tags) });
		// 
		// newPhoto.src = item.media.m;
		
		// for REST API
		$photoLink = jQuery('<a>', 
										{ "target": "_blank", 
											"class": "flickrFaveItem", 
											"href" :  item.url_l, 
											"rel" : "lightbox['flickr']"
											// "data-time": item.date_taken,
											// "data-tags": hyperlinkTags(item.tags) 
											});
		
		newPhoto.src = item.url_s;
		
		jQuery(newPhoto).attr({
				"data-flickr-url" : "http://www.flickr.com/" + item.owner + "/" + item.id + "/lightbox/",
				"data-author-url": hyperlinkAuthorREST(item.owner),
				"data-author-id" : item.owner,
				"data-title": item.title	
		});
		
		$photoLink.append(newPhoto);
		$listItem.append($photoLink);
		$container.append($listItem);
	});
	
	// needed for masonry layout to be recalculated properly
	if( FLICKR_MASONRY.photosLoaded > 0 ){
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
	
			$container.fadeTo(750, 1, function(){
				
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
						console.log( e.message );
					}
				});

				// only fade the 'more' button back in if there are still images remaining to be shown
				if ( FLICKR_MASONRY.photosLoaded < FLICKR_MASONRY.flickrPhotos.photos.photo.length ){
					jQuery('#moreButton').fadeTo( 650, 1, 'swing');
				}
				
			});
			
		});

		FLICKR_MASONRY.photosLoaded = FLICKR_MASONRY.photosLoaded + FLICKR_MASONRY.photosAtATime;
		delayFooterVisibility();

		// Setup tooltip for each image
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
										// console.log(data);
										var realname = fetchRealName(data);
										var username = fetchUserName(data);
										var markup =  "<p class='photoTitle'><a href='"+flickrUrl+"' target='_blank'>" + title + "</a></p>\
														<p>by: <a class='authorName' href='http://www.flickr.com/photos/"+userId+"' target='_blank'>" + username + realname + "</a></p>";

									// TODO: don't really like this, try and clean it up
									jQuery(jQuery(this)[0].elements.content[0]).find('.loading').html(markup);
			         }
			      },
					},
					position:{
						my: 'left center',
						at: 'right center',
						viewport: jQuery('#flickrFaves ul')
					},
					show: {
						delay: 470,
						effect: function(offset) {
							jQuery(this).fadeIn(300); // "this" refers to the tooltip
			      }
					},
					hide: { 
						delay: 190,
						fixed: true,  
						effect: function(){
							jQuery(this).fadeOut(289); // "this" refers to the tooltip
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

		setupPrettyPhoto();
		// temp off
		// jQuery('img:even').statick({opacity: 0.06, timing:{baseTime: 140}});
		
		// console.log(photos);
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
			linkedTags = [];
	for (var tag in tagsArray){
		linkedTags.push("<a class='tag' href='http://www.flickr.com/photos/tags/"+tagsArray[tag]+"' target='_blank'>"+tagsArray[tag]+"</span>");
	}
	return linkedTags.join(' ');
}

function setupMoreButton(){
	var $button = jQuery('#moreButton');
	$button.click( function(evt){
		// console.log('more clicked');
		$button.fadeTo(1, 0);
		displayPhotos(FLICKR_MASONRY.flickrPhotos);
	});
}

function loadLocalStorage(){
	var milliseconds = localStorage.getItem('flickr_masonry_time_retrieved_at');
	if (milliseconds){
		FLICKR_MASONRY.timeSinceLastPhotoGet = parseInt(milliseconds, 10);
	}
}

// only make an ajax call to flickr if it's been over a day
function timeForFreshAJAXRequest(){
	return FLICKR_MASONRY.timeSinceLastPhotoGet === null // if we've never made an ajax call for photos
					|| ((new Date().getTime() - FLICKR_MASONRY.timeSinceLastPhotoGet) / (1000 * 60 * 60 * 24)) > 1  // if the last time we made an ajax call was over a day ago
					|| FLICKR_MASONRY.forcePatternAJAXGet // or if we want to force an ajax retrieval
}


// sets up the lightbox for images
function setupPrettyPhoto(){
	debug_console( "setting up prettyPhoto", "debug");
	
	jQuery("a[rel^='lightbox']").prettyPhoto({
		overlay_gallery : false,
		deeplinking: false,
		social_tools: false
	});
}

// don't want the footer showing before other stuff is loaded b/c the reflow looks bad
function delayFooterVisibility(){
	// if this is our first load, then fade in the footer
	if ( FLICKR_MASONRY.photosLoaded === FLICKR_MASONRY.photosAtATime ){
		jQuery('footer').fadeTo(3000, 1);
	}
}

function setupTagForm(){
	jQuery('#tagForm').submit( function(event){
		var tag = jQuery(this).find('input').val();
		event.preventDefault();
		clearPhotos();
		updateTitleForTag(tag);
		getPhotosByTag(tag);
	});
}

function updateTitleForTag(tag){
	jQuery('header .title').html('photos tagged <span class="italic">' + tag + '</span>');
}

// clears existing photos, destroys masonry setup. for use with a completely new set of photos to be loaded in
function clearPhotos(){
	FLICKR_MASONRY.flickrPhotos = null;
	FLICKR_MASONRY.photosLoaded = 0;
	var $container  = jQuery('#flickrFaves ul');
	$container.masonry( 'destroy' ).empty();
}
