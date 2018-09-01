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
			var dataTypes = {
				yaw : pannellum.dataTypes.dtNumber({ min: -360, max: 360, default: 0 }),
				pitch : pannellum.dataTypes.dtNumber({ min: -85, max: 85, default: 0 }),
				info : pannellum.dataTypes.dtString({ min: 0, max: 30, strict: false }),
				sceneId : pannellum.dataTypes.dtString({ min: 2, max: 30, strict: false }),
				targetYaw :  pannellum.dataTypes.dtString({ min: 1, max: 30, pattern: /^-?[0-9]*|same|sameAzimuth$/, default: "0" }),
				targetPitch :  pannellum.dataTypes.dtString({ min: 1, max: 30, pattern: /^-?[0-9]|same$/, default: "0" }),
			}
			this.checkConfig(config, dataTypes);
			var This = this;
			pannellum.util.domElement.create({ name : 'link', attributes : {
				href: 'src/components/hotSpots/css/styles.css',
				onload : function(){
					pannellum.util.domElement.setAttr(This.container, { 'className' : ((This.container.className) ? This.container.className + ' ' : '') + 'pnlm-hotspot pnlm-sprite' });

					This.show();

					// Tooltip defining after the containner is valid to calculate width and height
					if (This.config.info) {
						pannellum.util.domElement.setAttr(This.container, { 'className' : This.container.className + ' tooltiped' });
						This.tooltip = pannellum.util.domElement.create({ name : 'span' });
						pannellum.util.domElement.setContent( This.tooltip, pannellum.util.escapeHTML(This.config.info) );
						This.container.appendChild(This.tooltip);
						pannellum.util.domElement.setAttr(This.tooltip, {
							'className' : 'pnlm-tooltip'
						});

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
				}
			} }, document.head);

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
		* Creates hotSpot HTMLElement
		^ @memberof HotSpot
		* @param {HTMLElement} HTML Container for hotSpots HTMLElements
		*/
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
		pannellum.util.domElement.setAttr(this.container, { 'className' : ((this.container.className) ? this.container.className + ' ' : '') + 'pnlm-' + this.name});

		var span = this.container.childNodes[0];
		if ( this.config.hasOwnProperty('sceneId') && this.config.sceneId ) {
			var This = this;

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
			pannellum.util.domElement.setAttr(this.container, {'style':{'cursor':'pointer'}});
			pannellum.util.domElement.setAttr(span, {'style':{'cursor':'pointer'}});

		}
	}
	pannellum.util.extend(PanoramaHotSpot, pannellum.components.hotSpots.hotSpot);

	pannellum.components.hotSpots.panorama = PanoramaHotSpot;

	/////// LinkHotSpot Class ///////
	var LinkHotSpot = function(host, hostContainer, config){
		LinkHotSpot.superclass.constructor.apply(this, arguments);
		this.openUrl = function(url) {
			var win;// = window.open( encodeURI(url) );
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
	LinkHotSpot.prototype.create = function() {
		LinkHotSpot.superclass.create.apply(this, arguments);
		var This = this;
		var span = this.container.childNodes[0];
		pannellum.util.domElement.setAttr(this.container, {'style':{'cursor':'pointer'}});
		pannellum.util.domElement.setAttr(span, {'style':{'cursor':'pointer'}});
		this.container.onclick = function() {
			if( This.hotspotState.locked() ) return false;
			This.openUrl(This.config.URL);
			return false;
		};
		this.container.ontouchend = function() {
			if( This.hotspotState.locked() ) return false;
			This.openUrl(This.config.URL);
			return false;
		};

		this.show();
		return this.container;
	}
	pannellum.components.hotSpots.link = LinkHotSpot;

	/////// ImageHotSpot Class ///////
	var ImageHotSpot = function(host, hostContainer, config){
		ImageHotSpot.superclass.constructor.apply(this, arguments);
	}
	pannellum.util.extend(ImageHotSpot, pannellum.components.hotSpots.hotSpot);
	ImageHotSpot.prototype.create = function() {
		ImageHotSpot.superclass.create.apply(this, arguments);
		var span = this.container.childNodes[0];
		var a = pannellum.util.domElement.create({
			name : 'a',
			attributes : {
				'href' : encodeURI(this.config.image),
				'target' :'_blank'
			}
		});
		span.appendChild(a);
		var image = pannellum.util.domElement.create({
			name : 'img',
			attributes : {
				'src' : encodeURI(this.config.image),
				'style' : { 'width' : this.config.width + 'px', 'paddingTop' : '5px' }
			}
		});
		a.appendChild(image);
		pannellum.util.domElement.setAttr(span, {'style':{'maxWidth':'initial'}});
		this.show();
		return this.container;
	}
	pannellum.components.hotSpots.image = ImageHotSpot;

	/////// VideoHotSpot Class ///////
	var VideoHotSpot = function(host, hostContainer, config){
		VideoHotSpot.superclass.constructor.apply(this, arguments);
	}
	pannellum.util.extend(VideoHotSpot, pannellum.components.hotSpots.hotSpot);
	VideoHotSpot.prototype.create = function() {
		VideoHotSpot.superclass.create.apply(this, arguments);
		var span = this.container.childNodes[0];
		var video = pannellum.util.domElement.create({
			name : 'video',
			attributes : {
				'src' : encodeURI(this.config.video),
				'controls' : true,
				'style' : { 'width' : this.config.width + 'px' }
			}
		});
		pannellum.util.domElement.setAttr(span, {'style':{'maxWidth':'initial'}});
		span.appendChild(video);
		this.show();
		return this.container;
	}
	pannellum.components.hotSpots.video = VideoHotSpot;

}(window.pannellum || (window.pannellum={}), document));
