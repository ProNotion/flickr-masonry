angular.module('flickrApp')
.directive("credits", ["$timeout", function($timeout) {
  return {
    restrict: "E",
    templateUrl: "partials/credits.html",
    link: function(scope, elem, attrs) {
      $timeout(function() {
        elem.find("footer").removeClass('opacityZero');
      }, 2000);
    }
  };
}]);
