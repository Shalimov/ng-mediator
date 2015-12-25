(function (ng) {
  'use strict';

  ng.module('app')
    .controller('ctrl', ['$scope', '$mediator', function ($scope) {
      $scope.tctrl1 = true;
      $scope.tctrl2 = true;
      $scope.tctrl3 = true;

      $scope.toggle = function (prop) {
        this[prop] = !this[prop];
      };
    }]);
})(angular);