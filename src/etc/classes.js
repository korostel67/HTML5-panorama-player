(function(window, pannellum, u){

	"use strict"

	////// Collection prototype ///////
	if( !pannellum.hasOwnProperty('collections') ) pannellum.collections={};
	var Collection = function(){
		var collection = null;
		this.collection = function() { return collection; }();
	}
	Collection.prototype.add = function(itemObject) {}
	Collection.prototype.item = function(itemIndex) {
		if( typeof itemIndex == 'undefined' || typeof this.collection[itemIndex] == 'undefined' ) return null;
		return this.collection[itemIndex];
	}
	Collection.prototype.remove = function(itemIndex) {
		if( typeof itemIndex == 'undefined' || typeof this.collection[itemIndex] == 'undefined' ) return null;
		delete this.collection[itemIndex];
	}
	Collection.prototype.clear = function() {
		this.collection = null;
	}

	////// ArrayCollection prototype ///////
	var ArrayCollection = function(){
		ArrayCollection.superclass.constructor.apply(this, arguments);
		var collection = [];
		this.collection = function() { return collection; }();
		this.length = function() { return collection.length; };
	}
	pannellum.util.extend(ArrayCollection, Collection);

	ArrayCollection.prototype.add = function(itemObject) {
		if(!itemObject) return null;
		this.collection.push(itemObject);
	}
	ArrayCollection.prototype.clear = function() {
		this.collection = [];
	}
	pannellum.collections.arrayCollection = ArrayCollection;

	////// ObjectCollection prototype ///////
	var ObjectCollection = function(){
		ObjectCollection.superclass.constructor.apply(this, arguments);
		var collection = {};
		this.collection = function() { return collection; }();
	}
	pannellum.util.extend(ObjectCollection, Collection);

	ObjectCollection.prototype.add = function(itemIndex, itemObject) {
		if(!itemIndex || !itemObject) return null;
		if( this.collection.hasOwnProperty(itemIndex) ) throw new Error("Can not add the element \"" + itemIndex + "\" into collection. It does exist there.");
		this.collection[itemIndex] = itemObject;
	}
	ObjectCollection.prototype.clear = function() {
		this.collection = {};
	}
	pannellum.collections.objectCollection = ObjectCollection;

	////// Hotspots Collection prototype ///////
	var HotSpotsCollection = function(host, hostContainer){
		HotSpotsCollection.superclass.constructor.apply(this);
		this.host = host;
		this.hostContainer = hostContainer;
		this.container = pannellum.util.domElement.create({
			name : 'div',
			attributes : {
				'className' : 'pnlm-hotspots-container',
				'style': {width:'100%', height:'100%', position:'absolute', top:0, left:0}
			},
		}, this.hostContainer);
	}
	pannellum.util.extend(HotSpotsCollection, pannellum.collections.arrayCollection);

	HotSpotsCollection.prototype.add = function(itemSettings) {
		if(!itemSettings) return false;
		var hs = new pannellum.components.hotSpots[ itemSettings.name ](this, this.container, itemSettings.settings );
		HotSpotsCollection.superclass.add.call(this, hs);
		//hs.create(this.container);
	}
	HotSpotsCollection.prototype.remove = function(itemIndex) {
		if(typeof itemIndex == 'undefined' ) return false;
		HotSpotsCollection.superclass.remove.apply(this, arguments);
		this.container.removeChild( itemIndex );
	}
	HotSpotsCollection.prototype.translate = function(itemIndex, panoPosition) {
		if( typeof itemIndex == 'undefined' || typeof panoPosition == 'undefined' ) return false;
		var hs = this.item(itemIndex);
		if( !hs ) return false;
		var hsPitchSin = Math.sin(hs.config.pitch * Math.PI / 180);
		var hsPitchCos = Math.cos(hs.config.pitch * Math.PI / 180);
		var configPitchSin = Math.sin(panoPosition.pitch * Math.PI / 180);
		var configPitchCos = Math.cos(panoPosition.pitch * Math.PI / 180);
		var yawCos = Math.cos((-hs.config.yaw + panoPosition.yaw) * Math.PI / 180);
		var hfovTan = Math.tan(panoPosition.hfov * Math.PI / 360);
		var z = hsPitchSin * configPitchSin + hsPitchCos * yawCos * configPitchCos;
		if ((hs.config.yaw <= 90 && hs.config.yaw > -90 && z <= 0) ||
		  ((hs.config.yaw > 90 || hs.config.yaw <= -90) && z <= 0)) {
			pannellum.util.domElement.setAttr(hs.container, {'style': {'visibility' : 'hidden'}});
		} else {
			pannellum.util.domElement.setAttr(hs.container, {'style': {'visibility' : 'visible'}});
			// Subpixel rendering doesn't work in Firefox
			// https://bugzilla.mozilla.org/show_bug.cgi?id=739176
			var containerWidth = this.container.clientWidth / (window.devicePixelRatio || 1),
				containerHeight = this.container.clientHeight / (window.devicePixelRatio || 1);
			var tX = (-containerWidth /
				hfovTan * Math.sin((-hs.config.yaw + panoPosition.yaw) * Math.PI / 180) *
				hsPitchCos / z / 2 + containerWidth / 2 - 13),
				tY = (-containerWidth / hfovTan * (hsPitchSin *
				configPitchCos - hsPitchCos * yawCos * configPitchSin) / z / 2 +
				containerHeight / 2 - 13);
			hs.translate({x:tX, y:tY});
		}
	}
	HotSpotsCollection.prototype.show = function() {
		pannellum.util.domElement.show(this.container);
	}
	HotSpotsCollection.prototype.hide = function() {
		pannellum.util.domElement.hide(this.container);
	}
	HotSpotsCollection.prototype.resize = function() {
		var pixelRatio = window.devicePixelRatio || 1;
		this.container.width = this.container.clientWidth * pixelRatio;
		this.container.height = this.container.clientHeight * pixelRatio;
	}
	//Clears the collection of hs instances and the container
	HotSpotsCollection.prototype.clear = function() {
		this.container.innerHTML = "";
		HotSpotsCollection.superclass.clear.call(this);
	}
	//Clears the collection of hs instances, the container and then removes the container
	HotSpotsCollection.prototype.destroy = function() {
		this.clear();
		this.hostContainer.removeChild(this.container);
	}
	pannellum.collections.hotSpotsCollection = HotSpotsCollection;

/////// Component Base Class ///////
	if( !pannellum.hasOwnProperty("components") ) pannellum.components={};

	var Component = function(host, hostContainer, config){
		this.name = "Component";
		this.type = "component";
		this.host = host;
		this.hostContainer = hostContainer;
		this.container = pannellum.util.domElement.create({ name : "div", attributes : {"display":"none","className": "pnlm-component"}}, this.hostContainer);
		this.config = {};
		this.state = function() {
			var locked = false;
			return {
				lock : function() { locked = true; },
				unlock : function() { locked = false; },
				locked : function() { return locked; }
			}
		}();
	}
	Component.prototype.checkConfig = function(config, dataTypes){
		if( config && typeof config == "object" &&  dataTypes && typeof dataTypes == "object" ) {
			for(var ci in dataTypes) {
				if( !dataTypes.hasOwnProperty( ci ) ) continue;
				var value = (typeof config[ci] != "undefined") ? config[ci] : undefined
				this.config[ci] = dataTypes[ci].check( value );
			}
		}
	}
	Component.prototype.show = function(){
		pannellum.util.domElement.show(this.container);
	}
	Component.prototype.hide = function(){
		pannellum.util.domElement.hide(this.container);
	}
	Component.prototype.disable = function(){
		this.hostContainer.removeChild(this.container);
	}
	Component.prototype.update = function(prop){}

	pannellum.components.component = Component;

/////// Control Base Class ///////
	if( !pannellum.components.hasOwnProperty("controls") ) pannellum.components.controls = {};

	var Control = function(host, hostContainer, config){
		Control.superclass.constructor.apply(this, arguments);
		this.name = "Control";
		this.type = "control";
		pannellum.util.domElement.setAttr(this.container, { 'className' : ((this.container.className) ? this.container.className + ' ' : '') + 'pnlm-control'});
	}
	pannellum.util.extend(Control, pannellum.components.component);
	pannellum.components.controls.control = Control;

/////// Module Base Class ///////
	if( !pannellum.components.hasOwnProperty("modules") ) pannellum.components.modules={};
	var Module = function(host, hostContainer, config){
		Module.superclass.constructor.apply(this, arguments);
		this.name = "Module";
		this.type = "module";
		pannellum.util.domElement.setAttr(this.container, { 'className' : ((this.container.className) ? this.container.className + ' ' : '') + 'pnlm-module'});
	}
	pannellum.util.extend(Module, pannellum.components.component);
	pannellum.components.modules.module = Module;

/////// HotSpot Base Class ///////
	if( !pannellum.components.hasOwnProperty("hotSpots") ) pannellum.components.hotSpots={};
	var HotSpot = function(host, hostContainer, config){
		HotSpot.superclass.constructor.apply(this, arguments);
		this.type = "hotSpot";
		this.name = "HotSpot";
		var dataTypes = {
			yaw : pannellum.dataTypes.dtNumber({ min: -360, max: 360, default: 0 }),
			pitch : pannellum.dataTypes.dtNumber({ min: -85, max: 85, default: 0 }),
			info : pannellum.dataTypes.dtString({ min: 0, max: 30, strict: false }),
			sceneId : pannellum.dataTypes.dtString({ min: 10, max: 30, strict: false }),
			targetYaw :  pannellum.dataTypes.dtString({ min: 10, max: 30, pattern: /^(-?[0-9]*)$|^same$|^sameAzimuth$/, default: "0" }),
			targetPitch :  pannellum.dataTypes.dtString({ min: 10, max: 30, pattern: /^(-?[0-9]*)$|^same$/, default: "0" }),
		}
		this.checkConfig(config, dataTypes);
		pannellum.util.domElement.setAttr(this.container, { 'className' : ((this.container.className) ? this.container.className + ' ' : '') + 'pnlm-hotspot pnlm-tooltip pnlm-sprite' });
		var span = pannellum.util.domElement.create({ name : 'span' });
		if (this.config.info) pannellum.util.domElement.setContent( span, pannellum.util.escapeHTML(this.config.info) );
		this.container.appendChild(span);
		pannellum.util.domElement.setAttr(span, {'style': {
			'width' : span.scrollWidth - 20 + 'px',
			'marginLeft' : -(span.scrollWidth - 26) / 2 + 'px',
			'marginTop' : -span.scrollHeight - 12 + 'px'
		}});

		/*
		pannellum.eventBus.addEventListener("host_locked", function(event) {
			This.hotspotState.lock();
		}, This);
		pannellum.eventBus.addEventListener("host_locked", function(event) {
			This.hotspotState.unlock();
		}, This);
		pannellum.eventBus.addEventListener("panorama_to_load", function(event) {
			if( event.dispatcher = This ) This.hotspotState.lock();
		}, This);
		*/
	}

	pannellum.util.extend(HotSpot, pannellum.components.component);

	HotSpot.prototype.create = function(container) {
		this.container = pannellum.util.domElement.create({
			name : 'div',
			attributes : {'className': 'pnlm-hotspot pnlm-tooltip pnlm-sprite pnlm-' + pannellum.util.escapeHTML(this.config.type) }
		}, container);
		var span = pannellum.util.domElement.create({ name : 'span' });
		if (this.config.info) pannellum.util.domElement.setContent( span, pannellum.util.escapeHTML(this.config.info) );
		this.container.appendChild(span);
		pannellum.util.domElement.setAttr(span, {'style': {
			'width' : span.scrollWidth - 20 + 'px',
			'marginLeft' : -(span.scrollWidth - 26) / 2 + 'px',
			'marginTop' : -span.scrollHeight - 12 + 'px'
		}});
		return this.container;
	}
	HotSpot.prototype.destroy = function() {
		this.container.removeChild( this.container );
		this.container = undefined;
	}
	HotSpot.prototype.translate = function(position) {
		var transform = 'translate(' + position.x + 'px, ' + position.y + 'px) translateZ(9999px)';
		pannellum.util.domElement.setAttr(this.container, {'style': {'webkitTransform' : transform}});
		pannellum.util.domElement.setAttr(this.container, {'style': {'MozTransform' : transform}});
		pannellum.util.domElement.setAttr(this.container, {'style': {'transform' : transform}});
	}
	pannellum.components.hotSpots.hotSpot = HotSpot;

/////////////Module Content Box/////////////////

	if( !pannellum.components.modules.hasOwnProperty("module") ) throw new Error("pannellum.components.modules.module class is undefined");

	var ContentBox = function(host, hostContainer, config) {
		ContentBox.superclass.constructor.apply(this, arguments);
		this.name = 'ContentBox';
		this.container.classList.add('pnlm-content-box');
		this.fields = {}
	}
	pannellum.util.extend(ContentBox, pannellum.components.modules.module);

	ContentBox.prototype.addFields = function(fields, container){
		/*
		fields format
		[
			["field_1", { name : 'div', attributes : {'className': '...'}, content: "..." }],
			['field_2", { name : 'span', attributes : {'className': '...'} }],
		]
		 */
		if( !fields ) return false;
		if( !container ) container = this.container;
		var i, fieldsLength = fields.length, fieldSettings;
		for( i=0; i<fieldsLength; i++) {
			fieldSettings = pannellum.util.getSettings( fields[i] );
			if( fieldSettings === null || this.fields.hasOwnProperty( fieldSettings.name ) ) continue;
			if( !fieldSettings.settings ) fieldSettings.settings = { name : 'span', attributes : {'className': 'content-box-field'} }
			this.fields[ fieldSettings.name ] = pannellum.util.domElement.create( fieldSettings.settings, container);
		}
	}

	ContentBox.prototype.show = function(){
		this.container.style.display = 'table';
	}

	ContentBox.prototype.update = function(fields){
		if( !fields ) return false;
		var field;
		for( field in fields ) {
			if( !fields.hasOwnProperty( field ) || !this.fields.hasOwnProperty( field ) ) continue;
			this.fields[ field ].innerHTML = fields[ field ];
		}
	}
	pannellum.components.modules.contentBox = ContentBox;

	/////////////Module Error Message/////////////////

	var ErrorMessage = function(host, hostContainer, config) {
		ErrorMessage.superclass.constructor.apply(this, arguments);
		var This = this;
		this.name = 'ErrorMessage';
		this.container.classList.add('pnlm-error-message');
		this.wrapper = pannellum.util.domElement.create({ name : "div", attributes : {"className": "error-message-wrap"}}, this.container);

		This.addFields([
			["name", { name : 'div', attributes : {'className': 'error-message-name'} }],
			["message", { name : 'div', attributes : {'className': 'error-message-message'} }],
		], This.wrapper);
		This.hide();
	}
	pannellum.util.extend(ErrorMessage, pannellum.components.modules.contentBox);
	pannellum.components.modules.errorMessage = ErrorMessage;


		/* ========
		Error handling
		======== */

		if( !pannellum.hasOwnProperty("customErrors") ) pannellum.customErrors = {}

		// Common class
		function CustomError(message) {
		  CustomError.superclass.constructor.call(this, message);
		  this.name = "CustomError";
		  this.message = message;
		  if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		  } else {
			this.stack = (new Error()).stack;
		  }
		}
		pannellum.util.extend(CustomError, Error);

		// File not found - 404
		function NotFoundError(message) {
		  NotFoundError.superclass.constructor.call(this, message);
		  this.name = "NotFoundError";
		  this.message = "One of the files could not be loaded. " + message;
		}
		pannellum.util.extend(NotFoundError, CustomError);
		pannellum.customErrors.notFoundError = NotFoundError;

		// The request has failed
		function RequestError(message) {
		  RequestError.superclass.constructor.call(this, message);
		  this.name = "RequestError";
		  this.message = "The request has failed. " + message;
		}
		pannellum.util.extend(RequestError, CustomError);
		pannellum.customErrors.requestError = RequestError;

		// DataTypeError
		function DataTypeError(message) {
		  DataTypeError.superclass.constructor.call(this, message);
		  this.name = "DataTypeError";
		  this.message = "Data Type Error in settings. " + message;
		}
		pannellum.util.extend(DataTypeError, CustomError);
		pannellum.customErrors.dataTypeError = DataTypeError;

		// CompatiblityError browser technology support issues
		function CompatiblityError(message) {
		  CompatiblityError.superclass.constructor.call(this, message);
		  this.name = "CompatiblityError";
		  this.message = "Compatiblity Error. " + message;
		}
		pannellum.util.extend(CompatiblityError, CustomError);
		pannellum.customErrors.compatiblityError = CompatiblityError;

		/* Example
		// Common class
		function CustomError(message) {
		  this.name = "CustomError";
		  this.message = message;
		  if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		  } else {
			this.stack = (new Error()).stack;
		  }
		}

		CustomError.prototype = Object.create(Error.prototype);
		CustomError.prototype.constructor = CustomError;

		// ���������
		function PropertyError(property) {
		  CustomError.call(this, "����������� �������� " + property)
		  this.name = "PropertyError";

		  this.property = property;
		}

		PropertyError.prototype = Object.create(CustomError.prototype);
		PropertyError.prototype.constructor = PropertyError;

		// � ��� �������
		function PropertyRequiredError(property) {
		  PropertyError.call(this, property);
		  this.name = 'PropertyRequiredError';
		  this.message = '����������� �������� ' + property;
		}

		PropertyRequiredError.prototype = Object.create(PropertyError.prototype);
		PropertyRequiredError.prototype.constructor = PropertyRequiredError;

		// �������������
		var err = new PropertyRequiredError("age");
		// ������� ��������
		alert( err instanceof PropertyRequiredError ); // true
		alert( err instanceof PropertyError ); // true
		alert( err instanceof CustomError ); // true
		alert( err instanceof Error ); // true
		 */

	// Animator
	//================================

	var Animator = function() {
		var instance;
		var animator = function(){
			var cPanorama = null, cInteraction = null, cIPriority=0;
			var start = function(interaction, panorama) {
				cInteraction = interaction;
				cPanorama = panorama;
				cIPriority = ( iPriorities.hasOwnProperty(cInteraction.name) ) ? iPriorities[cInteraction.name] : 0;
				animate();
			};
			var stop = function() {
				if(cInteraction!=null) cInteraction.stop();
				cInteraction = null;
				cPanorama = null;
				cIPriority=0;
			};
			var animate = function() {
				if(cInteraction==null && cPanorama==null) return false;
				var pos=cInteraction.position( {yaw:cPanorama.config.yaw, pitch:cPanorama.config.pitch, hfov:cPanorama.config.hfov} );
				if(pos == null) {
					stop();
					console.log('animator.stop');
					return false;
				}

				cPanorama.setYaw(pos.yaw);
				cPanorama.setPitch(pos.pitch);
				cPanorama.setHfov(pos.hfov);

				cPanorama.render();
				requestAnimationFrame(animate);
			};
			var iPriorities = {
				'AutoInteraction':0,
				'MouseWheelInteraction':1,
				'KeyInteraction':1,
				'MouseInteraction':2,
				'TouchInteraction':2,
			};
			return {
				start :	function(interaction, panorama) { start(interaction, panorama) },
				stop :	stop,
				getInteraction : function() { return cInteraction; },
				//This method allows to deside if the new interaction can interrapt the current one.
				//The new interaction can start working if it's priority is higher then current's
				//and if current interaction still exists in animator but not interacting.
				//In case the type of new interaction is the same type as current the method returns false
				//wich means the current interaction could not be interrapted, but updated with new data.
				interactionPriority : function(intName) {
					if( !iPriorities.hasOwnProperty(intName) ) return false;
					if( iPriorities[intName] > cIPriority ) return true;
					// If interaction object exists in the animator, but not interacting:
					if( cInteraction != null && cInteraction.state.interacting === false ) {
						if(cInteraction.name != intName) {
							//current interaction could be interrapted
							return true;
						}else{
							//current interaction could not be interrapted, but updated with new data
							return false;
						}
					}
					return false;
				}
			};
		};

		return {
			getInstance: function(){
				if(!instance) instance = animator();
				return instance;
			}
		};
	}();

	pannellum.animator = Animator.getInstance();

}(window, window.pannellum || (window.pannellum={}),undefined));
