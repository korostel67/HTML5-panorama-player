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
		panoId: pannellum.dataTypes.dtString({ min: 2, max: 30, strict: true, default: null }),
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
	if (this.hostContainer !== undefined) return false;
	if (this.container !== undefined) return false;
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

Panorama.prototype.createHotspots = function() {
	if( !this.config.hasOwnProperty('hotSpots') ) return null;
	var This = this;
	//Prepare HotspotsComponents
	// Then Create HotSpots
	// Sort by pitch so tooltip is never obscured by another hot spot
	this.config.hotSpots = this.config.hotSpots.sort( function(a, b) { return a[1].pitch < b[1].pitch; });
	pannellum.partsLoader.addParts(
		"components.hotSpots",
		this.config.hotSpots
	).then(function(result) {
console.log('loading hotspots');
		if( !This.hotSpotsCollection ) This.hotSpotsCollection = new pannellum.collections.hotSpotsCollection(This, This.container);
		if( !pannellum.components.hasOwnProperty( 'hotSpots' ) ) pannellum.components['hotSpots'] = {}
		var hsLength = This.config.hotSpots.length;
		if( hsLength > 0 ) {
			var hsSettings;
			for( var i=0; i<hsLength; i++ ) {
				hsSettings = pannellum.util.getSettings( This.config.hotSpots[i] );
				if( hsSettings === null ) continue;
				if( !This.hotSpotsCollection.item( hsSettings.name ) && pannellum.components['hotSpots'].hasOwnProperty( hsSettings.name ) ) {
					try{
						This.hotSpotsCollection.add( hsSettings );
					}catch(e){
						pannellum.errorMessage.show( "messageBox", e.name, "Invalid settings in \"set.panoramas." + This.panoId + ".hotSpots[" + i + "]\". " + e.message );
					}
				}
			}
			This.translateHotspots();
		}
	//	This.resize();
	},
	function(msg){
		//If there are errors, do not stop; just warn
		console.log(msg);
	});
}

Panorama.prototype.translateHotspots = function() {
	if( !this.hotSpotsCollection || !this.hotSpotsCollection.length() ) return null;
	var i=0, n=this.hotSpotsCollection.length();
	for(i;i<n;i++) {
		this.hotSpotsCollection.translate(i, {pitch: this.config.pitch, yaw: this.config.yaw, hfov: this.config.hfov});
	}
}
Panorama.prototype.init = function() {
		this.createHotspots();
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
}

/**
 * Sets viewer's horizontal field of view.
 * @private
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

Panorama.prototype.setPitch = function (pitch) {
	if( typeof pitch == 'undefined' ) return false;
	this.config.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, pitch));
}

}(window.pannellum || (window.pannellum={}), document));
