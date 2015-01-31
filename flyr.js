

if (Meteor.isClient) {
  var updateTimer = 150;

  famous.polyfills;
  famous.core.famous;
  var Transform = require('famous/core/Transform');
  var StateModifier = require('famous/modifiers/StateModifier');

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

    Meteor.autorun(function() {
      var acc = Session.get('acceleration');
      if(acc) {
        surface.setContent('X: '+acc.x+'<br/>Y:'+acc.y+'</br>Z:'+acc.z);
        
        var baseNudge = 100;
        var baseCenter = (baseNudge / 2);

        stateModifier.setTransform(
          Transform.translate(
            baseCenter-(baseNudge*acc.x), 
            baseCenter-(baseNudge*acc.y), 
            600*acc.z
          ), {
          duration : updateTimer*2, 
          curve: 'easeInOut'//'easeOut'
        });
      }
    });

    return true;
  }

  function setup() {
    console.log(navigator.accelerometer ? 'Found accelerometer. Trying to use.' : 'No accelerometer.');

    var haveData = false;
    function onAccelerationData(acceleration) {
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
        z = Math.round((Math.random()+(9.81 - 0.5))*precision)/precision;

        onAccelerationData({ x: x, y: y, z: z, timestamp: timestamp });
    }
    function simulateAcceleration() {
      console.log('Starting acceleration simulator');
      window.setInterval(generateAcceleration, updateTimer);
    }

    if(navigator.accelerometer) {
      function onError(error) {
        console.log('error '+error.code+': '+error.message+'.');
        simulateAcceleration();
      };

      var options = { frequency: updateTimer };
      var watchID = navigator.accelerometer.watchAcceleration(onAccelerationData, onError, options);
      //navigator.accelerometer.clearWatch(watchID);
    }
    else {
      simulateAcceleration();
    }
  }

  Meteor.startup(function() {
    setup();
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
