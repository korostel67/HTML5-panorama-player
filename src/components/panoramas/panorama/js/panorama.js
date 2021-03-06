(function(pannellum, document, undefined) {

"use strict";

if( !pannellum.hasOwnProperty("components") ) pannellum.components={};
if( !pannellum.components.hasOwnProperty("panoramas") ) pannellum.components.panoramas={};

////// Panorama prototype ///////
var Panorama = function(host, hostContainer, config){
	Panorama.superclass.constructor.apply(this, arguments);
	this.name = 'Panorama';
	this.type = 'panorama';
	if( !pannellum.dataTypes ) throw new Error("pannellum.dataTypes is undefined");
	var dataTypes = {
		panoId: pannellum.dataTypes.dtString({ min: 1, max: 30, strict: true, default: null }),
		title: pannellum.dataTypes.dtString({ min: 4, max: 30, default: '' }),
		info: pannellum.dataTypes.dtString({ min: 4, max: 255, default: '' }),
		preview : pannellum.dataTypes.dtUrl(),
		yaw : pannellum.dataTypes.dtNumber({ min: -360, max: 360, default: 0 }),
    panorama : pannellum.dataTypes.dtUrl({ strict: true }),
		minYaw: pannellum.dataTypes.dtNumber({ min: -360, max: 0, default: -360 }),
		maxYaw: pannellum.dataTypes.dtNumber({ min: 0, max: 360, default: 360 }),
		pitch : pannellum.dataTypes.dtNumber({ min: -85, max: 85, default: 0 }),
		minPitch : pannellum.dataTypes.dtNumber({ min: -85, max: 0, default: -85 }),
		maxPitch : pannellum.dataTypes.dtNumber({ min: 0, max: 85, default: 85 }),
		hfov : pannellum.dataTypes.dtNumber({ min: 50, max: 120, default: 100 }),
		minHfov : pannellum.dataTypes.dtNumber({ min: 50, max: 100, default: 50 }),
		maxHfov : pannellum.dataTypes.dtNumber({ min: 100, max: 120, default: 120 }),
		haov : pannellum.dataTypes.dtNumber({ min: 100, max: 360, default: 360 }),
		vaov : pannellum.dataTypes.dtNumber({ min: 90, max: 180, default: 180 }),
		vOffset : pannellum.dataTypes.dtNumber({ min: 0, max: 180, default: 0 }),
		northOffset: pannellum.dataTypes.dtNumber({ min: -360, max: 360, default: 0 }),
		hotSpots: pannellum.dataTypes.dtHotSpots({strict:true}),
		transition: pannellum.dataTypes.dtTransitions({strict:false})
	}

	this.checkConfig(config, dataTypes);
	this.panoId = this.config.panoId;
	this.panoImage = undefined;
	this.canvas = undefined;
	this.gl = undefined;
	this.program = undefined;
	this.hotSpotsCollection = undefined;
	pannellum.util.domElement.setAttr(this.container, {
			'className' : this.container.className + ' pnlm-panocontainer',
			'id' : this.panoId,
			'style': {width:'100%', height:'100%'}
	});
	var pixelRatio = window.devicePixelRatio || 1;
	this.canvas = pannellum.util.domElement.create({
		name : 'canvas',
		attributes : {
			'className' : 'pnlm-canvas',
			'id' : 'canvas-' + this.panoId,
			'width' : this.container.clientWidth * pixelRatio,
			'height' : this.container.clientHeight * pixelRatio,
			'style': {width:'100%', height:'100%'}
		}
	}, this.container);

	var This = this;
	if (!this.transition && this.config.transition) {
		pannellum.partsLoader.addParts(
			"actions.transitions." + this.config.transition.name,
			{},
			this.host.getBasePath()
		).then(function(result) {
			This.transition = new pannellum.actions.transitions[This.config.transition.name](This, This.config.transition.settings);
		});
	}

	/**
	* Check if images are loading.
	* @memberof panorama
	* @instance
	* @returns {boolean} Whether or not images are loading.
	*/
	//##?? WebGL, CSS3
	//## CM, MR, EQ, VD
	this.isLoading = function() {
		if (this.gl && this.type == 'multires') {
			//## MR
			for ( var i = 0; i < this.program.currentNodes.length; i++ ) {
				if (!this.program.currentNodes[i].textureLoaded) {
				    return true;
				}
			}
		}
		//##?? CM, EQ, VD
		return false;
	};

	/**
	 * Retrieve panorama's canvas.
	 * @memberof panorama
	 * @instance
	 * @returns {HTMLElement} panorama's canvas.
	 */
	//##?? WebGL, CSS3
	//## CM, MR, EQ, VD
	this.getCanvas = function() {
	    return this.canvas;
	};
}

pannellum.util.extend(Panorama, pannellum.components.component);
pannellum.components.panoramas.panorama = Panorama;


/**
 * Destroy panorama.
 * @memberof panorama
 * @instance
 */
//## WebGL, CSS3
//## CM, MR, EQ, VD
Panorama.prototype.destroy = function() {
	if (this.hostContainer === undefined) return false;
	if (this.container === undefined) return false;
	if (this.canvas !== undefined) this.container.removeChild(this.canvas);
	if (this.world !== undefined) this.container.removeChild(this.world);
	this.hotSpotsCollection.destroy();
	this.hostContainer.removeChild(this.container);
};

/**
 * Resize panorama (call after resizing container).
 * @memberof panorama
 * @instance
 */
//## WebGL, CSS3
//## CM, MR, EQ, VD
Panorama.prototype.resize = function() {
		var pixelRatio = window.devicePixelRatio || 1;
		this.canvas.width = this.canvas.clientWidth * pixelRatio;
		this.canvas.height = this.canvas.clientHeight * pixelRatio;
		if (this.hotSpotsCollection) this.hotSpotsCollection.resize();
		if (this.gl) {
				this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
				//Implemented in equirectangular.js
				//if (imageType != 'multires') {
				//		this.gl.uniform1f(this.program.aspectRatio, this.canvas.width / this.canvas.height);
				//}
		}
};

Panorama.prototype.createHotspots = function(hotSpots) {
	var This = this;
	//Prepare HotspotsComponents
	// Then Create HotSpots
	// Sort by pitch so tooltip is never obscured by another hot spot
	hotSpots = hotSpots.sort( function(a, b) { return a[1].pitch < b[1].pitch; });
	var createHotspots = function (hotSpots) {
		if( !This.hotSpotsCollection ) This.hotSpotsCollection = new pannellum.collections.hotSpotsCollection(This, This.container);
		if( !pannellum.components.hasOwnProperty( 'hotSpots' ) ) pannellum.components['hotSpots'] = {}
		var hsLength = hotSpots.length;
		if( hsLength > 0 ) {
			var hsSettings;
			for( var i=0; i<hsLength; i++ ) {
				hsSettings = pannellum.util.getSettings( hotSpots[i] );
				if( hsSettings === null ) continue;
				if( pannellum.components['hotSpots'].hasOwnProperty( hsSettings.name ) ) {
					try{
						This.hotSpotsCollection.add( hsSettings );
					}catch(e){
						pannellum.errorMessage.show( "messageBox", e.name, "Invalid settings in \"set.panoramas." + This.panoId + ".hotSpots[" + i + "]\". " + e.message );
					}
				}
			}
		}
		pannellum.eventBus.dispatch("HotSpotsCollection:ready", this);
		if( hsLength > 0 ) {
			This.translateHotspots();
		}
	};

	if( pannellum.components.hasOwnProperty( 'hotSpots' ) ) {
		createHotspots(hotSpots);
	}else{
		pannellum.partsLoader.addParts(
			"components.hotSpots",
			hotSpots,
			this.host.getBasePath()
		).then(function(result) {
			createHotspots(hotSpots);
		//	This.resize();
		}, function(msg){
			//If there are errors, do not stop; just warn
			console.log(msg);
		});
	}
}

Panorama.prototype.translateHotspots = function() {
	if( !this.hotSpotsCollection || !this.hotSpotsCollection.length() ) return null;
	var i=0, n=this.hotSpotsCollection.length();
	for(i;i<n;i++) {
		this.hotSpotsCollection.translate(i, {pitch: this.config.pitch, yaw: this.config.yaw, hfov: this.config.hfov});
	}
}
Panorama.prototype.init = function() {
	if( this.config.hasOwnProperty('hotSpots') && this.config.hotSpots.length ) {
		this.createHotspots(this.config.hotSpots);
	}
}
Panorama.prototype.render = function() {
	if (this.config.yaw > 180) {
		this.config.yaw -= 360;
	} else if (this.config.yaw < -180) {
		this.config.yaw += 360;
	}
	// Ensure the yaw is within min and max allowed
	this.config.yaw = Math.max(this.config.minYaw, Math.min(this.config.maxYaw, this.config.yaw));

	// Ensure the calculated pitch is within min and max allowed
	this.config.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, this.config.pitch));
	this.translateHotspots();
	pannellum.eventBus.dispatch("panorama:render", this);
}

/**
 * Sets viewer's horizontal field of view.
 * @public
 * @memberof panorama
 * @param {number} hfov - Desired horizontal field of view in degrees.
 */
Panorama.prototype.setHfov = function (hfov) {
		if( typeof hfov == 'undefined' ) return false;
		// Keep field of view within bounds
		var minHfov = this.config.minHfov;
		if (this.config.type == 'multires' && panorama) {
				minHfov = Math.min(minHfov, this.canvas.width / (this.config.multiRes.cubeResolution / 90 * 0.9));
		}
		if (minHfov >= this.config.maxHfov) {
				// Don't change view if bounds don't make sense
				console.log('HFOV bounds do not make sense (minHfov >= maxHfov).')
				return;
		} if (hfov < minHfov) {
				this.config.hfov = minHfov;
		} else if (hfov > this.config.maxHfov) {
				this.config.hfov = this.config.maxHfov;
		} else {
				this.config.hfov = hfov;
		}
}

/**
 * Gets viewer's horizontal field of view.
 * @public
 * @memberof panorama
 * @returns {number}
 */
Panorama.prototype.getHfov = function () {
		return this.config.hfov;
}

/**
 * Sets panorama's yaw.
 * @public
 * @memberof panorama
 * @param {number} yaw
 */
Panorama.prototype.setYaw = function (yaw) {
	if( typeof yaw == 'undefined' ) return false;
	if (yaw > 180) {
		yaw -= 360;
	} else if (yaw < -180) {
		yaw += 360;
	}
	// Ensure the yaw is within min and max allowed
	this.config.yaw = Math.max(this.config.minYaw, Math.min(this.config.maxYaw, yaw));
}

/**
 * Gets panorama's title.
 * @public
 * @memberof panorama
 * @returns {string}
 */
Panorama.prototype.getTitle = function () {
	return this.config.title;
}

/**
 * Gets viewer's yaw.
 * @public
 * @memberof panorama
 * @returns {number}
 */
Panorama.prototype.getYaw = function () {
	return this.config.yaw;
}

/**
 * Sets panorama's pitch.
 * @public
 * @memberof panorama
 * @param {number} pitch
 */
Panorama.prototype.setPitch = function (pitch) {
	if( typeof pitch == 'undefined' ) return false;
	this.config.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, pitch));
}

/**
 * Gets panorama's pitch.
 * @public
 * @memberof panorama
 * @returns {number}
 */
Panorama.prototype.getPitch = function () {
	return this.config.pitch;
}

/**
 * Sets panorama's north offset.
 * @public
 * @memberof panorama
 * @param {number} pitch
 */
Panorama.prototype.setNorthOffset = function (northOffset) {
	if( typeof northOffset == 'undefined' ) return false;
	this.config.northOffset = northOffset;
}

/**
 * Gets panorama's north offset.
 * @public
 * @memberof panorama
 * @returns {number}
 */
Panorama.prototype.getNorthOffset = function () {
	return this.config.northOffset;
}

}(window.pannellum || (window.pannellum={}), document));
