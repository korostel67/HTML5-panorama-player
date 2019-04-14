/////////////Varies Hot Spots/////////////////
(function(pannellum, document, undefined) {

		if( !pannellum.actions.hasOwnProperty("transitions") ) pannellum.actions.transitions={};
		if( pannellum.actions.transitions.hasOwnProperty("simpleOpacity") ) return false;

	/**
	 * SiimpleOpacity transition Class
	 * @class
	 ^ @param {object} Configuration
	 * @property {string} name
	 * @property {string} type - Action type
	 * @property {object} config - Component configuration
	 */
	var SimpleOpacity = function(host, config){
		SimpleOpacity.superclass.constructor.apply(this, arguments);
		this.name = "SimpleOpacity";
		this.type = "action";
		/*if( config && typeof config == "object" &&  dataTypes && typeof dataTypes == "object" ) {
			for(var ci in dataTypes) {
				if( !dataTypes.hasOwnProperty( ci ) ) continue;
				var value = (typeof config[ci] != "undefined") ? config[ci] : undefined;
				this.config[ci] = dataTypes[ci].check( value );
			}
		}*/
	}

	pannellum.util.extend(SimpleOpacity, pannellum.actions.action);

	/**
	* Runs action base method
	^ @memberof SimpleOpacity
	*/
	SimpleOpacity.prototype.run = function(fromObject, toObject){
		fromObject.classList.add('simpleOpasisyty-from');
		setTimeout(function(){fromObject.classList.add('simpleOpasisyty-to')}, 100);
		fromObject.addEventListener("transitionend", function(event) {
			fromObject.classList.remove('simpleOpasisyty-from');
			fromObject.classList.remove('simpleOpasisyty-to');
			pannellum.eventBus.dispatch('transition:done', this );
		}, false);
	}

	/**@namespace*/
	pannellum.actions.transitions.simpleOpacity = SimpleOpacity;

	pannellum.util.loadResource({ name : 'link', attributes : {
		href: '~src/actions/transitions/simpleOpacity/css/styles.css'} }, document.head, pannellum.util.getBasePath());

}(window.pannellum || (window.pannellum={}), document));
