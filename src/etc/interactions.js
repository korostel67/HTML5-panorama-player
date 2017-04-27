(function(window, pannellum, u){
	"use strict";

	if( !pannellum.hasOwnProperty("interactions") ) pannellum.interactions={};

	function Interaction() {
		this.state  = {latestInteraction:null,speedYaw:0,speedPitch:0,speedZoom:0,speedMin:0.01,speedMax:5,interacting:false};

		this.name = 'Interaction';
		this.type = 'interaction';
	}
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
	Interaction.prototype.position = function( position ) {return null;}

	pannellum.interactions.interaction = Interaction;

}(window, window.pannellum || (window.pannellum={}),undefined));

(function(window, pannellum, u){
	"use strict";

	if( !pannellum.interactions.hasOwnProperty("interaction") ) throw new Error("pannellum.interactions.interaction class is undefined");

	function VirtualInteraction() {
		VirtualInteraction.superclass.constructor.apply(this, arguments);
		this.name = 'VirtualInteraction';
		this.type = 'interaction';
		this.getDir = function() {return null;}
	}
	pannellum.util.extend(VirtualInteraction, pannellum.interactions.interaction);

	VirtualInteraction.prototype.position = function( position ) {
		//Position has panorama currentDir position
		//Rewrite code to update it using commented bloch below
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

}(window, window.pannellum || (window.pannellum={}),undefined));

(function(window, pannellum, u){
	"use strict";

	if( !pannellum.interactions.hasOwnProperty("virtualInteraction") ) throw new Error("pannellum.interactions.virtualInteraction class is undefined");

	function MouseWheelInteraction(settings) {
		MouseWheelInteraction.superclass.constructor.call(this);
		var DirsTmp = [];
		this.factor = ( settings && typeof settings.factor != 'undefined' ) ? settings.factor : 1;
		this.discretion =  ( settings && (typeof settings.discretion != 'undefined' || settings.discretion > 0) ) ? settings.discretion : 1;
		this.name = 'MouseWheelInteraction';
		this.type = 'virtualInteraction';
		var DirsTmp = [];

		this.addDir = function (dir) {
			this.state.latestInteraction = pannellum.util.setCurrentTime();
			DirsTmp.push( dir );
		}
		this.getDir = function () {
			var curdir = DirsTmp.shift();
			console.log(curdir);
			return (curdir) ? curdir: null;
		}
		this.clearDir = function () {
			DirsTmp = [];
		}
	}

	pannellum.util.extend(MouseWheelInteraction, pannellum.interactions.virtualInteraction);

	MouseWheelInteraction.prototype.start = function(mwData) {
		this.state.interacting = true;
		this.clearDir();
		this.update(mwData);
	}

	MouseWheelInteraction.prototype.stop = function() {
		this.state.interacting = false;
		this.clearDir();
	}

	MouseWheelInteraction.prototype.update = function(mwData) {
		this.state.latestInteraction = pannellum.util.setCurrentTime();
		if(this.discretion == 1) {
			this.addDir({zoom:mwData * this.factor});
		}else{
			for(var i=0;i<this.discretion;i++) {
				this.addDir({zoom:mwData/this.discretion * this.factor});
			}
		}
	}
	pannellum.interactions.mouseWheelInteraction = MouseWheelInteraction;

}(window, window.pannellum || (window.pannellum={}),undefined));

(function(window, pannellum, u){
	"use strict";

	if( !pannellum.interactions.hasOwnProperty("virtualInteraction") ) throw new Error("pannellum.interactions.virtualInteraction class is undefined");

	function AutoInteraction(directions) {
		AutoInteraction.superclass.constructor.apply(this, arguments);
		var Dirs = [];
		if( directions instanceof Array ) Dirs = directions;

		var DirIndex=0, CurDir, LastUpdated, DirsLength = Dirs.length, AnimFrame = 1000 / 60;

		this.name = 'AutoInteraction';
		this.type = 'virtualInteraction';

		this.changeDir = function() {
			var dur, _this = this;
			if( LastUpdated ) window.clearTimeout( LastUpdated );
			if( DirIndex > DirsLength-1 ) {
				//#end-instructions The end of instructions
				//console.log('t|changeDir->changeDir->return false');
				CurDir = null;
				_this.stop();
				return false;
			}
			CurDir=Dirs[ DirIndex ];
			DirIndex++;
			dur = ( CurDir.hasOwnProperty('dur') ) ? CurDir.dur : AnimFrame;

			LastUpdated = setTimeout( function() {
				//console.log('t|changeDir->changeDir');
				_this.changeDir();
			}, dur );
		}

		this.addDir = function(dir) {
			Dirs.push(dir);
			DirsLength = Dirs.length;
		}

		this.clearDir = function() {
			Dirs = [];
			DirsLength = Dirs.length;
		}
		this.getDir = function() {
			if( typeof CurDir == 'undefined' ) {
				console.log('animator->getData->getDir->changeDir');
				_this.changeDir();
			}
			console.log( 'animator->getData->getDir->return ' + (DirIndex-1), Dirs );
			return CurDir;
		}

		this.dirIndex = function(index){
			if( typeof index == 'number' ) {
				if( index > DirsLength-1 || index < 0 ) index=0;
				DirIndex = index;
			}
			return DirIndex;
		}
	}

	pannellum.util.extend(AutoInteraction, pannellum.interactions.virtualInteraction);

	AutoInteraction.prototype.start = function() {
		this.state.interacting = true;
		this.dirIndex( this.dirIndex() );
		this.changeDir();
	}
	AutoInteraction.prototype.stop = function() {
		this.state.interacting = false;
	}

	pannellum.interactions.autoInteraction = AutoInteraction;

}(window, window.pannellum || (window.pannellum={}),undefined));

(function(window, pannellum, u){
	"use strict";

	if( !pannellum.interactions.hasOwnProperty("interaction") ) throw new Error("pannellum.interactions.interaction class is undefined");

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

	}(window, window.pannellum || (window.pannellum={}),undefined));

(function(window, pannellum, u){
	"use strict";
	if( !pannellum.interactions.hasOwnProperty("mouseInteraction") ) throw new Error("pannellum.interactions.mouseInteraction class is undefined");
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

}(window, window.pannellum || (window.pannellum={}),undefined));

(function(window, pannellum, u){
	"use strict";

	if( !pannellum.interactions.hasOwnProperty("virtualInteraction") ) throw new Error("pannellum.interactions.virtualInteraction class is undefined");

	function KeyInteraction(settings) {
		KeyInteraction.superclass.constructor.apply(this, arguments);

		var st = 0.3;
		var Dirs = {
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
		var KbKeys = {
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
		};
		if( typeof settings != 'undefined' ) {
			if( typeof settings.directions != 'undefined' && settings.directions instanceof Object ) {
				Object.deepExtend( Dirs, settings.directions );
			}
			if( typeof settings.kbKeys != 'undefined' && settings.kbKeys instanceof Object ) {
				Object.deepExtend( KbKeys, settings.kbKeys );
			}
		}

		var DirsTmp = {};

		function checkCounterDir(d) {
			if( d === null || !Dirs.hasOwnProperty(d) ) return false;
			if( Dirs[d].hasOwnProperty('vector') ) {
				var currentDir = Dirs[d].vector.dir;
				var cDir = currentDir - 180 + ( (currentDir<180)?360:0 );
				if( DirsTmp.hasOwnProperty(cDir) ) return false;
			}
			if( Dirs[d].hasOwnProperty('zoom') ) {
				switch(true) {
					case (d=='zoomIn') : return !DirsTmp.hasOwnProperty('zoomOut'); break;
					case (d=='zoomOut') : return !DirsTmp.hasOwnProperty('zoomIn'); break;
				}
			}
			return true;
		}
		/* Gets average direction of DirsTmp
		 * returns:
		 *  null if DirsTmp is empty
		 *  average direction
		 */
		var getAverage = function() {
			var i = 0, dir, currentDir={vector:{dir:null, step:null},zoom:0}, ar_dir = [], ar_step = [], ar_zoom = [];
			for( dir in DirsTmp ) {
				if( !DirsTmp.hasOwnProperty(dir) ) continue;
				if( DirsTmp[dir].hasOwnProperty('vector') ) {
					ar_dir.push( DirsTmp[dir].vector.dir );
					ar_step.push( DirsTmp[dir].vector.step );
				}
				if( DirsTmp[dir].hasOwnProperty('zoom') ) {
					ar_zoom.push( DirsTmp[dir].zoom );
				}
				i++;
			}
			if( i == 0 ) return null;
			if( i == 1 ) return DirsTmp[dir];
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

		function getInstruction (kbKey) {
			//if( typeof kbKey != 'number') return null;
			var k = kbKey;
			if( !KbKeys.hasOwnProperty(k) ) return null;
			return KbKeys[k];
		}

		this.name = 'KeyInteraction';
		this.type = 'virtualInteraction';

		this.addDir = function (kbKey) {
			//if( typeof kbKey != 'number') return null;
			var d = getInstruction(kbKey);
			if( d === null || !Dirs.hasOwnProperty(d) || DirsTmp.hasOwnProperty(d) || checkCounterDir(d) === false  ) return false;
			this.state.latestInteraction = pannellum.util.setCurrentTime();
			DirsTmp[d] = Dirs[d];
		}
		this.remDir = function (kbKey) {
			//if( typeof kbKey != 'number') return null;
			var d = getInstruction(kbKey);
			if( d === null || !Dirs.hasOwnProperty(d) || !DirsTmp.hasOwnProperty(d) ) return false;
			delete DirsTmp[d];
		}
		this.getDir = function () {
			return getAverage();
		}
	}

	pannellum.util.extend(KeyInteraction, pannellum.interactions.virtualInteraction);

	KeyInteraction.prototype.start = function( kbKey ) {
		this.state.interacting = true;
		return this.addDir( kbKey );
	}
	KeyInteraction.prototype.update = function( kbKey ) {
		return this.addDir( kbKey );
	}
	KeyInteraction.prototype.stop = function( kbKey ) {
		this.state.interacting = false;
		this.remDir( kbKey );
	}

	pannellum.interactions.keyInteraction = KeyInteraction;

}(window, window.pannellum || (window.pannellum={}),undefined));
