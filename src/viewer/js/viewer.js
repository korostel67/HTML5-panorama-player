/**
* @fileoverview This is the panorama Viewer class.
*
* @author Yuri Korostelev
* @version 1.0
*/

(function(window, pannellum, u){

	"use strict";

	/**
	 * Creates a new panorama viewer.
	 * @constructor
	 * @param {Object} initialConfig - Inital configuration for viewer.
	 */
	var Viewer = function(InitialConfig) {
		var This = this,
			Config = {
				basePath : pannellum.util.getBasePath(),
				require: { jsonFileExtention : "txt" },
				dataDir: { settings:"/data/settings/",set:"/data/set/",panoramas:"/data/panoramas/"},
				viewer : {},
				//panorama : {},
				settings: {
					viewer : {},
					controls : [],
					modules : [],
					transition : [],
					set : { panoramas : {} }
				},
			},
			Container, RenderContainer, ControlsContainer, ModulesContainer, DragFix,

			// Collections of instances to reuse during viewer work
			PartsCollection = {},
			InteractionsCollection = {},

			ViewerDataTypes, QueryVars, KeysDown=[],
			OnPointerDown = {
				PointerX:0,
				PointerY:0,
				Yaw:0,
				Pitch:0,
				Dist:0
			},
			Speed = {
				yaw:0,
				pitch:0,
				zoom:0,
				max:5
			};

		/**
		 * Keeps the viewers state.
		 *TODO: Revise the class. It is probably not needed any more
		 * @private
		 * @returns {Mixed}
		 */
		var ViewerState = function() {
			var locked = true;
			var interacting = false;
			var latestInteraction = pannellum.util.setCurrentTime();
			var latestKeyInteraction = pannellum.util.setCurrentTime();
			var animating = false;
			var fullscreenActive = false;

			return {
				lock : function() {
					locked = true;
					Container.classList.remove("pnlm-grab");
					pannellum.eventBus.dispatch( "viewer_locked", this);
				},
				unlock : function() {
					locked = false;
					Container.classList.add("pnlm-grab");
					pannellum.eventBus.dispatch( "viewer_unlocked", this);
				},
				locked : function() { return locked; },
				//Used to prevent jumping when user rapidly moves mouse, stops, and then releases the mouse button
				latestInteraction : function(dateNow) { if(typeof dateNow == "number" ) latestInteraction = dateNow; return latestInteraction; },
				//The time of previous key interaction. Used in the key interaction event handlers and methods
				latestKeyInteraction : function(dateNow) { if(typeof dateNow == "number" ) latestKeyInteraction = dateNow; return latestKeyInteraction; },
				startInteracting : function() {
					interacting = true; latestInteraction = pannellum.util.setCurrentTime();
				},
				stopInteracting : function() { interacting = false; },
				isInteracting : function() { if(interacting) latestInteraction = pannellum.util.setCurrentTime(); return interacting; },
				animating : function(value) { if( typeof value == "boolean" ) animating = value; return animating; },
				fullscreenActive : function(value) { if( typeof value == "boolean" ) fullscreenActive = value; return fullscreenActive; }
			}
		}();
		this.viewerState = ViewerState;

		pannellum.eventBus.addEventListener("viever:parts_ready",
			function(event, prop) {
				var state = { modules:false, controls:false }
				return function(event, prop){
					switch(prop) {
						case "modules": state.modules = true; break;
						case "controls": state.controls = true; break;
					}
					if(state.modules && state.controls) pannellum.eventBus.dispatch('viewer_ready', This );
				}
			}()
		, This);

		pannellum.eventBus.addEventListener("viewer_ready", function() {
		  ViewerState.lock();
			This.loadPanorama( This, RenderContainer, Config.settings.set.firstPanorama );
		}, this);

		pannellum.eventBus.addEventListener("panorama:initialized", function(event) {
			if( typeof event.dispatcher === 'undefined' ) {
				throw new pannellum.customErrors.undefinedDataError('Undefined panorama:initialized event dispatcher');
			}

			var panoObjest = PartsCollection["panoramas"].item(event.dispatcher.panoId);
			if (!panoObjest) return false;
			var pano_0 = This.getPanoramaByIndex(0);
			if( pano_0 && pano_0.panoId != panoObjest.panoId ) {
				if (pano_0.transition) {
					panoObjest.render();
					// Start the transition
					pano_0.transition.run(panoObjest.container, pano_0.container);
				} else {
					panoObjest.render();
					pano_0.destroy();
					pano_0 = undefined;
			 		ViewerState.unlock();
				}
			} else {
		 		panoObjest.render();
				ViewerState.unlock();
			}
		}, this);

		pannellum.eventBus.addEventListener("transition:done", function(event) {
			if( typeof event.dispatcher === 'undefined' ) {
				throw new pannellum.customErrors.undefinedDataError('Undefined transition:done event dispatcher');
			}
			var panoObjest = This.getPanoramaByIndex(1);
			var pano_0 = This.getPanoramaByIndex(0);
			if( pano_0 !== null &&  panoObjest != null && pano_0.panoId !== panoObjest.panoId ) {
	 			panoObjest.render();
				pano_0.destroy();
				pano_0 = undefined;
			}
	 		ViewerState.unlock();
		}, this);

		pannellum.eventBus.addEventListener("panorama_to_load", function(event, prop) {
		  ViewerState.lock();
		  This.loadPanorama( This, RenderContainer, prop.panoId, prop );
		}, this);

		//Import InitialConfig initial structure
		Object.deepExtend( Config.settings, InitialConfig );
		Config.dataDir = Config.settings.dataDir;
		// Load required files
		pannellum.util.loadResource( [
			//{ name: 'script', attributes: { src:"~src/etc/classes.js" }},
			{ name: 'script', attributes: { src:"~src/etc/dependencies.js" }},
			{ name: 'script', attributes: { src:"~src/etc/dataTypes.js", onload: function(){
				try{
					pannellum.partsLoader.addParts(
						"components",
						["component"], Config.basePath).then(
							function(result) {
								if( !result ) throw new pannellum.customErrors.notFoundError('Something wrong with components class loading');
								//Load styles
								pannellum.util.loadResource({ name : "link", attributes : { href:"~src/viewer/css/styles.css" } }, document.head, Config.basePath );
								//Update Config.settings with QueryVars
								QueryVars = pannellum.util.httpGetQueryVars();
								if( !Object.isEmpty(QueryVars) ) {
									//Settings received via query string have the highest priority.
									//They replace all settings.
									if( QueryVars.hasOwnProperty("settings") ) {
										Config.settings.require = { id : QueryVars.settings, mode : "replace" }
									}
									if( QueryVars.hasOwnProperty("set") ) {
										Config.settings.set.require = { id : QueryVars.set, mode : "replace" }
									}
								}
								//var sourcesList = ["require","set.require"];
								var sourcesList = [
									{
										"require" :	function() { return ((Config.settings.require)? Config.dataDir.settings + Config.settings.require.id + "." + Config.require.jsonFileExtention : null ); },
										"callback" :	function(request) {
											if(request && request.response) {
												if(Config.settings.require && Config.settings.require.mode && Config.settings.require.mode === 'replace') {
													Config.settings = request.response;
												}else{
													Object.deepExtend(Config.settings, request.response);
												}
											}
										}
									},{
										"require" :	function() { return ((Config.settings.set.require)? Config.dataDir.set + Config.settings.set.require.id + "." + Config.require.jsonFileExtention : null ); },
										"callback" :	function(request) {
											if(request && request.response) {
												if(Config.settings.set.require && Config.settings.set.require.mode && Config.settings.set.require.mode === 'replace') {
													Config.settings.set = request.response;
												}else{
													Object.deepExtend(Config.settings.set, request.response);
												}
											}
										}
									},{
										"callback" :	init
									}
								];
								//Require settings if any "require" directives are set
								requireSettings(sourcesList);
						},
						function(msg){
							console.log(msg)
							throw new pannellum.customErrors.notFoundError(msg);
						}
					);
				}catch(e){
					console.log( e.name, e.message, e.stack );
				}
			}}}
		], document.head, Config.basePath );

		/**
		 * Initializes viewer.
		 * @private
		 */
		function init() {
			try{
				ViewerDataTypes = {
					"container" : pannellum.dataTypes.dtString({ "pattern": /^[a-z0-9_]{1,}$/i, "strict": true  }),
					"width" : pannellum.dataTypes.dtString({ "default": "100%", "pattern": /^(\d*)(px|%)$/, "strict": true  }),
					"height" : pannellum.dataTypes.dtString({ "default": "100%", "pattern": /^(\d*)(px|%)$/ , "strict": false  }),
					"firstPanorama" : pannellum.dataTypes.dtString({ "min": 0, "max": 30, "strict": false }),
					"keyboardZoom" : pannellum.dataTypes.dtBool({ "default": true, "strict": false }),
					"autoload" : pannellum.dataTypes.dtBool({ "default": true, "strict": false }),
					//Setting this parameter causes the panorama to automatically rotate when loaded.
					"autoRotate" : pannellum.dataTypes.dtBool({ "default": false }),
					//The value specifies the rotation speed in degrees per second. Positive is counter-clockwise, and negative is clockwise. 0 - no rotation;
					"autoRotateSpeed" : pannellum.dataTypes.dtNumber({ default: 1000 }),
					//Sets the delay, in milliseconds, to start automatically rotating the panorama after user activity ceases. This parameter only has an effect if the autoRotate parameter is set.
					"autoRotateInactivityDelay" : pannellum.dataTypes.dtNumber({ default: 1000 }),
					//Sets the delay, in milliseconds, to stop automatically rotating the panorama after it is loaded. This parameter only has an effect if the autoRotate parameter is set.
					"autoRotateStopDelay" : pannellum.dataTypes.dtNumber({ default: 10000 }),
				}
				if( !Config.settings.hasOwnProperty( "viewer" ) ) Config.settings.viewer = {}
				for( var configItem in ViewerDataTypes ) {
					if( !ViewerDataTypes.hasOwnProperty( configItem ) ) continue;
					try{
						Config.viewer[configItem] = ViewerDataTypes[configItem].check(Config.settings.viewer[configItem]);
					}catch(e){
						if( e instanceof pannellum.customErrors.dataTypeError ) console.log( e.name + ": Invalid settings in viewer section: \"viewer."+configItem+"\": " + e.message );
					}
				}
				// Display an error for IE 9 as it doesn't work but also doesn't otherwise
				// show an error (older versions don't work at all)
				// Based on: http://stackoverflow.com/a/10965203
				var div = document.createElement("div");
				div.innerHTML = "<!--[if lte IE 9]><i></i><![endif]-->";
				if (div.getElementsByTagName("i").length == 1) throw new pannellum.customErrors.compatiblityError("The panorama could not be viewed in this browser.");
				if( QueryVars && QueryVars.hasOwnProperty("panorama") ) {
					Config.settings.set.firstPanorama = QueryVars.panorama;
					Config.settings.set.panoramas[QueryVars.panorama] = {"require":{id:QueryVars.panorama}};
				}
				//Check firstPanorama
				if( (!Config.settings.set.firstPanorama) ||
					(Config.settings.set.firstPanorama && !Config.settings.set.panoramas[Config.settings.set.firstPanorama]) ) {
					//Get first panorama
					for ( var id in Config.settings.set.panoramas ) {
						if( Config.settings.set.panoramas.hasOwnProperty(id) ) Config.settings.set.firstPanorama = id;
						break;
					}
				}
				if( !Config.settings.set.firstPanorama ) throw new Error("No panorama to show defined");
				//Set Container first to be able to see mergeConfig error messages
				setContainers();
				//Set modules collection as we add there an ErrorMessage module first
				PartsCollection["modules"] = new pannellum.collections.objectCollection();
				PartsCollection["panoramas"] = new pannellum.collections.objectCollection();
				// actions are used in transition only.
				PartsCollection["actions"] = new pannellum.collections.objectCollection();
				InteractionsCollection = new pannellum.collections.objectCollection();

				//Load components
				prepareComponents( { "type": "modules", "compSet" : Config.settings["modules"], "container": ModulesContainer } );
				prepareComponents( { "type": "controls", "compSet" : Config.settings["controls"], "container": ControlsContainer } );

			}catch(e){
				if( e instanceof pannellum.customErrors.compatiblityError )  {
					pannellum.errorMessage.show("console", e.name, e.message, e.stack);
				}else{
					pannellum.errorMessage.show("console", e.name, e.message, e.stack);
				}
			}
		}

		/**
		 * Loads panorama by it's ID.
		 * @public
		 ^ @param {object} host Host object
		 ^ @param {object} hostContainer The hostContainer
		 * @param {string} panoId Panorama ID to be loaded.
		 * @param {object} newPointing The new pointing for panorama
		 */
		this.loadPanorama = function(host, hostContainer, panoId, newPointing) {
			if( !host )  throw new Error("The host object is not defined");
			if( !hostContainer )  throw new Error("The hostContainer is not defined");
			if( !panoId )  throw new Error("Panorama id is not defined");
			//Options:
			// - check if panorama has already been initialized (can be found in the panoramas collection)

			var panoObject = PartsCollection["panoramas"].item(panoId);
			// if yes
			if( panoObject ) {
				setNewPointing(panoObject, newPointing);
				invokePanoObject(panoObject);
				return true;
			}

			// if not:
			// - get panorama settings from Config.settings.set.panoramas[panoId]
			// if there are any
			var panoSettings;
			if( Config.settings.set.panoramas[panoId] ) {
				panoSettings = Config.settings.set.panoramas[panoId];
				if (!panoSettings.hasOwnProperty('transition') || !panoSettings.transition) {
					panoSettings.transition = Config.settings.transition;
				}
			}else{
			// If not (the panorama is not in the set)
			// panoId actualy is a folder path like "folder" or "folder/folder/folder"
				panoSettings = {
					require : {
						id : panoId
					},
					transition : Config.settings.transition
				}
			}
			var sourcesList = [
				{
					"require" : function() { return ((panoSettings.require)? Config.dataDir.panoramas + panoSettings.require.id + "." + Config.require.jsonFileExtention : null ); },
					//"require" : function() { return ((panoSettings.require)? '/ajax/panorama/' + panoSettings.require.id : null ); },
					"callback" : function(request) {
						if(request && request.response) {
							if(panoSettings.require.mode && panoSettings.require.mode === 'replace') {
								Config.settings.set = request.response;
							}else{
								Object.deepExtend(panoSettings, request.response);
							}
						}
						if( !pannellum.components.hasOwnProperty( "panoramas" ) ) pannellum.components.panoramas = {};
						if( pannellum.components.panoramas.hasOwnProperty( panoSettings.type ) ) {
							var panoObject = createPanoObject(host, hostContainer, panoId, panoSettings);
							panoObject.show();
							setNewPointing(panoObject, newPointing);
						}else{
							// - if there are no panorama type class in the system
							// - - load appropriate type
							pannellum.partsLoader.addParts(
								"components.panoramas",
								[panoSettings.type], Config.basePath).then(
								function() {
									var panoObject = createPanoObject(host, hostContainer, panoId, panoSettings);
									panoObject.show();
									setNewPointing(panoObject, newPointing);
								},
								function(msg){
									throw new pannellum.customErrors.notFoundError(msg);
								}
							);
						}
					}
				}
			];
			//Require settings if any "require" directives are set
			// - if there is a require directive
			// - - load settings and update Config.settings.set.panoramas[panoId] settings
			if(panoSettings.hasOwnProperty('require')) {
				requireSettings(sourcesList);
			}else{
				sourcesList[0].callback(null);
			}
		}

		function setNewPointing(panoObject, newPointing) {
			var pano_0 = This.getPanoramaByIndex(0);
			if (!pano_0 || !panoObject || !newPointing) return false;
			if( newPointing.hasOwnProperty('targetPitch')) {
		    if (newPointing.targetPitch === 'same') {
		      panoObject.setPitch(pano_0.getPitch());
		    } else {
		      panoObject.setPitch(newPointing.targetPitch);
		    }
			}
			if( newPointing.hasOwnProperty('targetYaw')) {
		    if (newPointing.targetYaw === 'same') {
		      panoObject.setYaw(pano_0.getYaw());
		    } else if (newPointing.targetYaw === 'sameAzimuth') {
		      panoObject.setYaw(
						config.yaw + (pano_0.getNorthOffset() || 0) - (panoObject.getNorthOffset() || 0)
					);
		    } else {
		       panoObject.setYaw(newPointing.targetYaw);
		    }
			}

			if( newPointing.hasOwnProperty('targetHfov')) {
		    if (newPointing.targetHfov === 'same') {
		       panoObject.setHfov(pano_0.getHfov());
		    } else {
		       panoObject.setHfov(newPointing.targetHfov);
		    }
			}
		}

		/**
		 * Invoke previously created panorama object
		 * The function is intended to start functioning initialized earlier panorama. In case we are trying
		 * to show previously played panorama, it's oject could be taken from PartsCollection["panoramas"].
		 * Constructing and starting panoramas should be differed. We need to have possobility to start constructed earlier panorama.
		 * @TODO Set new pointing using previous panorama settings
		 *
		 * @private
		 * @param {Object} Panorama object
		 */
		function invokePanoObject(panoObject) {
			panoObject.container.appendChild(panoObject.canvas);
			panoObject.container.appendChild(panoObject.hotSpotsCollection.container);
			if( panoObject.config.hasOwnProperty('hotSpots') && panoObject.config.hotSpots.length ) {
				panoObject.createHotspots(panoObject.config.hotSpots);
			}
			panoObject.hostContainer.appendChild(panoObject.container);
			pannellum.eventBus.dispatch("panorama:initialized", panoObject);
			panoObject.show();
			panoObject.resize();
			panoObject.render();
		}

		/**
		 * Creates new panorama instance if not exists in the PartsCollection
		 * and adds it to PartsCollection. Returns panorama object.
		 * @private
		 ^ @param {object} host Host object
		 ^ @param {object} hostContainer The hostContainer
		 * @param {String} panoId Panorama ID to be instanciated.
		 * @param {String} panoSettings Panorama settings.
		 * @returns {Object} Panorama object
		 */
		function createPanoObject(host, hostContainer, panoId, panoSettings) {
			try{
				if( !host )  throw new Error("The host object is not defined");
				if( !hostContainer )  throw new Error("The hostContainer is not defined");
				if( !panoId )  throw new Error("Panorama id is not defined");
				if( !panoSettings )  throw new Error("Panorama settings are not defined");
				if( !panoSettings.type )  throw new Error("Panorama type is not defined");
				if( !pannellum.components.panoramas.hasOwnProperty( panoSettings.type ) ) return null;
				panoSettings.panoId = panoId;
				var panoObject = PartsCollection["panoramas"].item(panoId);
				if(!panoObject) {
					PartsCollection["panoramas"].add(
						panoId,
						new pannellum.components.panoramas[ panoSettings.type ](
							host,
							hostContainer,
							panoSettings
						)
					);
					panoObject = PartsCollection["panoramas"].item(panoId);
				}

				return panoObject;
			}catch(e){
				pannellum.errorMessage.show( "messageBox", e.name, "Invalid settings in \"set.panoramas." + panoSettings.type + "." + panoId + "\" section: " + e.message );
				console.log(e);
			}
		}

		/**
		 * Loades external settings
		 * @private
		 * @param {Object} External settings source list.
		 * @returns (Object) Settings object
		 */
		function requireSettings(sl){
			if(!sl) return false;
			var sourcesList = sl;
			function process() {
				var targetSource = sourcesList.shift();
				if ( targetSource ){
					var requireUrl = ( targetSource.require )? targetSource.require() : null;
					if( requireUrl ) {
						var url = requireUrl;
						var settigs = {
							url		: url,
							method	: "GET",
							async	: true,
							noCache : true,
							responseType : "json",
							requestHeaders : {'Accept': 'application/json, text/javascript', "Content-Type": "application/json;charset=UTF-8"}
						}
						pannellum.util.xHttpRequest(settigs).then(function(request){
							targetSource.callback(request);
							process();
						}).catch(function(error){
							pannellum.errorMessage.show("console", error.name, error.message, error.stack);
							process();
						})
					}else{
						targetSource.callback();
						process();
					}
				}
			}
			return process();
		}

		/**
		 * Prepares (loads) componebts and puts them into appropriate collection
		 * @private
		 * @param {object} load settings
		 */
		function prepareComponents(addComponents) {
			if( !addComponents || addComponents.length == 0 ) {
				pannellum.eventBus.dispatch('viever:parts_ready', this, addComponents.type );
			}
			pannellum.partsLoader.addParts(
				"components." + addComponents.type,
				addComponents.compSet, Config.basePath).then(
				function() {
					if( !PartsCollection.hasOwnProperty(addComponents.type) ) PartsCollection[addComponents.type] = new pannellum.collections.objectCollection();
					//Probably here the components should be initialzed
					//var components = addComponents.settings;
					var compLength = addComponents.compSet.length;
					if( compLength > 0 ) {
						var compSettings;
						for( var i=0; i<compLength; i++ ) {
							compSettings = pannellum.util.getSettings( addComponents.compSet[i] );
							if( compSettings === null ) continue;
							if( !PartsCollection[addComponents.type].item( compSettings.name ) && pannellum.components[addComponents.type].hasOwnProperty( compSettings.name ) ) {
								try{
									PartsCollection[addComponents.type].add(
										compSettings.name,
										new pannellum.components[addComponents.type][ compSettings.name ](
											This,
											addComponents.container,
											compSettings.settings
										)
									);
								}catch(e){
									pannellum.errorMessage.show( "messageBox", e.name, "Invalid settings in \"" + addComponents.type + "." + compSettings.name + "\" section: " + e.message );
								}
							}
						}
					}
					pannellum.eventBus.dispatch('viever:parts_ready', This, addComponents.type );
				},
				function(msg){
					console.log(msg);
				}
			);
		}

		/**
		 * Sets HTML containers for the viewer itself and components.
		 * Binds event listeners.
		 * @private
		 */
		function setContainers() {
			// Initialize containers
			Container = document.getElementById(Config.viewer.container);
			if(!Container) throw new Error("The panorama container \"" + Config.viewer.container + "\" is not found");
			pannellum.util.domElement.setAttr(Container, {
				"className" : ((Container.className) ? Container.className + " " : "") + "pnlm-container",
				"tabIndex" : 0
			});
			if( Config.viewer.width ) pannellum.util.domElement.setAttr(Container, {
				"style" : {"width" : Config.viewer.width }
			});
			if( Config.viewer.height ) pannellum.util.domElement.setAttr(Container, {
				"style" : {"height" : Config.viewer.height }
			});
			RenderContainer = pannellum.util.domElement.create({
				name : "div", attributes : {"className": "pnlm-render-container"}
			}, Container);

			if( !Object.isEmpty(Config.settings.controls) ) {
				ControlsContainer = pannellum.util.domElement.create({
					name : "div", attributes : {"className": "pnlm-controls-container"}
				}, Container);
			}
			//Modules container is created in any case, because of errorMessage defailt module
			ModulesContainer = pannellum.util.domElement.create({
				name : "div", attributes : {"className": "pnlm-modules-container"}
			}, Container);

			DragFix = pannellum.util.domElement.create({
				name : "div", attributes : {"className": "pnlm-dragfix"}
			}, Container);
			DragFix.addEventListener("contextmenu", function(domEvent){
				pannellum.eventBus.dispatch("context_menu", DragFix, domEvent);
				domEvent.preventDefault();
			});
			Container.addEventListener('mousedown', onDocumentMouseDown, false);
			document.addEventListener('mousemove', onDocumentMouseMove, false);
			document.addEventListener('mouseup', onDocumentMouseUp, false);
			document.addEventListener('mouseleave', onDocumentMouseUp, false);
			Container.addEventListener('mousewheel', onDocumentMouseWheel, false);
			Container.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);

			Container.addEventListener('mozfullscreenchange', onFullScreenChange, false);
			Container.addEventListener('webkitfullscreenchange', onFullScreenChange, false);
			Container.addEventListener('msfullscreenchange', onFullScreenChange, false);
			Container.addEventListener('fullscreenchange', onFullScreenChange, false);

			window.addEventListener('resize', onDocumentResize, false);
			Container.addEventListener('keydown', onDocumentKeyPress, false);
			Container.addEventListener('keyup', onDocumentKeyUp, false);
			Container.addEventListener('blur', onDocumentKeyUp, false);

			Container.addEventListener('touchstart', onDocumentTouchStart, false);
			Container.addEventListener('touchmove', onDocumentTouchMove, false);
			Container.addEventListener('touchend', onDocumentTouchEnd, false);
			//Container.addEventListener('pointerdown', onDocumentPointerDown, false);
			//Container.addEventListener('pointermove', onDocumentPointerMove, false);
			//Container.addEventListener('pointerup', onDocumentPointerUp, false);
			//Container.addEventListener('pointerleave', onDocumentPointerUp, false);

			// Deal with MS pointer events
			if (window.navigator.pointerEnabled) Container.style.touchAction = 'none';

			pannellum.animator.setInteractionPriority({
				'AutoInteraction':0,
				'MouseWheelInteraction':1,
				'KeyInteraction':1,
				'MouseInteraction':2,
				'TouchInteraction':2,
			});
		}

		/**
		 * Performs Mouse Wheel interactions.
		 * @private
		 * @param {MouseEvent} event - mousewheel or DOMMouseScroll event
		 */
		function onDocumentMouseWheel(event) {
			event.preventDefault();
			/*
			//Simple example without animator
			var mwData = getMouseWheelData(event);
			var cPanorama = This.getPanoramaByIndex('last');
			setHfov(cPanorama.config.hfov + mwData/2);
			cPanorama.render();
			*/

			///Special MouseWheelInteraction
			var factor = (getMouseWheelData(event)>0)?1:-1;
			var directions = [
				{zoom:0.1 * factor},
				{zoom:0.5 * factor},
				{zoom:0.9 * factor}
			];
			// var directions = [
			// 	{zoom:0.1 * factor, vector:{dir:90 * factor, step:0.1}},
			// 	{zoom:0.5 * factor, vector:{dir:90 * factor, step:0.3}},
			// 	{zoom:0.9 * factor, vector:{dir:90 * factor, step:0.5}}
			// ];
			if( pannellum.animator.interactionPriority('MouseWheelInteraction') === true ) pannellum.animator.stop();
			if( pannellum.animator.getInteraction() == null ) {
				var panorama = This.getPanoramaByIndex('last');
				var cInteraction;
				if( !InteractionsCollection.item('MouseWheelInteraction') ) {
					cInteraction = new pannellum.interactions.mouseWheelInteraction();
					InteractionsCollection.add('MouseWheelInteraction', cInteraction);
				}else{
					cInteraction = InteractionsCollection.item('MouseWheelInteraction');
				}
				cInteraction.start(directions);
				pannellum.animator.start(
					cInteraction,
					panorama
				)
			}else if( pannellum.animator.getInteraction().name == 'MouseWheelInteraction' ){
				pannellum.animator.getInteraction().update(directions);
			}
		}

		/**
		 * Performs Mouse interactions on mousedown event.
		 * @private
		 * @param {MouseEvent} event - mousedown event
		 */
		function onDocumentMouseDown(event){
			// Override default action
			event.preventDefault();
			// But not all of it
			Container.focus();
			if( pannellum.animator.interactionPriority('MouseInteraction') === true ) pannellum.animator.stop();
			var panorama = This.getPanoramaByIndex('last');
			var pos = mousePosition(event);
			var settings = {yaw:panorama.config.yaw, pitch:panorama.config.pitch, x:pos.x, y:pos.y, canvas:{width:panorama.canvas.width,height:panorama.canvas.height}}
			if( pannellum.animator.getInteraction() == null ) {
				var cInteraction;
				if( !InteractionsCollection.item('MouseInteraction') ) {
					cInteraction = new pannellum.interactions.mouseInteraction();
					InteractionsCollection.add('MouseInteraction', cInteraction);
				}else{
					cInteraction = InteractionsCollection.item('MouseInteraction');
				}
				cInteraction.start(settings);
				cInteraction.update(pos);
				pannellum.animator.start(
					cInteraction,
					panorama
				)
			}else if( pannellum.animator.getInteraction().name == 'MouseInteraction' ){
				cInteraction = pannellum.animator.getInteraction();
				cInteraction.start(settings);
				cInteraction.update(pos);
			}
			Container.classList.add('pnlm-grabbing');
			Container.classList.remove('pnlm-grab');
		}

		/**
		 * Performs Mouse interactions on mousemove event.
		 * @private
		 * @param {MouseEvent} event - mousemove event
		 */
		function onDocumentMouseMove(event){
			var cInteraction = pannellum.animator.getInteraction();
			if( cInteraction !== null && cInteraction.name == 'MouseInteraction' && cInteraction.state.interacting === true ){
				var pos = mousePosition(event);
				cInteraction.update(pos);
			}
		}

		/**
		 * Performs Mouse interactions on mouseup event.
		 * @private
		 * @param {MouseEvent} event - mouseup event
		 */
		function onDocumentMouseUp(event){
			var cInteraction = pannellum.animator.getInteraction();
			if( cInteraction !== null && cInteraction.name == 'MouseInteraction' && cInteraction.state.interacting === true ){
				cInteraction.stop();
				Container.classList.remove('pnlm-grabbing');
				Container.classList.add('pnlm-grab');
			}
		}

		/**
		 * Performs Touch interactions on touchstart event.
		 * @private
		 * @param {TouchEvent} event - touchstart event
		 */
		function onDocumentTouchStart(event){
			// Override default action
			event.preventDefault();
			// But not all of it
			Container.focus();
			if( pannellum.animator.interactionPriority('TouchInteraction') === true ) pannellum.animator.stop();
			var panorama = This.getPanoramaByIndex('last');
			var pos = mousePosition(event.targetTouches[0]);
			var settings = {yaw:panorama.config.yaw, pitch:panorama.config.pitch, x:pos.x, y:pos.y, canvas:{width:panorama.canvas.width,height:panorama.canvas.height}}
			 if (event.targetTouches.length == 2) {
		        var pos1 = mousePosition(event.targetTouches[1]);
				settings.x1 = pos1.x;
				settings.y1 = pos1.y;
			}

			if( pannellum.animator.getInteraction() == null ) {
				var cInteraction;
				if( !InteractionsCollection.item('TouchInteraction') ) {
					cInteraction = new pannellum.interactions.touchInteraction();
					InteractionsCollection.add('TouchInteraction', cInteraction);
				}else{
					cInteraction = InteractionsCollection.item('TouchInteraction');
				}
				cInteraction.start(settings);
				cInteraction.update(pos);
				pannellum.animator.start(
					cInteraction,
					panorama
				);
			}else if( pannellum.animator.getInteraction().name == 'TouchInteraction' ){
				cInteraction = pannellum.animator.getInteraction();
				cInteraction.start(settings);
				cInteraction.update(pos);
			}
		}

		/**
		 * Performs Touch interactions on touchmove event.
		 * @private
		 * @param {TouchEvent} event - touchmove event
		 */
		function onDocumentTouchMove(event) {
			var cInteraction = pannellum.animator.getInteraction();
			if( cInteraction !== null && cInteraction.name == 'TouchInteraction' && cInteraction.state.interacting === true ){
				var pos = mousePosition(event.targetTouches[0]);
				var settings = { x:pos.x, y:pos.y };
				 if (event.targetTouches.length == 2) {
		 	       var pos1 = mousePosition(event.targetTouches[1]);
					settings.x1 = pos1.x;
					settings.y1 = pos1.y;
				}
				cInteraction.update(pos);
			}
		}

		/**
		 * Performs Touch interactions on touchend event.
		 * @private
		 * @param {TouchEvent} event - touchend event
		 */
		function onDocumentTouchEnd(event){
			var cInteraction = pannellum.animator.getInteraction();
			if( cInteraction !== null && cInteraction.name == 'TouchInteraction' && cInteraction.state.interacting === true ){
				cInteraction.stop();
			}
		}

		/**
		 * Performs Key interactions on keydown event.
		 * @private
		 * @param {KeyEvent} event - keydown event
		 */
		function onDocumentKeyPress(event) {
			var kbKey = getKeyCode(event);
			console.log('Key pressed #' + kbKey);
			//F5 (refresh) || F12 (console)
			if( kbKey == 116 || kbKey == 123 ) return false;
			//Esc
			if(kbKey == 27) { pannellum.animator.stop(); return false; };
			event.preventDefault();
			if( pannellum.animator.interactionPriority('KeyInteraction') === true ) pannellum.animator.stop();
			if( pannellum.animator.getInteraction() == null ) {
				var panorama = This.getPanoramaByIndex('last');
				var cInteraction;
				if( !InteractionsCollection.item('KeyInteraction') ) {
					var st = 0.3;
					var settings = {
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
							'65': 'zoomIn',
							'83': 'zoomOut',
							'90': 'zoomInSlow', //z
							'88': 'zoomOutSlow' //x
						},
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
							'zoomOut':	{ zoom: -0.2 },
							'zoomInSlow':	{ zoom: 0.05 },
							'zoomOutSlow':	{ zoom: -0.05 }
						}
					}
					cInteraction = new pannellum.interactions.keyInteraction(settings);
					InteractionsCollection.add('KeyInteraction', cInteraction);
				}else{
					cInteraction = InteractionsCollection.item('KeyInteraction');
				}
				cInteraction.start(kbKey);
				pannellum.animator.start(
					cInteraction,
					panorama
				)
			}else if( pannellum.animator.getInteraction().name == 'KeyInteraction' ){
				pannellum.animator.getInteraction().update(kbKey);
			}
			//This is an example of autointeraction
			if(kbKey == 32) { //Space
				if( pannellum.animator.interactionPriority('AutoInteraction') === true ) pannellum.animator.stop();
				var directions_1 = [
					{ vector: {dir:90, step:0.5}, dur:2000 },
					{zoom: -0.5, dur:2000 },
					{ vector: {dir:135, step:0.5}, dur:1000 },
					{ vector: {dir:180, step:0.5}, dur:500 },
					{ vector: {dir:225, step:0.5}, dur:500 },
					{ vector: {dir:270, step:0.5}, dur:2000 },
					{zoom: 0.5, dur:1000 },
					{ vector: {dir:315, step:0.5}, dur:1000 },
					{ vector: {dir:360, step:0.5}, dur:500 },
					{ vector: {dir:225, step:0.5}, dur:500 },
					{zoom: -0.5, dur:2000 },
					{ vector: {dir:270, step:0.5}, dur:2000 },
					{ vector: {dir:315, step:0.5}, dur:1000 },
					{ vector: {dir:360, step:0.5}, dur:500 },
					{ vector: {dir:45, step:0.5}, dur:500 },
					{ vector: {dir:90, step:0.5}, dur:3000 },
					{ vector: {dir:135, step:0.5}, dur:1000 },
					{zoom: 0.2, dur:3000 },
					{zoom: -0.2, dur:3000 },
				];

				if( pannellum.animator.getInteraction() == null ) {
					var cInteraction;
					if( !InteractionsCollection.item('AutoInteraction') ) {
						cInteraction = new pannellum.interactions.autoInteraction(directions_1);
						InteractionsCollection.add('AutoInteraction', cInteraction);
					}else{
						cInteraction = InteractionsCollection.item('AutoInteraction');
					}
					cInteraction.start();
					pannellum.animator.start(
						cInteraction,
						panorama
					)
				}
			}
		}

		/**
		 * Performs Key interactions on keyup event.
		 * @private
		 * @param {KeyEvent} event - keyup event
		 */
		function onDocumentKeyUp(event) {
			var kbKey = getKeyCode(event);
			event.preventDefault();
			var cInteraction = pannellum.animator.getInteraction();
			if( cInteraction !== null && cInteraction.name == 'KeyInteraction' ){
				cInteraction.stop(kbKey);
			}
		}

		/**
		 * Calculate mouse position relative to top left of viewer container.
		 * @private
		 * @param {MouseEvent} event - Mouse event to use in calculation
		 * @returns {Object} Calculated X and Y coordinates
		 */
		function mousePosition(event) {
		    var bounds = Container.getBoundingClientRect();
		    var pos = {};
		    pos.x = event.clientX - bounds.left;
		    pos.y = event.clientY - bounds.top;
		    return pos;
		}

		/**
		 * Gets key code from passed event object.
		 * @private
		 * @param {KeyEvent} event - Key event
		 * @returns {Number} key code
		 */
		function getKeyCode(event) {
			var keynumber = event.keycode;
			if (event.which) keynumber = event.which;
			if (keynumber) return keynumber;
			return null;
		}

		/**
		 * Gets mouse wheel data from passed event object.
		 * @private
		 * @param {MousewheelEvent}
		 * @returns {Number}
		 */
		function getMouseWheelData(event){
			if (event.wheelDeltaY) {
					// WebKit
					return event.wheelDeltaY * 0.05;
			} else if (event.wheelDelta) {
					// Opera / Explorer 9
					return event.wheelDelta * 0.05;
			} else if (event.detail) {
					// Firefox
					return event.detail * 1.5 * -1;
			}
			return null;
		}

		/**
		 * Event handler for document resizes. Updates viewer size and rerenders view.
		 * @private
		 */
		function onDocumentResize() {
			var panorama = This.getPanoramaByIndex('last');
		    if(panorama) {
				// Resize panorama
				panorama.resize();
				panorama.render();
			}
		    // Kludge to deal with WebKit regression: https://bugs.webkit.org/show_bug.cgi?id=93525
		    onFullScreenChange();
		}


		/**
		 * Event handler for fullscreen changes.
		 * @private
		 */
		function onFullScreenChange() {
			if (document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement) {
				ViewerState.fullscreenActive(true);
			} else {
				ViewerState.fullscreenActive(false);
			}
			pannellum.eventBus.dispatch("fullscreen_change", null, { active : ViewerState.fullscreenActive() });
		}

		/**
		 * Toggles fullscreen mode.
		 * @public
		 */
		this.toggleFullscreen = function() {
        if (!this.viewerState.fullscreenActive()) {
            try {
                if (Container.requestFullscreen) {
                    Container.requestFullscreen();
                } else if (Container.mozRequestFullScreen) {
                    Container.mozRequestFullScreen();
                } else if (Container.msRequestFullscreen) {
                    Container.msRequestFullscreen();
                } else {
                    Container.webkitRequestFullScreen();
                }
            } catch(event) {
                // Fullscreen doesn't work
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
		}

		/**
		 * Returns viewer base path.
		 * @returns {string}
		 * @public
		 */
		this.getBasePath = function() {
        return Config.basePath;
		}

		/**
		 * Gets panorama object from PartsCollection["panoramas"]
		 * by it's index in the RenderContainer.
		 * @public
		 * @param {number} Panorama index.
		 * @returns {Object} Panorama object
		 */
		this.getPanoramaByIndex = function (i) {
			if( !i ) i = 0;
			if( RenderContainer.childNodes.length == 0 ) {
				console.log('Can not get panorama by index "' + i + '", the container is empty. Returned null.');
				return null;
			}
			if( i == 'last' ) i = RenderContainer.childNodes.length - 1;
			if( !RenderContainer.childNodes[i] ) {
				console.log('Can not get panorama by index "' + i + '", it does not exists in the container. Returned null.');
				return null;
			}
			var panoObject = PartsCollection["panoramas"].item( RenderContainer.childNodes[i].id )
			if( !panoObject ) {
				console.log('Can not get panorama by index "' + i + '", the key is incorrect. Returned null.');
				return null;
			}
			return panoObject;
		};


		/**
		 * Error message controller. Shows/hides error message HTML box or outputs it in the console.
		 * Singletone
		 * @constructor
		 */
		var ErrorMessage = function() {
			var instance;
			var errModule;
			var init = function() {
				var Show = function(type, errorName, errorMessage, errorStack){
					switch(type) {
						case "messageBox" :
							if( !PartsCollection["modules"].item("errorMessage") && pannellum.components["modules"].hasOwnProperty("errorMessage") ) {
								PartsCollection["modules"].add(
									"errorMessage",
									new pannellum.components["modules"]["errorMessage"](
										This,
										ModulesContainer,
										null
									)
								);
							}
							errModule = PartsCollection["modules"].item("errorMessage");
							errModule.update({name:errorName, message:errorMessage});
							errModule.show();
							ViewerState.lock();
						break;
						case "console" : console.log(errorName + ". " + errorMessage + ((errorStack) ? ".\r" + errorStack : "") );
					}
				}

				var Hide = function() {
					if( errModule ) errModule.hide();
					ViewerState.lock();
				}

				return {
					show : Show,
					hide : Hide
				}
			}

			return {
				getInstance: function(){
					if(!instance) instance = init();
					return instance;
				}
			};
		}();
		pannellum.errorMessage = ErrorMessage.getInstance();
	}

	pannellum.viewer = function(settings) { return new Viewer(settings); }


	/**
	 * Components preloader.
	 * Singletone
	 * @constructor
	 */
	var PartsLoader = function() {
		var instance;

		var loader = function() {
			// The stack to hold required Parts
			var Parts = [];
			var FilesStack = [];
			var delayOnError = 2000;

			//window.addEventListener("error", function(e) {
			//	if( e.type == "error" ) {
			//		console.log(e.target.src);
			//	}
			//}, true);

			var AddParts = function( nameSpace, parts, basePath){
				return new Promise(function(resolve, reject) {
					var partSymbol;
					var procId = pannellum.util.getUniqId();
					if( !nameSpace ) { reject("The name space is undefined"); return false; }

					if( !parts ) return false;
					var partsLength = parts.length;
					if( partsLength > 0 ) {
						var p, partSettings;
						for( var p=0; p<partsLength; p++ ) {
							partSettings = pannellum.util.getSettings( parts[p] );
							if( partSettings === null ) continue;
							getDependencies( ( (nameSpace) ? nameSpace + "." : "" ) + partSettings.name, 0 );
						}
					}else{
						getDependencies( nameSpace, 0 );
					}

					if(FilesStack.length > 0) {
						var filesToLoad = [], toLoadCount = 0, loadedCount=0, filesToLoadLength = 0, FilesStackLength = FilesStack.length, i=FilesStackLength-1, j;
						for ( var i; i>=0; i--) {
							if( !FilesStack[i] || FilesStack[i].length == 0 ) continue;
							j = FilesStack[i].length-1;
							for( j; j>=0; j-- ) {
								if( FilesStack[i][j].procId != procId ) continue;
								toLoadCount++;
								(function(file) {
									file.onload = function() {
										loadedCount++;
										console.log( "File " + file.src + " (id:" + file.procId + ") loaded. Total: " + loadedCount + "/" + toLoadCount );
										if( toLoadCount == loadedCount ) {
											console.log( "All files loaded" );
											resolve(true);
										}
									}
								})(FilesStack[i][j]);
								filesToLoad.push( { name: 'script', attributes: FilesStack[i][j]} );
							}
						}
						if(filesToLoad.length) {
							filesToLoadLength = filesToLoad.length;
							pannellum.util.loadResource( filesToLoad, document.head, basePath );
						}else{
							console.log('array filesToLoad is empty, nothing to load');
							resolve(false);
						}
					}else{
						console.log('array FilesStack is empty, nothing to load');
						resolve(false);
					}
					setTimeout( function(){
						if( filesToLoadLength < loadedCount ){
							console.log("One of the files could not be loaded");
						}
					}, delayOnError);

					function getDependencies ( parts, level ){
						if( !parts ) return null;
						var parts = ( parts.constructor == Array ) ? parts : [parts];
						level++;
						var i, partsLength = parts.length, partSymbol, retFilesToLoad = [];
						var test = "";
						for(i=0; i < partsLength; i++ ) {
							partSymbol = parts[i];
							if( !pannellum.dependencies.hasOwnProperty( partSymbol ) ) { console.log("The symbol " + partSymbol + " was not found in dependencies"); continue; }

							if( Object.inArray( Parts, partSymbol ) >= 0 ) continue;

							Parts.push( partSymbol );
							// Get dependency object
							var dpndObj = pannellum.dependencies[partSymbol];
							// Prepare it for loading
							if( ( dpndObj.hasOwnProperty("src") && dpndObj.src ) &&
								getFileIndex( FilesStack, dpndObj.src ) < 0 ) {
								if ( typeof FilesStack[ level-1 ] == "undefined" ) FilesStack[ level-1 ] = [];
								FilesStack[ level-1 ].push( {src: dpndObj.src, procId: procId} );
							}
							if( dpndObj.hasOwnProperty("depends") && dpndObj.depends ) {
								getDependencies( ( (dpndObj.depends.constructor == Array) ? dpndObj.depends : [dpndObj.depends] ), level );
							}
						}
					}

					function getFileIndex(arr, src) {
						if( !arr || !src ) return -1;
						var i, j, arrLength = arr.length;
						for( i=0; i<arrLength; i++) {
							//[ [{src:"src", procId:timestamp},{src:"src", procId:timestamp}] ]
							if( arr[i].length == 0 ) continue;
							var arr_i_Length = arr[i].length;
							for( j=0; j<arr_i_Length; j++) {
								if( arr[i][j].src == src ) return i;
							}
						}
						return -1;
					}
				});
			}

			return {
				addParts : AddParts,
				getFilesStack : function(){ return FilesStack; },
				//getLevels : function(){ return Levels; },
				getParts : function(){ return Parts; }
			}
		}

		return {
			getInstance: function(){
				if(!instance) instance = loader();
				return instance;
			}
		};
	}();
	pannellum.partsLoader = PartsLoader.getInstance();


	/**
	 * EventBusClass.
	 * @constructor
	 */
	var EventBusClass = function() {
			this.listeners = {};
		};
		EventBusClass.prototype = {
			addEventListener:function(type, callback, scope) { //event name, callback, listener obj
				var args = [];
				var numOfArgs = arguments.length;
				for(var i=0; i<numOfArgs; i++){
					args.push(arguments[i]);
				}
				args = args.length > 3 ? args.splice(3, args.length-1) : [];
				if(typeof this.listeners[type] != "undefined") {
					this.listeners[type].push({scope:scope, callback:callback, args:args});
				} else {
					this.listeners[type] = [{scope:scope, callback:callback, args:args}];
				}
			},
			dispatch:function(type, dispatcher /*[arguments]*/ ) { //event name, dispatcher obj, args
				var numOfListeners = 0;
				var event = {
					type:type,
					dispatcher:dispatcher
				};
				var args = [];
				var numOfArgs = arguments.length;
				for(var i=0; i<numOfArgs; i++){
					args.push(arguments[i]);
				};
				args = args.length > 2 ? args.splice(2, args.length-1) : [];
				args = [event].concat(args);
				if(typeof this.listeners[type] != "undefined") {
					var numOfCallbacks = this.listeners[type].length;
					for(var i=0; i<numOfCallbacks; i++) {
						var listener = this.listeners[type][i];
						if(listener && listener.callback) {
							var concatArgs = args.concat(listener.args);
							listener.callback.apply(listener.scope, concatArgs);
							numOfListeners += 1;
						}
					}
				}
			},
			removeEventListener:function(type, callback, scope) {
				if(typeof this.listeners[type] != "undefined") {
					var numOfCallbacks = this.listeners[type].length;
					var newArray = [];
					for(var i=0; i<numOfCallbacks; i++) {
						var listener = this.listeners[type][i];
						if(listener.scope == scope && listener.callback == callback) {

						} else {
							newArray.push(listener);
						}
					}
					this.listeners[type] = newArray;
				}
			},
			hasEventListener:function(type, callback, scope) {
				if(typeof this.listeners[type] != "undefined") {
					var numOfCallbacks = this.listeners[type].length;
					if(callback === undefined && scope === undefined){
						return numOfCallbacks > 0;
					}
					for(var i=0; i<numOfCallbacks; i++) {
						var listener = this.listeners[type][i];
						if((scope ? listener.scope == scope : true) && listener.callback == callback) {
							return true;
						}
					}
				}
				return false;
			},
			getEvents:function() {
				var str = "";
				for(var type in this.listeners) {
					var numOfCallbacks = this.listeners[type].length;
					for(var i=0; i<numOfCallbacks; i++) {
						var listener = this.listeners[type][i];
						str += listener.scope && listener.scope.className ? listener.scope.className : "anonymous";
						str += " listen for \"" + type + "\"\n";
					}
				}
				return str;
			}
		};

		if( !pannellum.hasOwnProperty("eventBus") ) {
			pannellum.eventBus =  new EventBusClass();
		}

}(window, window.pannellum || (window.pannellum={}),undefined));
