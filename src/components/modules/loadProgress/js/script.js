/////////////Modules/////////////////
(function(pannellum, document, undefined) {

	"use strict";

	if( !pannellum.components.modules.hasOwnProperty("contentBox") ) throw new Error("pannellum.components.modules.contentBox class is undefined");

///// Load progress bar /////
	var LoadProgress = function(host, hostContainer, config) {
		LoadProgress.superclass.constructor.apply(this, arguments);
		var This = this;
		this.name = 'LoadProgress';
		this.container.classList.add('pnlm-module-loadProgress');

		var box = pannellum.util.domElement.create({ name : "div", attributes : {"className": "pnlm-box"}}, this.container);

		this.addFields([
			["title", { name : 'div', attributes : {'className': 'pnlm-title-box'}}],
			["numerator", { name : 'div', attributes : {'className': 'pnlm-info-box'}}],
			["denominator", { name : 'div', attributes : {'className': 'pnlm-info-box'}}],
			["unit", { name : 'div', attributes : {'className': 'pnlm-info-box'}}]
		], box);
		this.update( {title:"Loading", numerator:"0", denominator:"0", unit:"0"} );

		pannellum.eventBus.addEventListener("panorama:image_loaded", function(event) {
			This.hide();
		});

		pannellum.eventBus.addEventListener("panorama:load_progress", function(event, data) {
			if (This.isHidden()) {
				This.show();
			}
			This.update( {title:"Loading", numerator:data.numerator, denominator:data.denominator, unit:data.unit, unit:data.percent} );
		}, this);
	}
	pannellum.util.extend(LoadProgress, pannellum.components.modules.contentBox);

	pannellum.components.modules.loadProgress = LoadProgress;

	pannellum.util.domElement.create({ name : 'link', attributes : {
		href: 'src/components/modules/loadProgress/css/styles.css'} }, document.head);

}(window.pannellum || (window.pannellum={}), document));
