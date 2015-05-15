angular.module('flickrApp')
.service('analyticsService', function (utilitiesService) {
  return {
    logAnalytics: function(valArray){
    	try{
    		if( typeof _gaq !== "undefined" ){
    			_gaq.push(valArray);
    			// for debugging
    			if( location.search.indexOf( "analytics=1" ) > 0 ){
    				utilitiesService.debugConsole( 'analytics event:', "debug");
    				utilitiesService.debugConsole( valArray, "debug");
    			}
    		}
    	}catch(e){
    		utilitiesService.debugConsole( 'problem in logAnalytics: ' + e.message, "debug");
    	}
    }
  };
});

// FlickrMasonry.setupAnalytics = function () {
//   jQuery('#seeTagsLink').click( function() {
//     logAnalytics(['_trackEvent', 'view', 'flick masonry see all images with tag', jQuery('#seeTagsName').text() ]);
//   });
//
//   jQuery('.suggestionTag').click( function() {
//     logAnalytics(['_trackEvent', 'view', 'flick masonry click suggested tag', jQuery(this).text() ]);
//   });
// };
