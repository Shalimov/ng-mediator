(function (ng, Mediator, EventEmitter) {
  'use strict';

  function StorageBuilder() {
    this._storage = {};
  }

  StorageBuilder.prototype.set = function (key, value) {
    this._storage[key] = value;
  };

  StorageBuilder.prototype.get = function (key) {
    return this._storage[key];
  };

  ng.module('is.emitter', [])
    .factory('$emitterFactory', function () {
      return {
        create: function (settings) {
          return new EventEmitter(settings);
        }
      };
    });

  ng.module('is.mediator', ['is.emitter'])
    .provider('$mediator', function () {
      var emitterSettings;
      var mediatorSettings;
      var componentStorages = {};

      this.setEventEmitterSettings = function (settings) {
        emitterSettings = settings;
      };

      this.setMediatorSettings = function (settings) {
        mediatorSettings = settings;
      };

      this.$get = ['$emitterFactory', function ($emitterFactory) {
        var $mediator = new Mediator($emitterFactory.create(emitterSettings), mediatorSettings);

        return {
          add: function (name, register, scope) {
            var self = this;
            var storage = componentStorages[name] = new StorageBuilder();

            $mediator.addComponent(name, register.bind(storage));

            if (scope && typeof scope.$on === 'function') {
              scope.$on('$destroy', function () {
                self.remove(name);
              });
            }
          },

          remove: function (name) {
            $mediator.removeComponent(name);
            delete componentStorages[name];
          },

          has: function (name) {
            return $mediator.hasComponent(name);
          },

          getStorage: function (name) {
            return componentStorages[name];
          },

          get: function (name) {
            return $mediator.getComponent(name);
          },

          list: function () {
            return $mediator.componentsList();
          }
        };
      }];
    });
})(angular, Mediator, EventEmitter);