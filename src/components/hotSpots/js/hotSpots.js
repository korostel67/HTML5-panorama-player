/////////////Varies Hot Spots/////////////////
(function(pannellum, document, undefined) {

		if( !pannellum.components.hasOwnProperty("hotSpots") ) pannellum.components.hotSpots={};

		/**
		 * HotSpot Base Class
		 * @class
		 ^ @extends pannellum.components.component
		 ^ @param {HTMLElement} The host
		 ^ @param {HTMLElement} The host container
		 ^ @param {object} Configuration
		 * @property {string} name
		 * @property {string} type - Module type (hotSpot). This type will have all the inheritors.
		 * @property {HTMLElement} host - Viever instance
		 * @property {HTMLElement} hostContainer - Host HTML Container where hotSpots
																							container will be placed
		 * @property {HTMLElement} container - HTML Container for hotSpots HTMLElements
		 * @property {object} config - HotSpot configuration
		 */
		var HotSpot = function(host, hostContainer, config){
			HotSpot.superclass.constructor.apply(this, arguments);
			this.name = "HotSpot";
			this.type = "hotSpot";
			this.tooltip;
			this.info;
			this.image;
			var dataTypes = {
				yaw : pannellum.dataTypes.dtNumber({ min: -360, max: 360, default: 0 }),
				pitch : pannellum.dataTypes.dtNumber({ min: -85, max: 85, default: 0 }),
				info : pannellum.dataTypes.dtString({ min: 0, max: 30, strict: false }),
				sceneId : pannellum.dataTypes.dtString({ min: 2, max: 30, strict: false }),
				targetYaw :  pannellum.dataTypes.dtString({ min: 1, max: 30, pattern: /^-?[0-9]*|same|sameAzimuth$/, default: "0" }),
				targetPitch :  pannellum.dataTypes.dtString({ min: 1, max: 30, pattern: /^-?[0-9]|same$/, default: "0" }),
				URL : pannellum.dataTypes.dtUrl({ min: 10, /*max: 30,*/ strict: false }),
				image : pannellum.dataTypes.dtString({ min: 10, /*max: 30,*/ strict: false, default:null })
			}
			this.checkConfig(config, dataTypes);
			// Wait for HotSpotsCollection finish loading styles
			pannellum.eventBus.addEventListener("HotSpotsCollection:ready", function(event) {
				pannellum.util.domElement.setAttr(this.container, { 'className' : ((this.container.className) ? this.container.className + ' ' : '') + 'pnlm-hotspot pnlm-sprite pnlm-' + this.name });
				this.show();
			}, this);
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

		/**
		* Resize Tooltip
		* @memberof HotSpot
		*/
		HotSpot.prototype.resizeTooltip = function(){
			if (typeof this.tooltip == 'undefined') return false;
			var This = this;
			// Width correction for info more then n characters
			var wc = (This.config.info.length > 10) ? 70:0;
			pannellum.util.domElement.setAttr(This.tooltip, {'style': {
				'width' : This.tooltip.scrollWidth + wc  + 'px'
			}});
			pannellum.util.domElement.setAttr(This.tooltip, {'style': {
				'marginLeft' : -(This.tooltip.scrollWidth - This.container.offsetWidth+13) / 2 + 'px',
				'marginTop' : -(This.tooltip.scrollHeight + 12) + 'px',
			}});
		}

		/**
		* Create tooltip
		* @memberof HotSpots
		*/
		HotSpot.prototype.createTooltip = function(config) {
			if (typeof this.tooltip !== 'undefined') return false;
			if (!this.config || (!this.config.info &&
				!this.config.hasOwnProperty.image)
			) { return false; }

			pannellum.util.domElement.setAttr(this.container, { 'className' : this.container.className + ' tooltiped' });
			this.tooltip = pannellum.util.domElement.create({ name : 'span' });

			if (this.config.info) {
				this.info = pannellum.util.domElement.create({ name : 'span', attributes : {
					'className': 'pnlm-tooltip-info'
				}}, this.tooltip);
				pannellum.util.domElement.setContent( this.info, pannellum.util.escapeHTML(this.config.info) );
			}
			if (this.config.image) {
				this.image = pannellum.util.domElement.create({ name : 'span', attributes : {
					'className': 'pnlm-tooltip-image'
				}}, this.tooltip);
				var a = pannellum.util.domElement.create({
					name : 'a',
					attributes : {
						'href' : encodeURI(this.config.image),
						'target' :'_blank'
					}
				}, this.image);
				var img = pannellum.util.domElement.create({
					name : 'img',
					attributes : {
						'src' : encodeURI(this.config.image)
					}
				}, a);
			}

			this.container.appendChild(this.tooltip);
			pannellum.util.domElement.setAttr(this.tooltip, {
				'className' : 'pnlm-tooltip'
			});
		}

		/**
		* Show HotSpot
		^ @memberof HotSpot
		*/
		HotSpot.prototype.show = function(){
			pannellum.util.domElement.show(this.container, 'visible');
		}

		/**
		* Hide HotSpot
		^ @memberof HotSpot
		*/
		HotSpot.prototype.hide = function(){
			pannellum.util.domElement.hide(this.container, 'visible');
		}

		/**
		* Destroys hotSpot HTMLElement
		^ @memberof HotSpot
		*/
		HotSpot.prototype.destroy = function() {
			this.container.removeChild( this.container );
			this.container = undefined;
		}

		/**
		* Transforms hotSpot HTMLElement
		^ @memberof HotSpot
		* @param {object} HotSpot new position
		*/
		HotSpot.prototype.translate = function(position) {
			var transform = 'translate(' + position.x + 'px, ' + position.y + 'px) translateZ(9999px)';
			pannellum.util.domElement.setAttr(this.container, {'style': {'webkitTransform' : transform}});
			pannellum.util.domElement.setAttr(this.container, {'style': {'MozTransform' : transform}});
			pannellum.util.domElement.setAttr(this.container, {'style': {'transform' : transform}});
		}

		/**@namespace*/
		pannellum.components.hotSpots.hotSpot = HotSpot;

	/////// PanoramaHotSpot Class ///////
	var PanoramaHotSpot = function(host, hostContainer, config){
		PanoramaHotSpot.superclass.constructor.apply(this, arguments);
		this.name = "PanoramaHotSpot";
		this.blocked = false;

		if ( this.config.hasOwnProperty('sceneId') && this.config.sceneId ) {
			var This = this;
			pannellum.eventBus.addEventListener("HotSpotsCollection:ready", function(event) {
				this.createTooltip();
				setTimeout(function(){
					This.resizeTooltip();
				},500);
			}, this);

			this.container.onclick = function() {
				//if( This.hotspotState.locked() ) return false;
				pannellum.eventBus.dispatch( "panorama_to_load", This, {panoId : This.config.sceneId, targetPitch : This.config.targetPitch, targetYaw : This.config.targetYaw} );
				return false;
			};

			this.container.ontouchend = function() {
				//if( This.hotspotState.locked() ) return false;
				pannellum.eventBus.dispatch( "panorama_to_load", This, {panoId : This.config.sceneId, targetPitch : This.config.targetPitch, targetYaw : This.config.targetYaw} );
				return false;
			};

		}
	}
	pannellum.util.extend(PanoramaHotSpot, pannellum.components.hotSpots.hotSpot);

	pannellum.components.hotSpots.panorama = PanoramaHotSpot;

	/////// LinkHotSpot Class ///////
	var LinkHotSpot = function(host, hostContainer, config){
		LinkHotSpot.superclass.constructor.apply(this, arguments);
		this.name = "LinkHotSpot";
		var This = this;

		pannellum.eventBus.addEventListener("HotSpotsCollection:ready", function(event) {
			this.createTooltip();
			setTimeout(function(){
				This.resizeTooltip();
			},500);
		}, this);

		this.container.onclick = function() {
			//if( This.hotspotState.locked() ) return false;
			This.openUrl(This.config.URL);
			return false;
		};
		this.container.ontouchend = function() {
			//if( This.hotspotState.locked() ) return false;
			This.openUrl(This.config.URL);
			return false;
		};
		this.openUrl = function(url) {
			var win = window.open( encodeURI(url) );
			if(win){
				//Browser has allowed it to be opened
				win.focus();
			}else{
				//Broswer has blocked it
				pannellum.eventBus.dispatch("warning", this, {name:'Warning', message: 'Can not open url "' + url + '". Please allow popups for this site', stack:'LinkHotSpot openUrl method.'} );
			}
		}
	}

	pannellum.util.extend(LinkHotSpot, pannellum.components.hotSpots.hotSpot);
	pannellum.components.hotSpots.link = LinkHotSpot;

	/////// VideoHotSpot Class ///////
	var VideoHotSpot = function(host, hostContainer, config){
		VideoHotSpot.superclass.constructor.apply(this, arguments);
		this.name = "VideoHotSpot";
		this.video;

		var This = this;
		pannellum.eventBus.addEventListener("HotSpotsCollection:ready", function(event) {
			this.createTooltip();
			this.video = pannellum.util.domElement.create({
				name : 'video',
				attributes : {
					'src' : encodeURI(this.config.video),
					'controls' : true,
					'style' : { 'width' : this.config.width + 'px' }
				}
			});
			this.tooltip.appendChild(this.video);

			setTimeout(function(){
				This.resizeTooltip();
			},500);
		}, this);
	}
	pannellum.util.extend(VideoHotSpot, pannellum.components.hotSpots.hotSpot);
	pannellum.components.hotSpots.video = VideoHotSpot;

	/////// InfoHotSpot Class ///////
	var InfoHotSpot = function(host, hostContainer, config){
		InfoHotSpot.superclass.constructor.apply(this, arguments);
		this.name = "InfoHotSpot";

		var This = this;
		pannellum.eventBus.addEventListener("HotSpotsCollection:ready", function(event) {
			this.createTooltip();
			setTimeout(function(){
				This.resizeTooltip();
			},500);
		}, this);
	}
	pannellum.util.extend(InfoHotSpot, pannellum.components.hotSpots.hotSpot);
	pannellum.components.hotSpots.info = InfoHotSpot;

}(window.pannellum || (window.pannellum={}), document));
