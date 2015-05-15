angular.module('flickrApp')
.service('utilitiesService', function () {
  return {
    // min and max are inclusive! for example, randomRange(0, 2) will either return 0, 1, or 2.
    randomRange: function(min,max){
    	return Math.round(((max-min) * Math.random()) + min);
    },
    
    debugConsole: function( text, type, trace ){
    	if( typeof console !== "undefined" && console ){
		
    		type = (type) ? type : "log";
		
    		switch( type ){
    			case "log":
    			console.log( text );
    			break;
			
    			case "info":
    			console.info( text );
    			break;
			
    			case "warn":
    			case "debug":
    			console.warn( text );
    			break;
			
    			case "error":
    			console.error( text );
    			break;
			
    			default:
    			console.log( text );
    			break;
			
    		}

    		if( trace ){
    			console.trace();
    		}
		
    	}
    	else{
    		// IE
    	}
    }
  };
});
