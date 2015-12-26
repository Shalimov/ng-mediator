(function (ng) {
  'use strict';

  ng.module('app')
    .controller('tableCtrl', ['$scope', '$mediator', function ($scope, $mediator) {
      var self = this;

      $mediator.add('table', function (emit) {
        self.rows = [{
          selected: false,
          title: 'Row 1',
          description: 'Row Description 1'
        }];

        self.handlers = {
          select: function (row) {
            self.rows.forEach(function (row) {
              row.selected = false;
            });
            row.selected = true;

            emit('row:selected', row);
          },

          add: function () {
            var random = Math.round((Math.random() * new Date()) / 1000000);
            self.rows.push({
              selected: false,
              title: 'Row ' + random,
              description: 'Row Description ' + random
            });
          },

          remove: function (row) {
            var index = self.rows.indexOf(row);
            self.rows.splice(index, 1);
          }
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