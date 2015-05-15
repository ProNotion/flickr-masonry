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


App.postRenderOnControllerEmit = function($scope) {
  $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
    App.postPhotosRender();
  });
};

App.postPhotosRender = function() {
  $('[data-toggle="tooltip"]').tooltip();
  
  // sets up the lightbox for images
  (function setupPrettyPhoto() {
  	jQuery("a[rel^='lightbox']").prettyPhoto({
  		overlay_gallery : false,
  		deeplinking: false,
  		social_tools: false
  	});
  })();
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


// App.destroyMasonry = function() {
//   var $container = jQuery('#photosContainer ul');
//   $container.masonry( 'destroy' );
// };
//
//
// FlickrMasonry.runMasonry = function(delay) {
//   var $containers = jQuery('.photosContainer ul');
//
//   setTimeout( function(){
//     $containers.masonry({
//       itemSelector : '.photo',
//       columnWidth : 260,
//       isFitWidth: true
//     });
//   }, delay || 10);
// };
