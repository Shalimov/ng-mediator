(function (ng) {
  'use strict';

  ng.module('app')
    .controller('ctrl3', ['$scope', '$mediator', function ($scope, $mediator) {
      $mediator.add('ctrl3', function (emit) {
        $scope.click = function () {
          emit('leave', $scope);
        };

        return {
          onEvents: {
            'click': function () {
              console.log('ctrl 3 click');
            },

            'MEDIATOR:EVENT:REMOVE': function () {
              console.log('Remove');
            }
          }
        };
      }, $scope);
    }]);
})(angular);