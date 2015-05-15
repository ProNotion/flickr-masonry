angular.module('flickrApp')
.service('localStorageService', function () {
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
