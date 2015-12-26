(function (global) {
  'use strict';

  function checkArgs(str, fn) {
    if (typeof str !== 'string' || typeof fn !== 'function') {
      throw new Error('First param should be a String, Second parameter should be an function');
    }
  }

  var _ = {
    each: function (collection, iterator, ctx) {
      var i, length;

      if (Array.isArray(collection)) {
        for (i = 0, length = collection.length; i < length; i++) {
          if (iterator.call(ctx, collection[i], i, collection) === false) {
            break;
          }
        }
      } else if (typeof collection === 'object') {
        var keys = Object.keys(collection);

        for (i = 0, length = keys.length; i < length; i++) {
          var key = keys[i];
          if (iterator.call(ctx, collection[key], key, collection) === false) {
            break;
          }
        }
      }
    },

    extend: function extend(dest, source) {
      this.each(source, function (val, key) {
        dest[key] = val;
      });
    },

    indexOf: function (collection, iterator) {
      var index = -1;

      this.each(collection, function (val, i, coll) {
        if (iterator(val, i, coll)) {
          index = i;
          return false;
        }
      });

      return index;
    },

    contains: function (str, substr) {
      return !!~str.indexOf(substr);
    },

    arrayCopy: function (array) {
      return Array.prototype.slice.call(array);
    },

    notGroup: function (meta) {
      return meta.group !== this;
    },

    notEvent: function (event) {
      return event !== this;
    }
  };

    function EventEmitter(settings) {
    settings = settings || {};

    this._groups = {};
    this._eventMap = {};
    this._registredListenersCount = 0;
    this._maxListeners = settings.maxListeners || 10;
    this._logger = settings.logger || console.warn.bind(console);
    this._emit = settings.async ? this._emitAsync : this._emitSync;
    this._asyncQueue = settings.async ? [] : null;
  }

  function applyEmit(args) {
    this._emitSync.apply(this, args);
  }

  function timeoutCallback(self) {
    self._asyncQueue.forEach(applyEmit, self);
    self._asyncQueue.length = 0;
  }

  _.extend(EventEmitter.prototype, {
    _emitAsync: function (eventName) {
      if (!this._asyncQueue.length) {
        setTimeout(timeoutCallback, 0, this);
      }

      this._asyncQueue.push(arguments);
    },

    _emitSync: function (eventName) {
      if (this._eventMap[eventName]) {
        var args = Array.prototype.slice.call(arguments, 1);
        var stop = false;
        var eventDescriptor = {
          event: eventName,
          group: null,
          stop: function () {
            stop = true;
          }
        };

        _.each(this._eventMap[eventName], function (meta) {
          eventDescriptor.group = meta.group;
          meta.handler.apply(eventDescriptor, args);
          return !stop;
        }, this);
      }
    },

    _on: function (eventName, handler) {
      checkArgs(eventName, handler);
      var eventMap = this._eventMap;
      var group;

      if (_.contains(eventName, '.')) {
        var splitted = eventName.split('.');
        var groups = this._groups;
        group = splitted[1];
        eventName = splitted[0];

        if (groups[group]) {
          groups[group].push(eventName);
        } else {
          groups[group] = [eventName];
        }
      }

      if (eventMap[eventName]) {
        eventMap[eventName].push({
          group: group,
          handler: handler
        });
      } else {
        eventMap[eventName] = [{
          group: group,
          handler: handler
        }];
      }

      this._registredListenersCount++;

      if (this._registredListenersCount > this._maxListeners && this._logger) {
        this._logger('Potentially memory leak was detected, max listeners count [' + this._maxListeners +
          '], registred [' + this._registredListenersCount + ']'
        );
      }
    },

    _off: function (eventName, handler) {
      var group;

      if (_.contains(eventName, '.')) {
        var splitted = eventName.split('.');
        eventName = splitted[0];
        group = splitted[1];
      }

      if (eventName && group) {
        this._offEventGroup(eventName, group);
      } else if (group) {
        this._offGroup(group);
      } else {
        this._offEvent(eventName, handler);
      }
    },

    _offEventGroup: function (event, group) {
      if (!this._groups[group] || !this._eventMap[event]) return;

      var beforeLength = this._eventMap[event].length;
      this._eventMap[event] = this._eventMap[event].filter(_.notGroup, group);
      var afterLength = this._eventMap[event].length;

      this._groups[group] = this._groups[group].filter(_.notEvent, event);

      this._registredListenersCount -= beforeLength - afterLength;
    },

    _offGroup: function (group) {
      if (!this._groups[group]) return;

      var groupEvents = _.arrayCopy(this._groups[group]);

      _.each(groupEvents, function (event) {
        this._offEventGroup(event, group);
      }, this);

      delete this._groups[group];
    },

    _offEvent: function (event, handler) {
      if (typeof handler === 'function' && this._eventMap[event]) {
        var handlerIndex = _.indexOf(this._eventMap[event], function (meta) {
          return meta.handler === handler;
        });

        if (~handlerIndex) {
          this._eventMap[event].splice(handlerIndex, 1);
        }
        this._registredListenersCount--;
      } else if (this._eventMap[event]) {
        var length = this._eventMap[event].length;

        _.each(this._eventMap[event], function (meta) {
          if (!meta.group) return;

          var group = this._groups[meta.group];
          var eventIndex = group.indexOf(event);

          group.splice(eventIndex, 1);
        }, this);

        this._registredListenersCount -= length;
        delete this._eventMap[event];
      }
    }
  });

  _.extend(EventEmitter.prototype,
        {
            on: function (eventNameList, handler) {
        if (Array.isArray(eventNameList)) {
          _.each(eventNameList, function (event) {
            this._on(event, handler);
          }, this);
        } else {
          this._on(eventNameList, handler);
        }

        return this;
      },

            off: function (eventNameList, handler) {
        if (Array.isArray(eventNameList)) {
          _.each(eventNameList, function (event) {
            this._off(event, handler);
          }, this);
        } else {
          this._off(eventNameList, handler);
        }

        return this;
      },

            many: function (eventNameList, handler, times) {
        var self = this;
        var counter = 0;
        times = times < 1 || typeof times !== 'number' ? 1 : times;

        self.on(eventNameList, decorator);

        function decorator() {
          try {
            handler.apply(this, arguments);
          } finally {
            counter++;
            if (times <= counter) {
              self.off(eventNameList, decorator);
            }
          }
        }

        return self;
      },

            once: function (eventNameList, handler) {
        return this.many(eventNameList, handler, 1);
      },

            emit: function () {
        return this._emit.apply(this, arguments);
      },

            getMaxListeners: function () {
        return this._maxListeners;
      },

            setMaxListeners: function (listenersCount) {
        if (listenersCount > 0) {
          this._maxListeners = listenersCount;
        }
      },

      toString: function () {
        return '[object EventEmitter]';
      }
    });

  _.extend(EventEmitter.prototype, {
    addEventListener: EventEmitter.prototype.on,
    removeEventListener: EventEmitter.prototype.off,
    trigger: EventEmitter.prototype.emit
  });

  if (typeof module !== 'undefined') {
    module.exports = EventEmitter;
  } else if (typeof exports !== 'undefined') {
    exports.EventEmitter = EventEmitter;
  } else {
    global.EventEmitter = EventEmitter;
  }
})(new Function('return this')());
(function (global) {
  'use strict';

    var _ = {
        each: function (collection, iterator, ctx) {
      var i, length;

      if (Array.isArray(collection)) {
        for (i = 0, length = collection.length; i < length; i++) {
          if (iterator.call(ctx, collection[i], i, collection)) {
            break;
          }
        }
      } else if (typeof collection === 'object') {
        var keys = Object.keys(collection);

        for (i = 0, length = keys.length; i < length; i++) {
          var key = keys[i];
          if (iterator.call(ctx, collection[key], key, collection)) {
            break;
          }
        }
      }
    },
        extend: function extend(dest, source) {
      this.each(source, function (val, key) {
        dest[key] = val;
      });
      return dest;
    }
  };

    function Mediator(eventEmitter, settings) {
    settings = _.extend({
      emitHistory: false,
      emitHistoryLength: 0
    }, settings);

    this._eventEmitter = eventEmitter;
    this._components = {};
    this._settings = settings;

    this._emitHistory = settings.emitHistory ? [] : null;
  }

  _.extend(Mediator, {
    EVENTS: {
      ADD: 'mediator:component:add',
      REMOVE: 'mediator:component:remove'
    }
  });

  _.extend(Mediator.prototype,
        {
      _pushEmitHistory: function (component, event) {
        if (this._settings.emitHistory) {
          this._emitHistory.push({
            component: component,
            event: event
          });

          if (this._emitHistory.length > this._settings.emitHistoryLength) {
            this._emitHistory.shift();
          }
        }
      },
            addComponent: function (name, registrator) {
        if (this._components.hasOwnProperty(name)) {
          throw new Error('Component [' + name + '] already exist');
        }

        var meta = registrator(function () {
          if (this.hasComponent(name)) {
            this._eventEmitter.emit.apply(this._eventEmitter, arguments);
            this._pushEmitHistory(name, arguments[0]);
          } else {
            throw new Error('Try to emit event by unregistered component: [' + name + ']');
          }
        }.bind(this));

        if (typeof meta !== 'object') {
          throw new Error('Component: [' + name + '] -> mediator#registrator function should return an object');
        }

        if (meta.hasOwnProperty('onEvents')) {
          _.each(meta.onEvents, function (handler, eventName) {
            this._eventEmitter.on(eventName + '.' + name, handler);
          }, this);

          delete meta.onEvents;
        }

        this._components[name] = meta;
        this._eventEmitter.emit(Mediator.EVENTS.ADD, name, meta);
      },
            removeComponent: function (name) {
        this._eventEmitter.off('.' + name);

        var componentDeleted = delete this._components[name];

        if (componentDeleted) {
          this._eventEmitter.emit(Mediator.EVENTS.REMOVE, name);
        }

        return componentDeleted;
      },
            hasComponent: function (name) {
        return !!this._components[name];
      },
            getComponent: function (name) {
        return this._components[name];
      },
            componentsList: function () {
        return Object.keys(this._components);
      },
            shareResponsibility: function (mediator) {
        if (mediator instanceof Mediator) {
          this._eventEmitter = mediator._eventEmitter;
        }
      },

            toString: function () {
        return '[object Mediator]';
      }
    });

  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = Mediator;
  } else {
    global.Mediator = Mediator;
  }
})(this);
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