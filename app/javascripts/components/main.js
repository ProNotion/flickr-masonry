angular.module('flickrApp')
.controller('MainController', ['$scope', function($scope) {
  $scope.page = "faves";
  
  this.backToMine = function() {
    $scope.page = "faves";
    $scope.$emit('handleEmit', {page: "faves", show: true});
  };
  
  $scope.$on('handleBroadcast', function(event, args) {
    if (args.page) {
      $scope.page = args.page;
    }
    if (args.searchTerm) {
      $scope.searchTerm = args.searchTerm;
    }
  });
}]);
