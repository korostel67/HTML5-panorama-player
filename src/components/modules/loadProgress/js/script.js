/////////////Modules/////////////////
(function(pannellum, document, undefined) {

	"use strict";

	if( !pannellum.components.modules.hasOwnProperty("contentBox") ) throw new Error("pannellum.components.modules.contentBox class is undefined");

///// Load progress hexagon /////
	var LoadProgress  = function(host, hostContainer, config) {
		LoadProgress.superclass.constructor.apply(this, arguments);
		var This         = this;
		this.name        = 'LoadProgress';
		this.modulePath  = this.host.getBasePath() + 'src/components/modules/loadProgress/';
		this.container.classList.add('pnlm-module-loadProgress');
		var svgObject    = pannellum.util.domElement.create({
			name : 'object',
			attributes : {
				'className' : 'pnlm-svg',
				'data'      : this.modulePath + 'img/hexagon.svg',
				'type'      : 'image/svg+xml',
				'width'     : '100%',
				'height'    : '100%'
			}
		}, this.container);

		this.addFields([
			["percentage", { name : 'div', attributes : {'className': 'percentage text'}, content: "0" }],
			["sign", { name : 'div', attributes : {'className': 'sign text'}, content: "%" }]
		]);
		this.update({percentage: '0%'});
		pannellum.eventBus.addEventListener("panorama:image_loaded", function(event) {
			This.hide();
			This.update({percentage: 0});
		});

		pannellum.eventBus.addEventListener("panorama:load_progress", function(event, data) {
			if (This.isHidden()) {
				This.show();
			}
			This.update({percentage: Math.round(data.percent)});
		}, this);

		pannellum.util.loadResource({ name : 'link', attributes : {
			href: This.modulePath + 'css/styles.css'} }, document.head);

	}
	pannellum.util.extend(LoadProgress, pannellum.components.modules.contentBox);

	pannellum.components.modules.loadProgress = LoadProgress;

}(window.pannellum || (window.pannellum={}), document));
