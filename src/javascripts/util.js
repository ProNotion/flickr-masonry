/* exported randomRange, roundNumber, isMobileDevice */

// min and max are inclusive! for example, randomRange(0, 2) will either return 0, 1, or 2.
function randomRange(min,max){
	return Math.round(((max-min) * Math.random()) + min);
}

/* round a number to a certain number of decimal places */
function roundNumber(num, dec) {
	return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
}


function isMobileDevice(){
	return navigator.userAgent.match(/Android|webOS|iPhone|iPod/i) ? true : false;
}


function debugConsole( text, type, trace ){
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

// parse the query string in your URL to grab certain values
// from here ~~> http://www.netlobo.com/url_query_string_javascript.html
function gup( name ){
  name = name.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  
  if( results === null ){
    return "";
  }  else {
    return results[1];
  }
}

function logAnalytics(valArray){
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

// from Niyaz via http://stackoverflow.com/a/6021027/626369
function updateQueryStringParameter(uri, key, value) {
  var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  var separator = uri.indexOf('?') !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + "=" + value + '$2');
  }
  else {
    return uri + separator + key + "=" + value;
  }
}
