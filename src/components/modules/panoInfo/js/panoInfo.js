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
					["info", { name : 'div', attributes : {'className': 'pnlm-info-box'}}]
				]);
				This.update( {title:"Module Panorama info",info:"Just testing it"} );
				This.show();
				//end test
			}
		} }, document.head);
	}
	//pannellum.util.extend(PanoInfo, pannellum.components.modules.baseClasses.contentBox);
	pannellum.util.extend(PanoInfo, pannellum.components.modules.contentBox);
	
	pannellum.components.modules.panoInfo = PanoInfo;
	

}(window.pannellum || (window.pannellum={}), document));
