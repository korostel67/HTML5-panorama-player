/*
 * Default settings
 * Registered modules, controls and panoramas
 */

(function(pannellum, document, undefined) {

	"use strict";

	if( !pannellum.hasOwnProperty("dataTypes") ) pannellum.dataTypes = {}

	////// Boolean prototype ///////
	//defaults.title = pannellum.dataTypes.dtBool({ default: true, strict:false });
	var DtBool = function(config){
		this.type = "dtBool";
		this.strict = false;
		this.default = false;
		if( config && typeof config == "object" ) {
			if( config.hasOwnProperty("strict") ) this.strict = Boolean( config.strict );
			if( config.hasOwnProperty("default") ) this.default = Boolean( config.default );
		}
	}
	DtBool.prototype.check = function(value) {
		if( typeof value == "undefined" ) {
			if(this.strict) throw new pannellum.customErrors.dataTypeError( "The value must be set." );
			value = this.default;
		}else{
			value = Boolean( value );
		}
		return value;
	}
	pannellum.dataTypes.dtBool = function(config) { return new DtBool(config); }

	var DtCountable = function(config){
		this.type = "dtCountable";
		this.strict = false;
		this.min = 0;
		this.max = 255;
		if( config && typeof config == "object" ) {
			if( config.hasOwnProperty("strict") ) this.strict = Boolean( config.strict );
			if( config.hasOwnProperty("min") ) this.min = Number( config.min );
			if( config.hasOwnProperty("max") ) this.max = Number( config.max );
			if( this.min > this.max ) {
				this.max = this.min;
				if(this.strict) throw new pannellum.customErrors.dataTypeError( "The min ("+this.min+") value is more then max ("+this.max+") value." );
			}
		}
	}
	DtCountable.prototype.check = function(value) {
		if( typeof value == "undefined" ) {
			if(this.strict) throw new pannellum.customErrors.dataTypeError( "The value must be set." );
			value = this.default;
		}
		return value;
	}

	////// String prototype ///////
	//defaults.title = pannellum.dataTypes.dtString({ min: 4, max: 30, default: "Test" });
	var DtString = function(config){
		DtString.superclass.constructor.apply(this, arguments);
		this.type = "dtString";
		this.default = "";
		this.pattern = null;
		if( config && typeof config == "object" ) {
			if( config.hasOwnProperty("default") ) this.default = config.default;
			if( config.default !== null && this.default.length < this.min ) {
				this.default = this.default + ( Array( this.min - this.default.length + 1 ).join("*") );
				if(this.strict) throw new pannellum.customErrors.dataTypeError( "The default\'s value number of characters is less then min ("+this.min+") value." );
			}
			if( config.default !== null && this.default.length > this.max ) {
				this.default.substring(0, this.max);
				if(this.strict) throw new pannellum.customErrors.dataTypeError( "The default\'s value number of characters is more then max ("+this.max+") value." );
			}
			if( config.hasOwnProperty("pattern") ) this.pattern = config.pattern;
			if( config.default !== null && this.default.length && this.pattern && !this.pattern.test(this.default) ) {
				if(this.strict)  throw new pannellum.customErrors.dataTypeError( "The default\'s value doesn\'t match the pattern." );
			}
		}
	}
	pannellum.util.extend(DtString, DtCountable);
	//var newTitle = "ab";
	//var newTitle = defaults.title.check(newTitle);
	DtString.prototype.check = function(value) {
		var value = DtCountable.prototype.check.apply(this, arguments);
		value = String( value );
		var ln = value.length;
		if( ln < this.min ) {
			if(this.strict) throw new pannellum.customErrors.dataTypeError( "The value length is less then min ("+this.min+") number of characters." );
			value = this.default;
		}
		if( ln > this.max ) {
			value = value.substring(0, this.max);
			if(this.strict) throw new pannellum.customErrors.dataTypeError( "The value length is more then max ("+this.max+") number of characters." );
			value = (this.default !== null) ? this.default : "";
		}

		if( this.pattern && !this.pattern.test(value) ) {
			if(this.strict) throw new pannellum.customErrors.dataTypeError( "The value \"" + value + "\" doesn\'t match the pattern." );
			value = (this.default !== null) ? this.default : "";
		}
		//if( !this.noValue && !value ) throw new pannellum.customErrors.dataTypeError( "The value must be set." );
		return value;
	}
	pannellum.dataTypes.dtString = function(config) { return new DtString(config); }

	////// Url prototype ///////
	//defaults.url = pannellum.dataTypes.dtUrl({ min: 15, max: 30, default: "Test" });
	var DtUrl = function(config){
		DtString.superclass.constructor.apply(this, arguments);
		var urlSize =  {
			min : 11, //http://a.ru
			max : 2000
		}
		this.type = "dtUrl";
		if( this.min < urlSize.min ) this.min = urlSize.min;
		if( this.max > urlSize.max ) this.max = urlSize.max;
	}
	pannellum.util.extend(DtUrl, DtString);
	//var newUrl = "http://a.ru";
	//var newUrl = defaults.url.check(newUrl);
	pannellum.dataTypes.dtUrl = function(config) { return new DtUrl(config); }

	////// Degree prototype ///////
	//defaults.yaw = pannellum.dataTypes.dtNumber({ min: -360, max: 360, default: 0 });
	var DtNumber = function(config) {
		DtNumber.superclass.constructor.apply(this, arguments);
		this.type = "dtNumber";
		this.default = 0;
		if( config && typeof config == "object" ) {
			if( config.hasOwnProperty("default") ) this.default = Number( config.default );
			if( this.default < this.min ) {
				this.default = this.min;
				if(this.strict) throw new pannellum.customErrors.dataTypeError( "The default\'s value is less then min ("+this.min+") value." );
			}
			if( this.default > this.max ) {
				this.default = this.max;
				if(this.strict) throw new pannellum.customErrors.dataTypeError( "The default\'s value is more then max ("+this.max+") value." );
			}
		}
	}
	pannellum.util.extend(DtNumber, DtCountable);
	//var newYaw = 120;
	//var newYaw = defaults.yaw.check(newYaw);
	DtNumber.prototype.check = function(value) {
		var value = DtCountable.prototype.check.apply(this, arguments);
		value = Number( value );
		if( value < this.min ) {
			value = this.default;
			if(this.strict) throw new pannellum.customErrors.dataTypeError( "The value is less then min ("+this.min+") value." );
		}
		if( value > this.max ) {
			value = this.default;
			if(this.strict) throw new pannellum.customErrors.dataTypeError( "The value is more then max ("+this.max+") value." );
		}
		if( typeof value == "undefined" ) throw new pannellum.customErrors.dataTypeError( "The value must be set." );
		return value;
	}
	pannellum.dataTypes.dtNumber = function(config) { return new DtNumber(config); }

	////// Component Settings prototype ///////
	var DtComponents = function(config){
		this.type = "DtComponentSettings";
		this.strict = false;
		this.rel = ""; // componet family relation
		if( config && typeof config == "object" ) {
			if( config.hasOwnProperty("strict") ) this.strict = Boolean( config.strict );
		}
	}

	//var pano = "equirectangular";
	//var pano = defaults.type.check( pano );
	DtComponents.prototype.check = function(value) {
		//value is array of: [["compType",{settingsObject}],...]
		//if value is empty or not an array
		if( value.constructor != Array ) {
			value = [];
			if(this.strict) throw new pannellum.customErrors.dataTypeError( "The value is not Array." );
		}
		// do nothing, as there are no components defined
		if( value.length == 0 ) return value;
		var i, valueLength = value.length, compSettings, partSymbol = "components." + this.rel;
		for(i=0; i<valueLength; i++) {
			compSettings = pannellum.util.getSettings( value[i] );
			if(!compSettings) {
				if(this.strict) throw new pannellum.customErrors.dataTypeError( "The component settings is incorrect." );
				continue;
			}
			if( !pannellum.dependencies.hasOwnProperty( partSymbol + "." + compSettings.name ) ) {
				if(this.strict) throw new pannellum.customErrors.dataTypeError( "The type '" + this.rel + "." + compSettings.name + "' is not supported." );
				continue;
			}
			if( !compSettings.settings || Object.isEmpty(compSettings.settings) ){
				if(this.strict) throw new pannellum.customErrors.dataTypeError( "The settings for '" + this.rel + "." + compSettings.name + "' are not defined." );
				continue;
			}
		}
		return value;
	}
	////// DtHotSpots //////
	var DtHotSpots = function(config) {
		DtHotSpots.superclass.constructor.apply(this, arguments);
		this.type = "DtHotSpots";
		this.rel = "hotSpots";
	}
	pannellum.util.extend(DtHotSpots, DtComponents);
	pannellum.dataTypes.dtHotSpots = function(config) { return new DtHotSpots(config); }

}(window.pannellum || (window.pannellum={}), document, undefined));
