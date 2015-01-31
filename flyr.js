

if (Meteor.isClient) {
  var updateTimer = 150;
  var baseNudge = 100;
  var baseCenter = (baseNudge / 2);
  var baseGravity = 9.81;

  famous.polyfills;
  famous.core.famous;
  var Transform = require('famous/core/Transform');
  var StateModifier = require('famous/modifiers/StateModifier');
  var Transitionable = require('famous/transitions/Transitionable');

  function setupFamous() {

    var mainContext = famous.core.Engine.createContext();
    var renderController = new famous.views.RenderController();
    
    var surface = new famous.core.Surface({
      origin: [0.5, 0.5],
      size: [200, 200],
      properties: {
        backgroundColor: "hsl(" + (9 * 360 / 10) + ", 100%, 50%)",
        textAlign: 'center'
      }
    });

    renderController.show(surface);

    var stateModifier = new StateModifier({
      align: [0.5, 0.5],
      origin: [0.5, 0.5]
    });
    mainContext.add(stateModifier).add(surface);

    // var SpringTransition = require('famous/transitions/SpringTransition');
    // var WallTransition = require('famous/transitions/WallTransition');
    // var SnapTransition = require('famous/transitions/SnapTransition');

    // Transitionable.registerMethod('spring', SpringTransition);
    // Transitionable.registerMethod('wall', WallTransition);
    // Transitionable.registerMethod('snap', SnapTransition);

    Meteor.autorun(function() {
      var acc = Session.get('acceleration');
      if(acc) {
        surface.setContent('X: '+acc.x+'<br/>Y:'+acc.y+'</br>Z:'+acc.z);

        stateModifier.setTransform(
          Transform.translate(
            baseCenter-(baseNudge*acc.x), 
            baseCenter-(baseNudge*acc.y), 
            1//600*acc.z
          ), {
          duration : updateTimer*10, 
          curve: 'easeInOut', //'easeOut'
          // method: 'spring',
          // dampingRatio : 0.5, 
          // period : 500
        });

        stateModifier.setTransform(
          Transform.scale(baseGravity/acc.z, baseGravity/acc.z, 1), {
            duration: updateTimer,
            curve: 'easeOut'
          }
        );
      }
    });

    return true;
  }

  function setupWatches() {

    var haveData = false;
    function onAccelerationData(acceleration, source) {
      console.log(source+': '+acceleration.x+':'+acceleration.y+':'+acceleration.z+':'+acceleration.timestamp);
      Session.set('acceleration', acceleration);
      if(!haveData) {
        haveData = setupFamous();
      }
    };

    function generateAcceleration() {
      var precision = 10000;
      var timestamp = (new Date().getTime()), 
        x = Math.round(Math.random()*precision)/precision,
        y = Math.round(Math.random()*precision)/precision,
        z = (Math.round((Math.random()+(baseGravity - 0.5))*precision))/precision;

        onAccelerationData({ x: x, y: y, z: z, timestamp: timestamp }, 'sim');
    }

    function simulateAcceleration() {
      console.log('Starting acceleration simulator');
      window.setInterval(generateAcceleration, updateTimer);
    }

    var dmeHandler = false;
    var doeHandler = false;
    var moeHandler = false;

    function onDeviceError(error) {
      if(doeHandler) {
        window.removeEventListener('deviceorientation', doeHandler);
      }
      if(dmeHandler) {
        window.removeEventListener('deviceMotion', dmeHandler);
      }
      if(moeHandler) {
        window.removeEventListener('MozOrientation', moeHandler);
      }

      console.log('error '+error.code+': '+error.message+'.');
      simulateAcceleration();
    };

    console.log(navigator.gyroscope ? 'Found gyroscope. Trying to use.' : (navigator.accelerometer ? 'Found accelerometer. Trying to use.' : 'No gyroscope or accelerometer driver.'));
    if(navigator.gyroscope) {
      var options = { frequency: updateTimer };
      var watchID = navigator.gyroscope.watchAngularSpeed(onAccelerationData, onDeviceError, options);
      //navigator.gyroscope.clearWatch(watchID);
    }
    else if(navigator.accelerometer) {
      var options = { frequency: updateTimer };
      var watchID = navigator.accelerometer.watchAcceleration(onAccelerationData, onDeviceError, options);
      //navigator.accelerometer.clearWatch(watchID);
    }
    else if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", doeHandler = function () {
        if(event.alpha || event.beta || event.gamma) {
          onAccelerationData({ x: event.beta, y: event.gamma, z: event.alpha }, 'doe');
        }
        else {
          onDeviceError({ code: 'local', message: 'DeviceOrientationEvent available, but no hardware' });
        }
      }, true);
    } else if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', dmeHandler = function () {
        if(event.acceleration && (event.acceleration.x || event.acceleration.y || event.acceleration.y)) {
          onAccelerationData({ x: event.acceleration.x * 2, y: event.acceleration.y * 2, z: event.acceleration.z * 2 }, 'dme');
        }
        else {
          onDeviceError({ code: 'local', message: 'DeviceMotionEvent available, but no hardware' });
        }
      }, true);
    } else if(window.MozOrientationEvent) {
      window.addEventListener("MozOrientation", moeHandler = function () {
        if(orientation && (orientation.x || orientation.y || orientation.z)) {
          onAccelerationData({ x: orientation.x * 50, y: orientation.y * 50, z: orientation.z * 50 }, 'moe');
        }
        else {
          onDeviceError({ code: 'local', message: 'MozOrientationEvent available, but no hardware' });
        }
      }, true);
    }
    else {
      simulateAcceleration();
    }
  }

  Meteor.startup(function() {
    console.log('Meteor is started');
    setupWatches();
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
