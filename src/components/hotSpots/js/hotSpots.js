/////////////Varies Hot Spots/////////////////
(function(pannellum, document, undefined) {
	if( !pannellum.components.hotSpots.hasOwnProperty("hotSpot") ) throw new Error("pannellum.components.hotSpots.hotSpot class is undefined");

	/////// PanoramaHotSpot Class ///////
	var PanoramaHotSpot = function(host, hostContainer, config){
		PanoramaHotSpot.superclass.constructor.apply(this, arguments);
		this.name = "PanoramaHotSpot";
		this.blocked = false;
		pannellum.util.domElement.setAttr(this.container, { 'className' : ((this.container.className) ? this.container.className + ' ' : '') + 'pnlm-' + this.name});

		var span = this.container.childNodes[0];
		if ( this.config.hasOwnProperty('sceneId') && this.config.sceneId ) {
			this.container.onclick = function() {
				if( This.hotspotState.locked() ) return false;
				pannellum.eventBus.dispatch( "panorama_to_load", This, {panoId : This.config.sceneId, targetPitch : This.config.targetPitch, targetYaw : This.config.targetYaw} );
				return false;
			};
			this.container.ontouchend = function() {
				if( This.hotspotState.locked() ) return false;
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
		return this.container;
	}
	pannellum.components.hotSpots.video = VideoHotSpot;

}(window.pannellum || (window.pannellum={}), document));
