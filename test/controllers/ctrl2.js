(function (ng) {
  'use strict';

  ng.module('app')
    .controller('ctrl2', ['$scope', '$mediator', function ($scope, $mediator) {
      $mediator.add('ctrl2', function () {

        return {
          onEvents: {
            'click': function () {
              console.log($mediator.list());
            },

            'leave': function () {
              console.log('Someone leave');
            }
          }
        };
      }, $scope);
    }]);
})(angular);