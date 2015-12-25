(function (ng) {
  'use strict';

  ng.module('app', ['is.mediator'])
    .config(['$mediatorProvider', function ($mediatorProvider) {
      $mediatorProvider.setEventEmitterSettings({
        async: true,
        maxListeners: 25,
        logger: console.error.bind(console)
      });

      $mediatorProvider.setMediatorSettings({
        emitHistory: true,
        emitHistoryLength: 10
      });
    }]);
})(angular);