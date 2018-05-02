(function(window, pannellum, u){
	"use strict";

	if( !pannellum.hasOwnProperty("interactions") ) pannellum.interactions={};

/************************************
 * Interaction class
 ^ This is a base class for all kind of interactions could occure during panorama playing. The main job of interactions is to transform data obtained somehow from user actions into new panorama position. Interaction can not change panorama position directly. It can only pass the new panorama position to animator class which is responsible for panorama position update.
 Here presented two kind of instruction subclasses. One can obtain data directly from user input (such as mouse position). The second - virtual interaction - which are using predefined data sets to controll panorama position. They can not get data from user input such as mouse position (for ex. key press or arbitrary panorama animations).
 Interactions work together with animator class. The former creates new panorama position the latter puts it to panorama and makes rendering.
*************************************/
	function Interaction() {
		this.name = 'Interaction';
		this.type = 'interaction';
		this.state  = {
			latestInteraction:	null,
			speedYaw:			0,
			speedPitch:		0,
			speedZoom:		0,
			speedMin:			0.01,
			speedMax:			5,
			interacting:	false
		};
	}
	Interaction.prototype.start = function() {
		this.state.interacting = true;
	}
	Interaction.prototype.stop = function() {
		this.state.interacting = false;
	}
	Interaction.prototype.update = function() {return null;}

	//Returns new panorama position
	Interaction.prototype.position = function() {return null;}

	pannellum.interactions.interaction = Interaction;

/************************************
 * VirtualInteraction class
 * Extends Interaction class
 * This is a base class for classes which are using special instructions to set panorama position.
 * It helps to create interactions which can not obtain data from user unput, such as key press.
 * Such interactions need predefined set of instructions to be processed and converted to panorama
 * position: zoom and vector. Opposed to these kind of instructions are for example mouse interactions
 * where data can be obtained right from the mouse position and converted to panorama position.
*************************************/
	function VirtualInteraction() {
		VirtualInteraction.superclass.constructor.apply(this, arguments);
		this.name = 'VirtualInteraction';
		this.type = 'interaction';
		this.getDir = function() {return null;}
	}
	pannellum.util.extend(VirtualInteraction, pannellum.interactions.interaction);

	VirtualInteraction.prototype.position = function( position ) {
		//#Get currentDir position
		var prevYaw = position.yaw || 0;
		var prevPitch = position.pitch || 0;
		var prevZoom = position.hfov || 0;
		//#Get currentDir time
		var newTime = pannellum.util.setCurrentTime();
		//#Get currentDir latestInteraction (time)
		//#Get currentDir hfov correction
		var diff = ( newTime - this.state.latestInteraction ) * position.hfov / 1700;
		diff = Math.min(diff, 1.0);
		var step = {yaw:0, pitch:0, hfov:0, incr:0.2};
		var friction = 0.8;
		var currentDir = this.getDir();

		if( currentDir !== null) {
			if( currentDir.hasOwnProperty('vector') ) {
				step.incr = currentDir.vector.step;
				step.yaw = pannellum.util.mathD.sin(currentDir.vector.dir)*step.incr;
				step.pitch = pannellum.util.mathD.cos(currentDir.vector.dir)*step.incr;
			}
			if( currentDir.hasOwnProperty('zoom') ) {
				step.hfov = -currentDir.zoom;
			}
		}else{
			if( Math.abs(this.state.speedYaw) < this.state.speedMin &&
				Math.abs(this.state.speedPitch) < this.state.speedMin &&
				Math.abs(this.state.speedZoom) < this.state.speedMin ) {
				return null;
			}
		}
		//#Get new yaw and pitch
		var ssyf = this.state.speedYaw * friction,
			sspf = this.state.speedPitch * friction,
			sszf = this.state.speedZoom * friction;
		position.yaw += ( ssyf + step.yaw ) * diff;
		position.pitch += ( sspf + step.pitch ) * diff;
		position.hfov += ( sszf + step.hfov ) * diff;

		//#Get new speed
		this.state.speedYaw = ssyf + ((position.yaw - prevYaw) / diff * 0.2 || 0);
		this.state.speedPitch = sspf + ((position.pitch - prevPitch) / diff * 0.2 || 0);
		this.state.speedZoom = sszf + ((position.hfov - prevZoom) / diff * 0.2 || 0);

		// Limit speed
		this.state.speedYaw = Math.min(this.state.speedMax, Math.max(this.state.speedYaw, -this.state.speedMax) ) || 0;
		this.state.speedPitch = Math.min(this.state.speedMax, Math.max(this.state.speedPitch, -this.state.speedMax) ) || 0;
		this.state.speedZoom = Math.min(this.state.speedMax, Math.max(this.state.speedZoom, -this.state.speedMax) ) || 0;

		return position;
	}
	pannellum.interactions.virtualInteraction = VirtualInteraction;

/************************************
 * MouseWheelInteraction class
 * Extends VirtualInteraction class
 ^ This class was created in order to make mouse wheel zoom interactions smoother.
 ^ Direct convertion of mousewheel data to panorama position makes zooming
 * procedure jumpy due to discrete nature of mouse wheel action.
 * The code was simple:
 * -----------------------
 * Simple example without animator
 * var mwData = getMouseWheelData(event);
 * var cPanorama = getPanoramaByIndex('last');
 * setHfov(cPanorama.config.hfov + mwData/2);
 * cPanorama.render();
 * ----------------------
 * To make the mousewheel interaction smooth we need more data and a bit more
 * logic. The class is based on instructions and is extending virtual
 * interaction. Each mousewheel scroll passes a couple or more zooming
 * instructions to animator, those are executed immediately one by one.
 * The more instructions we pass the thmoother the interaction could be.
 * Zooming in and out are controlled by factor obained from the real mouse
 * weel data.
 * var factor = (getMouseWheelData(event)>0)?1:-1;
 * var directions = [
 *  {zoom:0.1 * factor},
 *  {zoom:0.5 * factor},
 *  {zoom:0.9 * factor}
 * ];
 * TODO: To make this interaction react to mouse position while zooming there could probably be such instructions:
 * // var directions = [
 * // 	{zoom:0.1 * factor, vector:{dir:90 * factor, step:0.1}},
 * // 	{zoom:0.5 * factor, vector:{dir:90 * factor, step:0.3}},
 * // 	{zoom:0.9 * factor, vector:{dir:90 * factor, step:0.5}}
 * // ];
 * //Vector and step could be obtained from the moude position.
*************************************/
	function MouseWheelInteraction() {
		MouseWheelInteraction.superclass.constructor.call(this);
		this.name = 'MouseWheelInteraction';
		this.type = 'virtualInteraction';
		var Directions = [], CurDir;

		this.addDir = function (dir) {
			Directions.push( dir );
		}
		this.getDir = function () {
			CurDir = Directions.shift();
			return ( typeof CurDir != 'undefined' ) ? CurDir : null;
		}
		this.clearDir = function () {
			Directions = [];
		}
	}
	pannellum.util.extend(MouseWheelInteraction, pannellum.interactions.virtualInteraction);

	MouseWheelInteraction.prototype.start = function(directions) {
		MouseWheelInteraction.superclass.start.call(this);
		this.update(directions);
	}
	MouseWheelInteraction.prototype.update = function(directions) {
		this.state.latestInteraction = pannellum.util.setCurrentTime();
		var directionsLength = directions.length;
		if(directionsLength > 0) {
			for(var i=0;i<directionsLength;i++) {
				directions[i].zoom = directions[i].zoom;
				this.addDir(directions[i]);
			}
		}
	}
	MouseWheelInteraction.prototype.stop = function() {
		MouseWheelInteraction.superclass.stop.call(this);
		this.clearDir();
	}
	pannellum.interactions.mouseWheelInteraction = MouseWheelInteraction;

/************************************
 * AutoInteraction class
 * Extends VirtualInteraction class
 Virtual interaction could be used to create autorotation animation. The movement of panorama coulbe predefined by a set of instructions passed to constructor. Each instruction can contain vector, zoom and execution time.

 TODO: Implement another kind of instruction wich will let us move panorama to a special point< for example to a hotspot.
*************************************/
	function AutoInteraction(directions) {
		AutoInteraction.superclass.constructor.apply(this, arguments);
		var Directions = [];
		if( directions instanceof Array ) Directions = directions;
		var DirIndex=0, CurDir, LastUpdated, DirectionsLength = Directions.length, AnimFrame = 1000 / 60;

		this.name = 'AutoInteraction';
		this.type = 'virtualInteraction';

		this.changeDir = function() {
			this.state.latestInteraction = pannellum.util.setCurrentTime();
			var dur, _this = this;
			if( LastUpdated ) window.clearTimeout( LastUpdated );
			if( DirIndex > DirectionsLength-1 ) {
				//#end-instructions The end of instructions
				//console.log('t|changeDir->changeDir->return false');
				CurDir = null;
				this.stop();
				return false;
			}
			CurDir=Directions[ DirIndex ];
			DirIndex++;
			dur = ( CurDir.hasOwnProperty('dur') ) ? CurDir.dur : AnimFrame;
			LastUpdated = setTimeout( function() {
				//console.log('t|changeDir->changeDir');
				_this.changeDir();
			}, dur );
		}
		this.addDir = function(dir) {
			Directions.push( dir );
			DirectionsLength = Directions.length;
		}
		this.getDir = function() {
			if( typeof CurDir == 'undefined' ) {
				this.changeDir();
			}
			return CurDir;
		}
		this.clearDir = function() {
			Directions = [];
			DirectionsLength = Directions.length;
		}
		this.dirIndex = function(index){
			if( typeof index == 'number' ) {
				if( index > DirectionsLength-1 || index < 0 ) index=0;
				DirIndex = index;
			}
			return DirIndex;
		}
	}

	pannellum.util.extend(AutoInteraction, pannellum.interactions.virtualInteraction);

	AutoInteraction.prototype.start = function() {
		AutoInteraction.superclass.start.call(this);
		//this.clearDir();
		this.dirIndex( this.dirIndex() );
		this.changeDir();
	}
	AutoInteraction.prototype.stop = function() {
		AutoInteraction.superclass.stop.call(this);
		//this.clearDir(); //Commented, as it clears all instructions and  interaction can not start again without them.
	}

	pannellum.interactions.autoInteraction = AutoInteraction;

/************************************
* MouseInteraction class
* Extends Interaction class
The class can obtain data from mouse position and convert it to panorama position.
*************************************/
	function MouseInteraction() {
		MouseInteraction.superclass.constructor.apply(this, arguments);
		var CurPos =  null;
		this.name = 'MouseInteraction';
		this.type = 'interaction';
		this.state.interacting = false;
		this.state.lastPosX = 0;
		this.state.lastPosY = 0;
		this.state.lastPosYaw = 0;
		this.state.lastPosPitch = 0;
		this.state.canvas = {width: null, height: null };
		this.setPos = function(pos) {
			CurPos = pos;
		}
		this.getPos = function() {
			return CurPos;
		}
	}
	pannellum.util.extend(MouseInteraction, pannellum.interactions.interaction);

	MouseInteraction.prototype.start = function(settings) {
		MouseInteraction.superclass.start.call(this);
		this.state.latestInteraction = pannellum.util.setCurrentTime();
		this.state.lastPosX = settings.x;
		this.state.lastPosY = settings.y;
		this.state.lastPosYaw = settings.yaw;
		this.state.lastPosPitch = settings.pitch;
		this.state.canvas = {width: settings.canvas.width, height: settings.canvas.height };
	};
	MouseInteraction.prototype.update = function(pos) {
		this.setPos(pos);
	};
	MouseInteraction.prototype.stop = function() {
		MouseInteraction.superclass.stop.call(this);
		// The next is not clear.
		//if (pannellum.util.setCurrentTime() - this.state.latestInteraction > 15) {
			// Prevents jump when user rapidly moves mouse, stops, and then
			// releases the mouse button
			//this.state.interacting = false;
			//this.setPos(null);
	  //}
	};

	MouseInteraction.prototype.position = function( position ) {
		var curPos = this.getPos();
		var canvas = this.state.canvas;
		var friction = 0.8;
		//TODO: This still isn't quite right
		if( this.state.interacting === true  ) {
			var yaw = ((Math.atan(this.state.lastPosX / canvas.width * 2 - 1) - Math.atan(curPos.x / canvas.width * 2 - 1)) * 180 / Math.PI * position.hfov / 90) + this.state.lastPosYaw;
			this.state.speedYaw = (yaw - position.yaw) % 360 * 0.2;
			position.yaw = yaw;
			var vfov = 2 * Math.atan(Math.tan(position.hfov/360*Math.PI) * canvas.height / canvas.width) * 180 / Math.PI;
			var pitch = ((Math.atan(curPos.y / canvas.height * 2 - 1) - Math.atan(this.state.lastPosY / canvas.height * 2 - 1)) * 180 / Math.PI * vfov / 90) + this.state.lastPosPitch;
			this.state.speedPitch = (pitch - position.pitch) * 0.2;
			position.pitch = pitch;
		}else{
			var prevYaw = position.yaw;
			var prevPitch = position.pitch;
			position.yaw += this.state.speedYaw * friction;
			position.pitch += this.state.speedPitch * friction;

			// Get new speed
			this.state.speedYaw = this.state.speedYaw * friction + (position.yaw - prevYaw) * 0.23;
			this.state.speedPitch = this.state.speedPitch * friction + (position.pitch - prevPitch) * 0.23;

			// Limit speed
			this.state.speedYaw = Math.min(this.state.speedMax, Math.max(this.state.speedYaw, -this.state.speedMax) );
			this.state.speedPitch = Math.min(this.state.speedMax, Math.max(this.state.speedPitch, -this.state.speedMax) );

			if( Math.abs(this.state.speedYaw) < this.state.speedMin &&
				Math.abs(this.state.speedPitch) < this.state.speedMin ) {
				this.state.speedYaw = this.state.speedPitch = 0;
				this.state.lastPosX = this.state.lastPosY = this.state.lastPosYaw = this.state.lastPosPitch = 0;
				return null;
			}
		}
		return position;
	}

	pannellum.interactions.mouseInteraction = MouseInteraction;

/************************************
* TouchInteraction class
* Extends MouseInteraction class
*************************************/
	var TouchInteraction = function(viewer, panorama) {
		TouchInteraction.superclass.constructor.apply(this, arguments);
		this.name = 'TouchInteraction';
		this.type = 'mouseInteraction';
		this.state.lastPosDist = 0;
	}
	pannellum.util.extend(TouchInteraction,  pannellum.interactions.mouseInteraction);

	TouchInteraction.prototype.start = function(settings) {
		TouchInteraction.superclass.start.apply(this, arguments);
		if ( settings.hasOwnProperty("x1") && settings.hasOwnProperty("y1") ) {
			this.state.lastPosX += (settings.x1- settings.x) * 0.5;
			this.state.lastPosY += (settings.y1- settings.y) * 0.5;
			this.state.lastPosDist = Math.sqrt((settings.x - settings.x1) * (settings.x - settings.x1) + (settings.y - settings.y1) * (settings.y - settings.y1));
		}
	};
	/*
	TouchInteraction.prototype.update = function(settings) {
		var position = TouchInteraction.superclass.update.apply(this, arguments);
		if ( settings.hasOwnProperty("x1") && settings.hasOwnProperty("y1") ) {
			this.state.lastPosX += (settings.x1- settings.x) * 0.5;
			this.state.lastPosY += (settings.y1- settings.y) * 0.5;
			this.state.lastPosDist = Math.sqrt((settings.x - settings.x1) * (settings.x - settings.x1) + (settings.y - settings.y1) * (settings.y - settings.y1));
		}
	}
	*/
	pannellum.interactions.touchInteraction = TouchInteraction;

/************************************
* KeyInteraction class
* Extends VirtualInteraction class
* Performes interaction according to instractions accessed by defined keys. It is no mettrer how the direction keis are accessed. It could be keyboard key press, click event bound to control component or even timeout event.
^ Instractions and keys are passed to constructor in object:
cInteraction = new pannellum.interactions.keyInteraction({
	//Keys a pair of access key and direction key. There could be more then one access key for one direction key.
	keys:{
		'38': '0',
		'104': '0',
		'105': '45',
		'33': '45',
		'39': '90',
		'102': '90',
		'99': '135',
		'34': '135',
		'40': '180',
		'98': '180',
		'97': '225',
		'35': '225',
		'100': '270',
		'37': '270',
		'103': '315',
		'36': '315',
		'107': 'zoomIn',
		'109': 'zoomOut'
	},
	var st = 0.3;
	directions:{
		//Direction key and corresponding instruction
		'0':	{ vector: {dir:0, step:st} },
		'45':	{ vector: {dir:45, step:st} },
		'90':	{ vector: {dir:90, step:st} },
		'135':	{ vector: {dir:135, step:st} },
		'180':	{ vector: {dir:180, step:st} },
		'225':	{ vector: {dir:225, step:st} },
		'270':	{ vector: {dir:270, step:st} },
		'315':	{ vector: {dir:315, step:st} },
		'zoomIn':	{ zoom: 0.2 },
		'zoomOut':	{ zoom: -0.2 }
	}
});
*************************************/
	function KeyInteraction(settings) {
		KeyInteraction.superclass.constructor.apply(this, arguments);
		var Directions = {};
		var Keys = {};
		var DirectionsTmp = {};
		if( typeof settings != 'undefined' ) {
			if( typeof settings.directions != 'undefined' && settings.directions instanceof Object ) {
				Object.deepExtend( Directions, settings.directions );
			}
			if( typeof settings.keys != 'undefined' && settings.keys instanceof Object ) {
				Object.deepExtend( Keys, settings.keys );
			}
		}

		function checkCounterDir(d) {
			if( d === null || !Directions.hasOwnProperty(d) ) return false;
			if( Directions[d].hasOwnProperty('vector') ) {
				var currentDir = Directions[d].vector.dir;
				var cDir = currentDir - 180 + ( (currentDir<180)?360:0 );
				if( DirectionsTmp.hasOwnProperty(cDir) ) return false;
			}
			if( Directions[d].hasOwnProperty('zoom') ) {
				switch(true) {
					case (d=='zoomIn') : return !DirectionsTmp.hasOwnProperty('zoomOut'); break;
					case (d=='zoomOut') : return !DirectionsTmp.hasOwnProperty('zoomIn'); break;
				}
			}
			return true;
		}
		/* Gets average direction of DirectionsTmp
		 * returns:
		 *  null if DirectionsTmp is empty
		 *  average direction
		 */
		var getAverage = function() {
			var i = 0, dir, currentDir={vector:{dir:null, step:null},zoom:0}, ar_dir = [], ar_step = [], ar_zoom = [];
			for( dir in DirectionsTmp ) {
				if( !DirectionsTmp.hasOwnProperty(dir) ) continue;
				if( DirectionsTmp[dir].hasOwnProperty('vector') ) {
					ar_dir.push( DirectionsTmp[dir].vector.dir );
					ar_step.push( DirectionsTmp[dir].vector.step );
				}
				if( DirectionsTmp[dir].hasOwnProperty('zoom') ) {
					ar_zoom.push( DirectionsTmp[dir].zoom );
				}
				i++;
			}
			if( i == 0 ) return null;
			if( i == 1 ) return DirectionsTmp[dir];
			var dir_avrg = ar_dir.reduce( add, 0) / i;
			var min = Math.min.apply(Math, ar_dir);
			var max = Math.max.apply(Math, ar_dir);
			//If the angle between max and min is more than 180, reverse the average.
			if( max-min > 180 ) dir_avrg += 180;
			currentDir.vector.dir = dir_avrg;
			currentDir.vector.step = ar_step.reduce( add, 0) / i;
			currentDir.zoom = ar_zoom.reduce( add, 0) / i;
			return currentDir;
			function add(a, b) { return a + b; };
		}

		function getDirectionId(key) {
			//if( typeof key != 'number') return null;
			var k = key;
			if( !Keys.hasOwnProperty(k) ) return null;
			return Keys[k];
		}

		this.name = 'KeyInteraction';
		this.type = 'virtualInteraction';

		this.addDir = function (key) {
			//if( typeof key != 'number') return null;
			var d = getDirectionId(key);
			if( d === null || !Directions.hasOwnProperty(d) || DirectionsTmp.hasOwnProperty(d) || checkCounterDir(d) === false  ) return false;
			this.state.latestInteraction = pannellum.util.setCurrentTime();
			DirectionsTmp[d] = Directions[d];
		}
		this.remDir = function (key) {
			//if( typeof key != 'number') return null;
			var d = getDirectionId(key);
			if( d === null || !Directions.hasOwnProperty(d) || !DirectionsTmp.hasOwnProperty(d) ) return false;
			delete DirectionsTmp[d];
		}
		this.getDir = function () {
			return getAverage();
		}
	}

	pannellum.util.extend(KeyInteraction, pannellum.interactions.virtualInteraction);

	KeyInteraction.prototype.start = function( key ) {
		KeyInteraction.superclass.start.call(this);
		this.update( key );
	}
	KeyInteraction.prototype.update = function( key ) {
		this.addDir( key );
	}
	KeyInteraction.prototype.stop = function( key ) {
		KeyInteraction.superclass.stop.call(this);
		this.remDir( key );
	}
	pannellum.interactions.keyInteraction = KeyInteraction;


}(window, window.pannellum || (window.pannellum={}),undefined));


/*
Interaction.prototype.inertia = function(){
	var prevPitch = this.panorama.config.pitch;
	var prevYaw = this.panorama.config.yaw;
	var prevZoom = this.panorama.config.hfov;
	var newTime = pannellum.util.setCurrentTime();
	var diff = ( newTime - this.viewer.viewerState.latestInteraction() ) * this.panorama.config.hfov / 1700;
	diff = Math.min(diff, 1.0);
	if (diff > 0) {
		// "Friction"
		var friction = 0.85;
		this.panorama.config.yaw += this.speed.yaw * diff * friction;
		this.panorama.config.pitch += this.speed.pitch * diff * friction;
		this.panorama.setHfov(this.panorama.config.hfov + this.speed.zoom * diff * friction);

		this.speed.yaw = this.speed.yaw * 0.8 + (this.panorama.config.yaw - prevYaw) / diff * 0.2;
		this.speed.pitch = this.speed.pitch * 0.8 + (this.panorama.config.pitch - prevPitch) / diff * 0.2;
		this.speed.zoom = this.speed.zoom * 0.8 + (this.panorama.config.hfov - prevZoom) / diff * 0.2;
		// Limit speed
		this.speed.yaw = Math.min(this.speed.max, Math.max(this.speed.yaw, -this.speed.max));
		this.speed.pitch = Math.min(this.speed.max, Math.max(this.speed.pitch, -this.speed.max));
		this.speed.zoom = Math.min(this.speed.max, Math.max(this.speed.zoom, -this.speed.max));
	}
}
*/
