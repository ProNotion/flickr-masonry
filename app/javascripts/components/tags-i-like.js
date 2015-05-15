angular.module('flickrApp')
.controller( 'TagsILikeController', function($scope) {
  $scope.tags = "colors fractal grafitti skyline pattern pattern texture cute repetition urban decay spiral mandala nostalgia".split(' ');
  
  $scope.searchTag = function(searchTerm, tag) {
    $scope.$parent.search.term = tag;
    $scope.$parent.tCtrl.tagSearch();
  };
}).directive('tagsILike', function() {
  return {
    restrict: "E",
    templateUrl: "partials/tags-i-like.html"
  };
});
