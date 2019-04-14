/////////////Modules/////////////////
(function(pannellum, document, undefined) {

	"use strict";

	if( !pannellum.components.modules.hasOwnProperty("contentBox") ) throw new Error("pannellum.components.modules.contentBox class is undefined");

///// Panorama position /////
	var PanoPosition = function(host, hostContainer, config) {
		PanoPosition.superclass.constructor.apply(this, arguments);
		var This = this;
		this.name = 'PanoPosition';
		this.container.classList.add('pnlm-module-panoPosition');
		this.position = {};

		var crossChar = pannellum.util.domElement.create({ name : "div", attributes : {"className": "pnlm-module-panoPosition-pnlm-crossChar"}}, this.container);
		pannellum.util.domElement.create({ name : "div", attributes : {"className": "vline"}}, crossChar);
		pannellum.util.domElement.create({ name : "div", attributes : {"className": "hline"}}, crossChar);

		var box = pannellum.util.domElement.create({ name : "div", attributes : {"className": "pnlm-box"}}, this.container);

		this.addFields([
			["title", { name : 'div', attributes : {'className': 'pnlm-title-box'}}],

			["nav_pano", { name : 'div', attributes : {'className': 'pnlm-nav-box', 'id' : 'nav_pano'}, content: 'Panorama'}],
			["nav_info", { name : 'div', attributes : {'className': 'pnlm-nav-box', 'id' : 'nav_info'}, content: 'Information'}],
			["nav_link", { name : 'div', attributes : {'className': 'pnlm-nav-box', 'id' : 'nav_link'}, content: 'Hyperlink'}],
			//["nav_video", { name : 'div', attributes : {'className': 'pnlm-nav-box', 'id' : 'nav_video'}, content: 'Video'}],

			["pitchT", { name : 'div', attributes : {'className': 'pnlm-title-box'}}],
			["pitch", { name : 'div', attributes : {'className': 'pnlm-info-box'}}],
			["yawT",   { name : 'div', attributes : {'className': 'pnlm-title-box'}}],
			["yaw",   { name : 'div', attributes : {'className': 'pnlm-info-box'}}]
		], box);
		this.update( {title:this.name, pitchT:"Pitch", pitch:"0", yawT:"Yaw", yaw:"0"} );

		pannellum.eventBus.addEventListener("panorama:initialized", function(event) {
			var yaw 	= event.dispatcher.getYaw();
			var pitch = event.dispatcher.getPitch();
			This.position = { pitch: pitch, yaw: yaw };
			This.update( { pitch: pitch, yaw: yaw } );
		});

		pannellum.eventBus.addEventListener("panorama:render", function(event) {
			var yaw 	= event.dispatcher.getYaw();
			var pitch = event.dispatcher.getPitch();
			This.position = { pitch: pitch, yaw: yaw };
			This.update( { pitch: pitch, yaw: yaw } );
		}, this);

		this.fields.nav_pano.addEventListener("click", function(event) {
			var text = '{\n' +
			  '  yaw         : ' + Math.round(This.position.yaw) + ',\n' +
				'  pitch       : ' + Math.round(This.position.pitch) + ',\n' +
				'  info        : "",\n' +
				'  //image     : "",\n' +
				'  sceneId     : "",\n' +
				'  targetYaw   : "same",\n' +
				'  targetPitch : "same",\n' +
				'}';
		  pannellum.util.copyTextToClipboard(text);
		});

		this.fields.nav_info.addEventListener("click", function(event) {
			var text = '{\n' +
			  '  yaw         : ' + Math.round(This.position.yaw) + ',\n' +
				'  pitch       : ' + Math.round(This.position.pitch) + ',\n' +
				'  info        : "",\n' +
				'  //image     : "",\n' +
				'}';
		  pannellum.util.copyTextToClipboard(text);
		});

		this.fields.nav_link.addEventListener("click", function(event) {
			var text = '{\n' +
			  '  yaw         : ' + Math.round(This.position.yaw) + ',\n' +
				'  pitch       : ' + Math.round(This.position.pitch) + ',\n' +
				'  info        : "",\n' +
				'  //image     : "",\n' +
				'  URL         : ""\n' +
				'}';
		  pannellum.util.copyTextToClipboard(text);
		});
/*
		this.fields.nav_video.addEventListener("click", function(event) {
			var text = '{\n' +
			  '  yaw         : ' + Math.round(This.position.yaw) + ',\n' +
				'  pitch       : ' + Math.round(This.position.pitch) + ',\n' +
				'  info        : "",\n' +
				'  //image     : "",\n' +
				'  URL         : ""\n' +
				'}';
		  pannellum.util.copyTextToClipboard(text);
		});
*/
		this.show();
	}
	pannellum.util.extend(PanoPosition, pannellum.components.modules.contentBox);

	pannellum.components.modules.panoPosition = PanoPosition;

	pannellum.util.loadResource({ name : 'link', attributes : {
		href: '~src/components/modules/panoPosition/css/styles.css'} }, document.head, pannellum.util.getBasePath());

}(window.pannellum || (window.pannellum={}), document));
