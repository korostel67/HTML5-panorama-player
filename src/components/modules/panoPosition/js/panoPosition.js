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

		var box = pannellum.util.domElement.create({ name : "div", attributes : {"className": "pnlm-box"}}, this.container);
		var crossChar = pannellum.util.domElement.create({ name : "div", attributes : {"className": "pnlm-module-panoPosition-pnlm-crossChar"}}, this.container);
		pannellum.util.domElement.create({ name : "div", attributes : {"className": "vline"}}, crossChar);
		pannellum.util.domElement.create({ name : "div", attributes : {"className": "hline"}}, crossChar);

		pannellum.util.domElement.create({ name : 'link', attributes : {
			href: 'src/components/modules/panoPosition/css/styles.css',
			onload : function(){
				This.addFields([
					["title", { name : 'div', attributes : {'className': 'pnlm-title-box'}}],
					["pitchT", { name : 'div', attributes : {'className': 'pnlm-title-box'}}],
					["pitch", { name : 'div', attributes : {'className': 'pnlm-info-box'}}],
					["yawT",   { name : 'div', attributes : {'className': 'pnlm-title-box'}}],
					["yaw",   { name : 'div', attributes : {'className': 'pnlm-info-box'}}]
				], box);
				This.update( {title:"Positions", pitchT:"Pitch", pitch:"0", yawT:"Yaw", yaw:"0"} );

				pannellum.eventBus.addEventListener("pano_initialized", function(event) {
					var title = event.dispatcher.getTitle();
					This.update({title:title, pitchT:"Pitch", pitch:"0", yawT:"Yaw", yaw:"0"} );
				});

				pannellum.eventBus.addEventListener("panorama:render", function(event) {
					var yaw 	= event.dispatcher.getYaw();
					var pitch = event.dispatcher.getPitch();
					This.update( { pitch: pitch, yaw: yaw } );
				}, this);
				This.show();
			}
		} }, document.head);
	}
	pannellum.util.extend(PanoPosition, pannellum.components.modules.contentBox);

	pannellum.components.modules.panoPosition = PanoPosition;


}(window.pannellum || (window.pannellum={}), document));
