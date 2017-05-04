(function(window, pannellum, u){
	"use strict";

	if( !pannellum.hasOwnProperty("interactions") ) pannellum.interactions={};

/************************************
 * Interaction class
*************************************/
	function Interaction() {
		this.name = 'Interaction';
		this.type = 'interaction';
		this.state  = {latestInteraction:null,speedYaw:0,speedPitch:0,speedZoom:0,speedMin:0.01,speedMax:5,interacting:false};
	}
	Interaction.prototype.start = function(mwData) {return null;}
	Interaction.prototype.stop = function(mwData) {return null;}
	Interaction.prototype.position = function( position ) {return null;}

	pannellum.interactions.interaction = Interaction;

/************************************
 * VirtualInteraction class
 * Extends Interaction class
*************************************/
	function VirtualInteraction() {
		VirtualInteraction.superclass.constructor.apply(this, arguments);
		this.name = 'VirtualInteraction';
		this.type = 'interaction';
		this.getDir = function() {return null;}
	}
	pannellum.util.extend(VirtualInteraction, pannellum.interactions.interaction);
	VirtualInteraction.prototype.start = function() {
		this.state.interacting = true;
	}
	VirtualInteraction.prototype.update = function() {}
	VirtualInteraction.prototype.stop = function() {
		this.state.interacting = false;
	}
	VirtualInteraction.prototype.position = function( position ) {
		//#Get currentDir position
		var prevYaw = position.yaw;
		var prevPitch = position.pitch;
		var prevZoom = position.hfov;
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
		position.yaw += ( this.state.speedYaw * friction + step.yaw ) * diff;
		position.pitch += ( this.state.speedPitch * friction + step.pitch ) * diff;
		position.hfov += ( this.state.speedZoom * friction + step.hfov ) * diff;

		//#Get new speed
		this.state.speedYaw = this.state.speedYaw * friction + (position.yaw - prevYaw) / diff * 0.2;
		this.state.speedPitch = this.state.speedPitch * friction + (position.pitch - prevPitch) / diff * 0.2;
		this.state.speedZoom = this.state.speedZoom * friction + (position.hfov - prevZoom) / diff * 0.2;

		// Limit speed
		this.state.speedYaw = Math.min(this.state.speedMax, Math.max(this.state.speedYaw, -this.state.speedMax) );
		this.state.speedPitch = Math.min(this.state.speedMax, Math.max(this.state.speedPitch, -this.state.speedMax) );
		this.state.speedZoom = Math.min(this.state.speedMax, Math.max(this.state.speedZoom, -this.state.speedMax) );
		return position;
	}
	pannellum.interactions.virtualInteraction = VirtualInteraction;

/************************************
 * MouseWheelInteraction class
 * Extends VirtualInteraction class
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
		this.state.interacting = true;
		//this.clearDir();
		this.dirIndex( this.dirIndex() );
		this.changeDir();
	}
	AutoInteraction.prototype.stop = function() {
		this.state.interacting = false;
		this.clearDir();
	}

	pannellum.interactions.autoInteraction = AutoInteraction;

/************************************
* MouseInteraction class
* Extends Interaction class
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
		this.state.interacting = true;
		this.state.lastPosX = settings.x;
		this.state.lastPosY = settings.y;
		this.state.lastPosYaw = settings.yaw;
		this.state.lastPosPitch = settings.pitch;
		this.state.canvas = {width: settings.canvas.width, height: settings.canvas.height };
		this.state.latestInteraction = pannellum.util.setCurrentTime();
		//container.classList.add('pnlm-grabbing');
		//container.classList.remove('pnlm-grab');
		/*  */
	};
	MouseInteraction.prototype.update = function(pos) {
		this.setPos(pos);
	};
	MouseInteraction.prototype.stop = function() {
		if (pannellum.util.setCurrentTime() - this.state.latestInteraction > 15) {
	        // Prevents jump when user rapidly moves mouse, stops, and then
	        // releases the mouse button
			this.state.interacting = false;
			//this.setPos(null);
	    }
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
		/*
			return null;
				*/
			var prevYaw = position.yaw;
			var prevPitch = position.pitch;
			position.yaw += this.state.speedYaw * friction;
			position.pitch += this.state.speedPitch * friction;

		//#Get new speed
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
* Performes interaction according to instractions accessed by defined keys.
^ Instractions and keys are passed to constructor in object:
cInteraction = new pannellum.interactions.keyInteraction({
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
		this.state.interacting = true;
		this.update( key );
	}
	KeyInteraction.prototype.update = function( key ) {
		this.addDir( key );
	}
	KeyInteraction.prototype.stop = function( key ) {
		this.state.interacting = false;
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
