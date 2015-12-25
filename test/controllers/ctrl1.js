(function (ng) {
  'use strict';

  ng.module('app')
    .controller('ctrl1', ['$scope', '$mediator', function ($scope, $mediator) {
      $mediator.add('ctrl1', function (emit) {
        $scope.click = function () {
          emit('click', $scope);
        };

        return {
          onEvents: {
            'click': function () {
              console.log('ctrl 1 click');
            }
          }
        };
      }, $scope);
    }]);
})(angular);