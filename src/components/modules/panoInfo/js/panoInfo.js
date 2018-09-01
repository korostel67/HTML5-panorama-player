/////////////Modules/////////////////
(function(pannellum, document, undefined) {

	"use strict";

	//if( !pannellum.components.modules.baseClasses.hasOwnProperty("contentBox") ) throw new Error("pannellum.components.modules.baseClasses.contentBox class is undefined");
	if( !pannellum.components.modules.hasOwnProperty("contentBox") ) throw new Error("pannellum.components.modules.contentBox class is undefined");

///// Panorama info /////
	var PanoInfo = function(host, hostContainer, config) {
		PanoInfo.superclass.constructor.apply(this, arguments);
		var This = this;
		this.name = 'panoInfo';
		this.container.classList.add('pnlm-panorama-info');

		pannellum.util.domElement.create({ name : 'link', attributes : {
			href: 'src/components/modules/panoInfo/css/styles.css',
			onload : function(){
				This.addFields([
					["title", { name : 'div', attributes : {'className': 'pnlm-title-box'}}],
					["pitchT", { name : 'div', attributes : {'className': 'pnlm-title-box'}}],
					["pitch", { name : 'div', attributes : {'className': 'pnlm-info-box'}}],
					["yawT",   { name : 'div', attributes : {'className': 'pnlm-title-box'}}],
					["yaw",   { name : 'div', attributes : {'className': 'pnlm-info-box'}}]
				]);
				This.update( {title:"Position", pitchT:"Pitch", pitch:"0", yawT:"Yaw", yaw:"0"} );
				pannellum.eventBus.addEventListener("panorama:render", function(event) {
					var yaw 	= event.dispatcher.getYaw();
					var pitch = event.dispatcher.getPitch();
					This.update( { pitch: pitch, yaw: yaw } );
				}, this);
				This.show();
			}
		} }, document.head);
	}
	//pannellum.util.extend(PanoInfo, pannellum.components.modules.baseClasses.contentBox);
	pannellum.util.extend(PanoInfo, pannellum.components.modules.contentBox);

	pannellum.components.modules.panoInfo = PanoInfo;


}(window.pannellum || (window.pannellum={}), document));
