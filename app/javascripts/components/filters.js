angular.module('flickrApp')
.filter('realName', function() {
  return function(input) {
    input = input || {};
    var realName;
    
    try{
      if (input.person.realname._content === undefined) {throw Error('person.realname._content is undefined');}
      realName = "(" + input.person.realname._content + ")";
    } catch(e) {
      realName = "";
    }
    return realName;
  };
})
.filter('userName', function() {
  return function(input) {
    input = input || {};
    var userName;
    
    try{
      if (input.person.username._content === undefined) {throw Error('person.username._content is undefined');}
      userName = "(" + input.person.username._content + ")";
    } catch(e) {
      userName = "";
    }
    return userName;
  };
})
.filter('hyperlinkAuthor', function() {
  return function(input) {
    return input ? "<a href='http://www.flickr.com/photos/" + encodeURIComponent(input) + "' target='_blank'>" + input + "</a>" : "";
  };
})
// sometimes the large image size isn't available. fall back onto other versions.
.filter('largestHREFSizeAvailable', function() {
  return function(photo) {
    return photo.url_l || photo.url_m || photo.url_s || photo.url_t;
  };
});

