/**
 * @fileOverview This file contains classes used by panorama player.
 * @author <a href="mailto:korostel67@gmail.com">Yuri Korostelev</a>
 */

(function(window, pannellum, u){

	"use strict"

	/**
	 * Collection prototype
	 * @namespace
	 */
	if( !pannellum.hasOwnProperty('collections') ) pannellum.collections={};

	/**
	 * Collections base class
   * @class
   */
	var Collection = function(){
		/**
     * The collection
     * @private
     */
		var collection = null;
		this.collection = function() { return collection; }();
	}
	/**
	 * Adds item to collection.
	 * @memberof Collection
	 * @param {Mixed}
	 */
	Collection.prototype.add = function(itemObject) {
		if(!itemObject) return null;
		this.collection.push(itemObject);
	}
	/**
	 * Gets item from collection.
	 * @memberof Collection
	 * @param {number}
	 * @returns {*}
	 */
	Collection.prototype.item = function(itemIndex) {
		if( typeof itemIndex == 'undefined' || typeof this.collection[itemIndex] == 'undefined' ) return null;
		return this.collection[itemIndex];
	}
	/**
	 * Removes item from collection.
	 * @memberof Collection
	 * @param {number}
	 */
	Collection.prototype.remove = function(itemIndex) {
		if( typeof itemIndex == 'undefined' || typeof this.collection[itemIndex] == 'undefined' ) return null;
		delete this.collection[itemIndex];
	}
	/**
	 * Clears the collection.
	 * @memberof Collection
	 */
	Collection.prototype.clear = function() {
		this.collection = null;
	}

	/**
	 * ArrayCollection class. Collection items are kept in array.
   * @class
	 * @extends Collection
   */
	var ArrayCollection = function(){
		ArrayCollection.superclass.constructor.apply(this, arguments);
		var collection = [];
		this.collection = function() { return collection; }();
		this.length = function() { return collection.length; };
	}
	pannellum.util.extend(ArrayCollection, Collection);

	/**
	 * Adds item to collection.
	 * @memberof ArrayCollection
	 * @param {Mixed}
	 */
	ArrayCollection.prototype.add = function(itemObject) {
		if(!itemObject) return null;
		this.collection.push(itemObject);
	}

	/**
	 * Clears collection.
	 * @memberof ArrayCollection
	 */
	ArrayCollection.prototype.clear = function() {
		this.collection = [];
	}

	/** @namespace */
	pannellum.collections.arrayCollection = ArrayCollection;

	/**
	 * ObjectCollection class. Collection items are kept in object.
   * @class
	 * @extends Collection
   */
	var ObjectCollection = function(){
		ObjectCollection.superclass.constructor.apply(this, arguments);
		var collection = {};
		this.collection = function() { return collection; }();
	}
	pannellum.util.extend(ObjectCollection, Collection);

	/**
	 * Adds item to collection.
	 * @memberof ObjectCollection
	 * @param {string|number}
	 * @param {Mixed}
	 */
	ObjectCollection.prototype.add = function(itemIndex, itemObject) {
		if(!itemIndex || !itemObject) return null;
		if( this.collection.hasOwnProperty(itemIndex) ) throw new Error("Can not add the element \"" + itemIndex + "\" into collection. It does exist there.");
		this.collection[itemIndex] = itemObject;
	}

	/**
	 * Clears the collection.
	 * @memberof ObjectCollection
	 */
	ObjectCollection.prototype.clear = function() {
		this.collection = {};
	}

	/** @namespace */
	pannellum.collections.objectCollection = ObjectCollection;

	/**
	 * HotSpotsCollection class.
	 * @description Creates HotSpotsCollection object and HTML container
	 * to display hotSpots.
   * @class
	 * @extends ArrayCollection
   */
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

 /**
 * Creates hotspot instance and adds it to collection and HTML container.
 * @memberof HotSpotsCollection
 * @param {object} HotSpot settings
 */
	HotSpotsCollection.prototype.add = function(itemSettings) {
		if(!itemSettings) return false;
		var hs = new pannellum.components.hotSpots[ itemSettings.name ](this, this.container, itemSettings.settings );
		HotSpotsCollection.superclass.add.call(this, hs);
		//hs.create(this.container);
	}

	 /**
	 * Removes hotspot from collection and HTML container.
	 * @memberof HotSpotsCollection
	 * @param {number}
	 */
	HotSpotsCollection.prototype.remove = function(itemIndex) {
		if(typeof itemIndex == 'undefined' ) return false;
		HotSpotsCollection.superclass.remove.apply(this, arguments);
		this.container.removeChild( itemIndex );
	}

	 /**
	 * Changes hotSpot position according to panorama position.
	 * @memberof HotSpotsCollection
	 * @param {number}
	 * @param {objest}	Current panorama position
	 */
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
		var tX, tY;
		if ((hs.config.yaw <= 90 && hs.config.yaw > -90 && z <= 0) ||
		  ((hs.config.yaw > 90 || hs.config.yaw <= -90) && z <= 0)) {
			hs.hide();
			// Put hotspots off the field view
			tX = -30; tY = -30;
		} else {
			hs.show();
			// Subpixel rendering doesn't work in Firefox
			// https://bugzilla.mozilla.org/show_bug.cgi?id=739176
			var containerWidth = this.container.clientWidth / (window.devicePixelRatio || 1),
				containerHeight = this.container.clientHeight / (window.devicePixelRatio || 1);
			tX = (-containerWidth /
				hfovTan * Math.sin((-hs.config.yaw + panoPosition.yaw) * Math.PI / 180) *
				hsPitchCos / z / 2 + containerWidth / 2 - 13);
			tY = (-containerWidth / hfovTan * (hsPitchSin *
				configPitchCos - hsPitchCos * yawCos * configPitchSin) / z / 2 +
				containerHeight / 2 - 13);
		}
		hs.translate({x:tX, y:tY});
	}

	/**
	* Shows HotSpotsCollection HTML container
	^ @memberof HotSpotsCollection
	*/
	HotSpotsCollection.prototype.show = function() {
		pannellum.util.domElement.show(this.container);
	}

	/**
	* Hides HotSpotsCollection HTML container
	^ @memberof HotSpotsCollection
	*/
	HotSpotsCollection.prototype.hide = function() {
		pannellum.util.domElement.hide(this.container);
	}

	/**
	* Resizes HotSpotsCollection HTML container to fill it's parent container
	^ @memberof HotSpotsCollection
	*/
	HotSpotsCollection.prototype.resize = function() {
		var pixelRatio = window.devicePixelRatio || 1;
		this.container.width = this.container.clientWidth * pixelRatio;
		this.container.height = this.container.clientHeight * pixelRatio;
	}

	/**
	* Clears HotSpotsCollection and HTML container.
	^ @memberof HotSpotsCollection
	*/
	HotSpotsCollection.prototype.clear = function() {
		this.container.innerHTML = "";
		HotSpotsCollection.superclass.clear.call(this);
	}

	/**
	* destroys HotSpotsCollection object and it's HTML container
	^ @memberof HotSpotsCollection
	*/
	HotSpotsCollection.prototype.destroy = function() {
		this.clear();
		this.hostContainer.removeChild(this.container);
	}

	/**@namespace*/
	pannellum.collections.hotSpotsCollection = HotSpotsCollection;

	/**@namespace*/
	if( !pannellum.hasOwnProperty("actions") ) pannellum.actions={};

	/**
	 * Action Base Class
	 * @class
	 ^ @param {object} Configuration
	 * @property {object} host
	 * @property {string} name
	 * @property {string} type - Action type
	 * @property {object} config - Component configuration
	 */
	var Action = function(host, config){
		this.name = "Action";
		this.type = "action";
		this.config = {};
		this.host = host;
	}

	/**
	* Returns the host base path
	* @returns {string}
	^ @memberof Action
	*/
	Action.prototype.getBasePath = function() {
		return this.host.getBasePath();
	}

	/**
	* Runs action base method
	^ @memberof Action
	*/
	Action.prototype.run = function(){}

	/**@namespace*/
	pannellum.actions.action = Action;

	/**@namespace*/
	if( !pannellum.hasOwnProperty("components") ) pannellum.components={};

	/**
	 * Component Base Class
	 * @class
	 ^ @param {HTMLElement} The host
	 ^ @param {HTMLElement} The host container
	 ^ @param {object} Configuration
	 * @property {string} name
	 * @property {string} type - Component type (control, panorama, module, hotspot).
	 * @property {HTMLElement} host - Viever instance
	 * @property {HTMLElement} hostContainer - Host HTML Container where component
	 																					container will be placed
	 * @property {HTMLElement} container - HTML Container for components HTMLElements
	 																			of this type
	 * @property {object} config - Component configuration
	 */
	var Component = function(host, hostContainer, config){
		this.name = "Component";
		this.type = "component";
		this.host = host;
		this.hostContainer = hostContainer;
		this.container = pannellum.util.domElement.create({ name : "div",
			attributes : {"className": "pnlm-component"}},
			this.hostContainer
		);
		this.config = {};
		/** @namespace */
		this.state = function() {
			var locked = false;
			return {
				lock : function() { locked = true; },
				unlock : function() { locked = false; },
				locked : function() { return locked; }
			}
		}();
	}

	/**
	 * Returns host base path.
	 * @returns {string}
 	 * @memberof Component
	 * @public
	 */
	Component.prototype.getBasePath = function() {
    return this.host.getBasePath();
	}

	/**
	* Checks component configuration
	* @memberof Component
	* @param {object} Component configuration object
	* @param {object} Data types apropriate for the component
	*/
	Component.prototype.checkConfig = function(config, dataTypes){
		if( config && typeof config == "object" &&  dataTypes && typeof dataTypes == "object" ) {
			for(var ci in dataTypes) {
				if( !dataTypes.hasOwnProperty( ci ) ) continue;
				var value = (typeof config[ci] != "undefined") ? config[ci] : undefined;
				this.config[ci] = dataTypes[ci].check( value );
			}
		}
	}

	/**
	* Show component HTMLElement
	^ @memberof Component
	*/
	Component.prototype.show = function(){
		pannellum.util.domElement.show(this.container);
	}

	/**
	* Hide component HTMLElement
	^ @memberof Component
	*/
	Component.prototype.hide = function(){
		pannellum.util.domElement.hide(this.container);
	}

	/**
	* Check if component HTMLElement is hidden
	^ @memberof Component
	*/
	Component.prototype.isHidden = function(){
		return pannellum.util.domElement.isHidden(this.container);
	}

	/**
	* Disable component. Removes component HTMLElement container from the host container
	^ @memberof Component
	*/
	Component.prototype.disable = function(){
		this.hostContainer.removeChild(this.container);
	}

	/**
	* Updates component content.
	^ @memberof Component
	*/
	Component.prototype.update = function(prop){}

	/**@namespace*/
	pannellum.components.component = Component;

	if( !pannellum.components.hasOwnProperty("controls") ) pannellum.components.controls = {};

/**
 * Control base Class
 * @class
 ^ @extends pannellum.components.component
 ^ @param {HTMLElement} The host
 ^ @param {HTMLElement} The host container
 ^ @param {object} Configuration
 * @property {string} name
 * @property {string} type - Control type (control). This type will have all the inheritors.
 * @property {HTMLElement} host - Viever instance
 * @property {HTMLElement} hostContainer - Host HTML Container where controls
																					container will be placed
 * @property {HTMLElement} container - HTML Container for controls HTMLElements
 * @property {object} config - Control configuration
 */
	var Control = function(host, hostContainer, config){
		Control.superclass.constructor.apply(this, arguments);
		this.name = "Control";
		this.type = "control";
		pannellum.util.domElement.setAttr(this.container, { 'className' : ((this.container.className) ? this.container.className + ' ' : '') + 'pnlm-control'});
	}
	pannellum.util.extend(Control, pannellum.components.component);
	pannellum.components.controls.control = Control;


	if( !pannellum.components.hasOwnProperty("modules") ) pannellum.components.modules={};

	/**
	 * Module base Class
	 * @class
	 ^ @extends pannellum.components.component
	 ^ @param {HTMLElement} The host
	 ^ @param {HTMLElement} The host container
	 ^ @param {object} Configuration
	 * @property {string} name
	 * @property {string} type - Module type (module). This type will have all the inheritors.
	 * @property {HTMLElement} host - Viever instance
	 * @property {HTMLElement} hostContainer - Host HTML Container where modules
																						container will be placed
	 * @property {HTMLElement} container - HTML Container for modules HTMLElements
	 * @property {object} config - Module configuration
	 */
	var Module = function(host, hostContainer, config){
		Module.superclass.constructor.apply(this, arguments);
		this.name = "Module";
		this.type = "module";
		pannellum.util.domElement.setAttr(this.container, { 'className' : ((this.container.className) ? this.container.className + ' ' : '') + 'pnlm-module'});
	}
	pannellum.util.extend(Module, pannellum.components.component);
	pannellum.components.modules.module = Module;

/////////////Module Content Box/////////////////

	if( !pannellum.components.modules.hasOwnProperty("module") ) throw new Error("pannellum.components.modules.module class is undefined");

	/**
	 * ContentBox module Class
	 * @class
	 ^ @extends pannellum.components.module
	 ^ @param {HTMLElement} The host
	 ^ @param {HTMLElement} The host container
	 ^ @param {object} Configuration
	 * @property {string} name
	 * @property {object} fields - Content fields
	 */
	var ContentBox = function(host, hostContainer, config) {
		ContentBox.superclass.constructor.apply(this, arguments);
		this.name = 'ContentBox';
		this.container.classList.add('pnlm-content-box');
		this.fields = {}
	}
	pannellum.util.extend(ContentBox, pannellum.components.modules.module);

	/**
	* Adds fields to contentBox
	^ @memberof ContentBox
	* @param {array} Array of fields configurations
	* @example
	* [
	* 	["field_1", { name : 'div', attributes : {'className': '...'}, content: "..." }],
	* 	['field_2", { name : 'span', attributes : {'className': '...'} }],
	*]
	* @param {HTMLElement} HTML container Container for fields HTMLElements
	*/
	ContentBox.prototype.addFields = function(fields, container){
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

	/**
	* Shows contentBox
	^ @memberof ContentBox
	*/
	ContentBox.prototype.show = function(){
		this.container.style.display = 'table';
	}

	/**
	* Updates contentBox fields
	^ @memberof ContentBox
	* @param {object}
	*/
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

		// Undefined data errors
		function UndefinedDataError(message) {
		  UndefinedDataError.superclass.constructor.call(this, message);
		  this.name = "UndefinedDataError";
		  this.message = "UndefinedDataError Error. " + message;
		}
		pannellum.util.extend(UndefinedDataError, CustomError);
		pannellum.customErrors.undefinedDataError = UndefinedDataError;

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
				var pos = cInteraction.position({
					yaw:cPanorama.config.yaw,
					pitch:cPanorama.config.pitch,
					hfov:cPanorama.config.hfov
				});

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
			var iPriorities = {};
			return {
				start :	function(interaction, panorama) { start(interaction, panorama) },
				stop :	stop,
				getInteraction : function() { return cInteraction; },
				//This method allows to deside if the new interaction can interrupt the current one.
				//The new interaction can start working if it's priority is higher then current's
				//and if current interaction still exists in animator but not interacting.
				//In case the type of new interaction is the same type as current the method returns false
				//wich means the current interaction could not be interrapted, but updated with new data.
				setInteractionPriority : function(ipr) {
					iPriorities = ipr;
				},
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
