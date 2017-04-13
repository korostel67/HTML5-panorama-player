/////////////Controls/////////////////
(function(pannellum, document, undefined) {

	"use strict";
	//pannellum.components.controls.control
	//if( !pannellum.hasOwnProperty("components") ) pannellum.components={};
	//if( !pannellum.components.hasOwnProperty("controls") ) pannellum.components.controls={};
	//if( !pannellum.components.hasOwnProperty("component") ) throw new Error("pannellum.components.component is undefined");
	//if( !pannellum.components.controls.baseClasses.hasOwnProperty("control") ) throw new Error("pannellum.components.controls.baseClasses.control class is undefined");
	if( !pannellum.components.controls.hasOwnProperty("control") ) throw new Error("pannellum.components.controls.control class is undefined");

///// Fullscreaner /////
	var Fullscreen = function(host, hostContainer, config) {
		Fullscreen.superclass.constructor.apply(this, arguments);
		var This = this;
		this.name = "Fullscreen";

		//Data type section.
		//It has plase in cinstructor if components uses data from config argument.
		if( !pannellum.dataTypes ) throw new Error("pannellum.dataTypes is undefined");
		var dataTypes = {
			top : pannellum.dataTypes.dtString({ default: '66px', pattern: /^(\d*)(px|%)$/, strict: true  }),
			left : pannellum.dataTypes.dtString({ default: '4px', pattern: /^(\d*)(px|%)$/ , strict: true  }),
		}
		this.checkConfig(config, dataTypes);
		//End of Data type section

		if( this.config.top ) this.container.style.top = this.config.top;
		if( this.config.left ) this.container.style.left = this.config.left;
		pannellum.util.domElement.setAttr(this.container, { 'className' : ((this.container.className) ? this.container.className + ' ' : '') + 'pnlm-fullscreen-toggle-button pnlm-fullscreen-toggle-button-inactive', 'id':'fullscreen'});

		if ( this.fullscreenAnabled() ) {
			//Load styles
			pannellum.util.domElement.create({ name : 'link', attributes : { href:'src/components/controls/fullscreen/css/styles.css' , onload : function(){
				This.container.addEventListener('click', function(){
					This.toggleFullscreen();
				});
				pannellum.eventBus.addEventListener("pano_ready", function(event) {
					This.show();
				}, This);

				pannellum.eventBus.addEventListener("fullscreen_change", function(event, prop) {
					This.update(prop);
				}, This);

				//test control
				This.show();
				//end test
			}} }, document.head );
		}
	}

	//pannellum.util.extend(Fullscreen, pannellum.components.controls.baseClasses.control);
	pannellum.util.extend(Fullscreen, pannellum.components.controls.control);

	Fullscreen.prototype.show = function(prop){
		if ( this.fullscreenAnabled() ) {
			Fullscreen.superclass.show.apply(this, arguments);
		}
	}
	Fullscreen.prototype.update = function(prop){
		if(prop.active === true) {
			this.container.classList.add('pnlm-fullscreen-toggle-button-active');
		}else {
			this.container.classList.remove('pnlm-fullscreen-toggle-button-active');
		}
	}
	Fullscreen.prototype.toggleFullscreen = function(){
		this.host.toggleFullscreen()
	}
	Fullscreen.prototype.fullscreenAnabled = function(){
		if (document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled) {
			return true;
		}else{
			return false;
		}
	}

	//pannellum.components.controls.baseClasses.fullscreen = Fullscreen;

	pannellum.components.controls.fullscreen = Fullscreen;


}(window.pannellum || (window.pannellum={}), document));
