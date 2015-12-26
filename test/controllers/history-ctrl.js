(function (ng) {
  'use strict';

  ng.module('app')
    .controller('historyCtrl', ['$scope', '$mediator', function ($scope, $mediator) {
      var self = this;

      $mediator.add('history', function () {
        self.history = [];

        return {
          onEvents: {
            'row:selected': function (row) {
              $scope.$applyAsync(function () {
                self.history.push('Selected Element: ' + JSON.stringify(row));
              });
            }
          }
        };
      }, $scope);
    }]);
})(angular);