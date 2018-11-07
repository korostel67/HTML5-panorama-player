/*
 * Pannellum classes dependancies
 */

(function(pannellum, document, undefined) {

var Util = {}
Util.extend = function(Child, Parent) {
 Child.prototype = Object.create(Parent.prototype);
 Child.prototype.constructor = Child;
 Child.superclass = Parent.prototype;
}

Util.loadScript = function(scriptsArray, domObject){
	if( !scriptsArray ) return null;
	if( !domObject ) domObject = document.head;
	var tagProp;
	var scriptElement;
	var pendingElemets = [];
	var firstElement = document.scripts[0];

 // to check if script was loaded before
  /*var els = document.querySelectorAll("a[href^='http://domain.com']");

  for (var i = 0, l = els.length; i < l; i++) {
    var el = els[i];
    el.innerHTML = el.innerHTML.replace(/link/gi, 'dead link');
  }*/

	// Watch scripts load in IE
	function stateChange( cb ) {
	  // Execute as many scripts in order as we can
	  var pendingScript;
	  while ( typeof pendingElemets[0]!="undefined" && (pendingElemets[0].readyState == "loaded" || pendingElemets[0].readyState == "complete") ) {
		pendingScript = pendingElemets.shift();
		// avoid future loading events from this scriptElement (eg, if src changes)
		pendingScript.onreadystatechange = null;
		// can't just appendChild, old IE bug if scriptElement isn't closed
		firstElement.parentNode.insertBefore(pendingScript, firstElement);
		//Callback
		if ( cb ) cb();
	  }
	}

	// loop through our scriptElement urls
	while (tagProp = scriptsArray.shift()) {
    var scrType;
    if(tagProp.hasOwnProperty('src')) {
      scrType = 'script';
    } else if (tagProp.hasOwnProperty('href')) {
      scrType = 'link';
    } else {
      throw new Error('Indefined element type to load');
    }
	  var scrProp = { name: scrType, attributes: tagProp }
	  if ("async" in firstElement) { // modern browsers
  		setTimeout((function(scrProp) {
  			scrProp.attributes.async = false;
  			scriptElement = Util.domElement.create(scrProp);
  			domObject.appendChild(scriptElement);
  			//Callback
  		}(scrProp)),1);
	  } else if (firstElement.readyState) { // IE<10
  		// create a scriptElement and add it to our todo pile
  		var cb;
  		if( scrProp.hasOwnProperty("attributes") && scrProp.attributes.hasOwnProperty("onload") ) {
  			cb = scrProp.attributes.onload;
  			delete scrProp.attributes.onload;
  		}
  		scriptElement = Util.domElement.create(scrProp);
  		scriptElement.onreadystatechange = function() { stateChange(cb) };
  		pendingElemets.push(scriptElement);
	  } else { // fall back to defer
  		scrProp.attributes.defer = undefined;
  		Util.domElement.write(scrProp);
	  }
	}
}

Util.httpBuildQuery = function(obj) {
	var esc = encodeURIComponent;
	var str_query = Object.keys(obj)
		.map(k => esc(k) + '=' + esc(obj[k]))
		.join('&');
	return str_query;
}

Util.httpGetQueryVars = function() {
	var queryVars = {};
	var str_query = window.location.search.substring(1);
	if( !str_query ) return queryVars;
	var i, ar_vars = str_query.split("&"), ar_varsLength = ar_vars.length;
	for (var i=0; i<ar_varsLength; i++) {
		var pair = ar_vars[i].split("=");
		queryVars[ pair[0] ] = decodeURIComponent( pair[1] ) || null;
	}
	return queryVars;
}

Util.setCurrentTime = function() {
	if (typeof performance !== "undefined" && performance.now()) {
		return performance.now();
	} else if ("now" in Date) {
		return Date.now();
	}else{
		return new Date.getTime();
	}
}

Util.getUniqId = function() {
	var id;
	var usedIds = [];
	return function(){
		do {
			id = Math.random().toString(36).substring(3, 8);
		} while (usedIds.indexOf(id) >= 0);
		usedIds.push(id);
		return id;
	}
}();
Util.escapeHTML = function(s) {
	return String(s).replace(/&/g, '&amp;')
		.replace('"', '&quot;')
		.replace("'", '&#39;')
		.replace('<', '&lt;')
		.replace('>', '&gt;')
		.replace('/', '&#x2f;');
}

/*
_setting = {
	url		: ""
	method	: "GET"|"POST", default GET
	async	: true|false, default true
	responseType : string, default "", https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType
	requestHeaders : {name:value}
	callbacks : {onload, onprogress}
	data : query string | object
	nocache : true|false, default false //prevent browser from cashing
}
var respData = Util.xHttpRequest(settigs);
*/
//Example of using pannellum.util.xHttpRequest method to load panorama
//var settigs = {
//	url		: "/tests/panorama/pano/rostov_5.jpg",
//	method	: "GET",
//	async	: true,
//	data : "a=3&b=23",
//	noCache : true,
//	onProgress: function(progress_data){
//		console.log(progress_data.numerator, progress_data.denominator, progress_data.unit);
//	},
//	responseType : "blob",
//	requestHeaders : {'Accept': "image/*,*/*;q=0.9"}
//}
//pannellum.util.xHttpRequest(settigs);

Util.xHttpRequest = function(_settings) {
	return new Promise(function(resolve, reject){
		if(!_settings) return false;

		var settings = {}
		//method, url, async, data, callbacks, responseType, requestHeaders
		var queryString = "", url;
		try{
			if(_settings.url) { url = settings.url = _settings.url; }else{
				throw new pannellum.customErrors.dataTypeError("The request url is not specified");
			}
		}catch( e ){
			reject( e );
		}
		settings.method = (_settings.method) ? _settings.method : "GET";
		settings.async = _settings.async || true;
		settings.noCache = _settings.noCache || false;
		settings.responseType = ( _settings.responseType )  ? _settings.responseType : "";
		if( _settings.requestHeaders ) settings.requestHeaders = _settings.requestHeaders;
		if( _settings.callbacks ) settings.callbacks = _settings.callbacks;
		switch(true) {
			case !_settings.data : settings.data = null; break;
			case typeof _settings.data == "string" : settings.data = _settings.data; break;
			case typeof _settings.data == "object" : settings.data = Util.httpBuildQuery (_settings.data); break;
		}
		if( settings.noCache ) queryString += "nocache=" + pannellum.util.setCurrentTime();
		settings.onProgress = ( _settings.onProgress )  ? _settings.onProgress : null;

		if( settings.method == "GET" &&  settings.data ) queryString += ((queryString)?"&":"") + settings.data;
		if( queryString ) url += "?" + queryString;

		var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
		var request = new XHR();

		request.onloadend = function() {
			try{
				if (request.status == 200) {
					resolve( request )
				}else{
					throw new pannellum.customErrors.notFoundError(request.statusText+": "+settings.url)
				}
			}catch(e){
				reject( e );
			}
		}
		request.onerror = function() {
			try{
				throw new pannellum.customErrors.requestError(request.statusText+": "+settings.url);
			}catch(e){
				reject( e );
			}
		};
		if( settings.onProgress ) {
			request.onprogress = function(e) {
				var progress_data;
				if (e.lengthComputable) {
					progress_data = {}
					progress_data.percent = e.loaded / e.total * 100;
					var unit, numerator, denominator;
					if (e.total > 1e6) {
					  unit = 'MB';
					  numerator = (e.loaded / 1e6).toFixed(2);
					  denominator = (e.total / 1e6).toFixed(2);
					} else if (e.total > 1e3) {
					  unit = 'kB';
					  numerator = (e.loaded / 1e3).toFixed(1);
					  denominator = (e.total / 1e3).toFixed(1);
					} else {
					  unit = 'B';
					  numerator = e.loaded;
					  denominator = e.total;
					}
					progress_data.numerator = numerator;
					progress_data.denominator = denominator;
					progress_data.unit = unit;
				} else {
					progress_data = null;
				}
				settings.onProgress( progress_data );
			}
		}
		try{
			request.open( settings.method, url, settings.async );
			if(settings.responseType) request.responseType = settings.responseType;
			if( !Object.isEmpty(settings.requestHeaders) ) {
				for(var rh in settings.requestHeaders) {
					if( !settings.requestHeaders.hasOwnProperty(rh) ) continue;
					request.setRequestHeader( rh, settings.requestHeaders[ rh ]);
				}
			}
			request.send(settings.data);
		}catch(e){
			reject( e );
		}
	});
}

Util.xHttpRequestOld = function(_settings) {
	if(!_settings) return false;

	var settings = {}
	//method, url, async, data, callbacks, responseType, requestHeaders
	var queryString = "";

	if(_settings.url) { settings.url = _settings.url; }else{
		throw new pannellum.customErrors.dataTypeError("The request url is not specified");
	}
	settings.method = (_settings.method) ? _settings.method : "GET";
	settings.async = _settings.async || true;
	settings.nocache = _settings.nocache || false;
	settings.responseType = ( _settings.responseType )  ? _settings.responseType : "";
	if( _settings.requestHeaders ) settings.requestHeaders = _settings.requestHeaders;
	if( _settings.callbacks ) settings.callbacks = _settings.callbacks;
	switch(true) {
		case !_settings.data : settings.data = null; break;
		case typeof _settings.data == "string" : settings.data = _settings.data; break;
		case typeof _settings.data == "object" : settings.data = Util.httpBuildQuery (_settings.data); break;
	}

	if( settings.nocache ) queryString += "nocache=" + pannellum.util.setCurrentTime();

	if( settings.method == "GET" &&  settings.data ) queryString += ((queryString)?"&":"") + settings.data;
	if( queryString ) settings.url += "?" + queryString;

	var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
	var request = new XHR();

	request.onloadend = function() {
		try{
			if (request.status == 200) {
				//resolve( request )
				if( settings.callbacks && settings.callbacks.onload) {
					settings.callbacks.onload( request );
				}
			}else{
				throw new pannellum.customErrors.notFoundError(request.statusText)
			}
		}catch(e){
			//reject( e )
			pannellum.errorMessage.show("console", e.name, e.message, e.stack);
		}
	}
	request.onerror = function() {
		try{
			throw new pannellum.customErrors.requestError(request.statusText);
		}catch(e){
			//reject( e )
			pannellum.errorMessage.show("console", e.name, e.message);
		}
	};
	if( settings.callbacks && settings.callbacks.onprogress) {
		request.onprogress = function(e) {
			var progress_data;
			if (e.lengthComputable) {
				progress_data = {}
				progress_data.percent = e.loaded / e.total * 100;
				var unit, numerator, denominator;
				if (e.total > 1e6) {
				  unit = 'MB';
				  numerator = (e.loaded / 1e6).toFixed(2);
				  denominator = (e.total / 1e6).toFixed(2);
				} else if (e.total > 1e3) {
				  unit = 'kB';
				  numerator = (e.loaded / 1e3).toFixed(1);
				  denominator = (e.total / 1e3).toFixed(1);
				} else {
				  unit = 'B';
				  numerator = e.loaded;
				  denominator = e.total;
				}
				progress_data.numerator = numerator;
				progress_data.denominator = denominator;
				progress_data.unit = unit;
			} else {
				progress_data = null;
			}
			settings.callbacks.onprogress( progress_data );
		}
	}
	try{
		request.open( settings.method, settings.url, settings.async );
		if(settings.responseType) request.responseType = settings.responseType;
		if( !Object.isEmpty(settings.requestHeaders) ) {
			for(var rh in settings.requestHeaders) {
				if( !settings.requestHeaders.hasOwnProperty(rh) ) continue;
				request.setRequestHeader( rh, settings.requestHeaders[ rh ]);
			}
		}
		request.send(settings.data);
	}catch(e){
		//reject( e )
		pannellum.errorMessage.show("console", e.name, e.message);
	}
}

/*
var tagsArray = [
	{ name : "script", attributes : {src: "toLoad/scr_1.js"}},
	{ name : "script", attributes : {src: "toLoad/scr_2.js"}}
];
Util.domElement.create( tagsArray );
*/
Util.domElement = function(){
	var tags = {
		script : {
			name : "script",
			attributes : {type: "text/javascript"},
			closed: true
		},
		link : {
			name : "link",
			attributes : {rel: "stylesheet"},
			closed: false
		}
	},
	modes = ["append","prepend","before"];
	function setAttr(el, prop) {
		if( !el || !prop || prop.constructor != Object ) return null;
		//var add = add || true;
		for(var attr in prop) {
			if (!prop.hasOwnProperty(attr)) continue;
			switch(typeof prop[attr]) {
				//case "object" : el.setAttribute(attr, writeProp(prop[attr])); break; //llike style attribute
				case "object" : setAttr(el[attr], prop[attr]); break; //llike style attribute
				case "function" :
				case "string" :
				default : el[attr] =  prop[attr]; //el.setAttribute(attr, prop[attr]);
			}
		}
	}
	function setContent(el, strCont) {
		if( !el || !strCont || typeof strCont != "string" ) return null;
		el.innerHTML = strCont;
	}
	function writeAttr(attrObj) {
		if( !attrObj || attrObj.constructor != Object ) return "";
		var ar = [];
		for(var attr in attrObj) {
			if (!attrObj.hasOwnProperty(attr)) continue;
			ar.push( attr + ( (attrObj[attr] !== undefined)?"=\"" +attrObj[attr] + "\"" : "") );
		}
		return (ar.length) ? ar.join(" ") : "";
	}
	function writeProp(attrObj) {
		if( !attrObj ) return "";
		var ar = [];
		for(var p in attrObj) {
			if (!attrObj.hasOwnProperty(p)) continue;
			ar.push( p + ":" + attrObj[p] );
		}
		return (ar.length) ? ar.join(";") : "";
	}
	function insert(elem, target, mode) {
		if( !elem || !target ||
			typeof elem != "object" ||
			typeof target != "object" ) return false;
			mode = ( mode && Object.inArray(modes, mode) >0 ) ? mode = mode : modes[0];
				switch(mode) {
					case "append" : target.appendChild(elem); break
					case "prepend" :
						if( target.childNodes.length ) {
							target.insertBefore(elem, target.childNodes[0]);
						}else{
							target.appendChild(elem);
						}
						break
					case "before" : target.parentNode.insertBefore(elem, target); break
				}
			return true;
	}
	return {
		create : function(tagObject, target){ // tagObject = { name:"", attributes:{}, closed: true|false }
			if( !tagObject ) return null;
			if( !tagObject.hasOwnProperty("name") ) return null;
			if( tags.hasOwnProperty(tagObject.name) ) Object.deepExtend( tagObject.attributes, tags[ tagObject.name ].attributes );
			var obj = document.createElement(tagObject.name), mode;
			if( tagObject.hasOwnProperty("attributes") ) setAttr(obj, tagObject.attributes);
			if( tagObject.hasOwnProperty("content") ) setContent(obj, tagObject.content);
			mode = ( tagObject.hasOwnProperty("mode") && Object.inArray(modes, tagObject.mode) >0 ) ? mode = tagObject.mode : modes[0];

			if( target ) insert(obj, target, mode);

			return obj;
		},
		write : function(tagObject){ // tagObject = { name:"", attributes:{} }
			if( !tagObject ) return null;
			if( !tagObject.hasOwnProperty("name") ) return null;
			if( tags.hasOwnProperty(tagObject.name) ) Object.deepExtend( tagObject, tags[ tagObject.name ] );
			document.write( "<" + tagObject.name + " " + writeAttr( tagObject.attributes ) + ((tagObject.closed)? ">" + (( tagObject.hasOwnProperty("content") ) ? tagObject.content : "") + "</" + tagObject.name +">" : "/>") );
		},
		setContent : function(el, prop) {
			setContent(el, prop);
		},
		setAttr : function(el, prop) {
			setAttr(el, prop);
		},
		hide : function(el, type) {
      switch (type) {
        case 'hidden': el.style.visibility = "hidden";
          break;
        default: el.style.display = "none";
      }
    },
		show : function(el, type) {
      switch (type) {
        case 'visible': el.style.visibility = "visible";
          break;
        case 'block':
        case 'inline': el.style.display = type;
          break;
        default: el.style.display = 'block';
      }
    },
		insert : function(el, target, mode){
			insert(el, target, mode);
		}
	}

}();

Util.getSettings = function (entity) {
	/* Entity format example
	"controls" : [
		"fullscreen",
		["fullscreen",{"top":"10px","left":"20px"}]
	],
	*/
	if(!entity) return null;
	if( typeof entity == "string" && entity != ""  ) {
		return { name: entity, settings : null }
	}else{
		if( entity.length == 2 && typeof entity[0] == "string" && entity[0] != "" ) {
			return { name: entity[0], settings : entity[1] }
		}
	}
	return null;
}

/**
 * http://stackoverflow.com/questions/9705123/how-can-i-get-sin-cos-and-tan-to-use-degrees-instead-of-radians/#34436551
 * @param degree
 * @returns {number}
 */
Util.mathD = function() {
	//helper
	/**
	 * converts degree to radians
	 * @param degree
	 * @returns {number}
	 */
	var toRadians = function (degree) {
		return degree * (Math.PI / 180);
	};

	/**
	 * Converts radian to degree
	 * @param radians
	 * @returns {number}
	 */
	var toDegree = function (radians) {
		return radians * (180 / Math.PI);
	}

	/**
	 * Rounds a number mathematical correct to the number of decimals
	 * @param number
	 * @param decimals (optional, default: 5)
	 * @returns {number}
	 */
	var roundNumber = function(number, decimals) {
		decimals = decimals || 5;
		return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
	}
	//the object
	return {
		sin: function(number){
			return roundNumber(Math.sin(toRadians(number)));
		},
		cos: function(number){
			return roundNumber(Math.cos(toRadians(number)));
		},
		tan: function(number){
			return roundNumber(Math.tan(toRadians(number)));
		},
		asin: function(number){
			return roundNumber(toDegree(Math.asin(number)));
		},
		acos: function(number){
			return roundNumber(toDegree(Math.acos(number)));
		},
		atan: function(number){
			return roundNumber(toDegree(Math.atan(number)));
		}
	};
}();

pannellum.util = Util;

////// Polyfills //////
/*
JSON.parse()
JSON.stringify()
*/
if (!window.JSON) {
  window.JSON = {
    parse: function(sJSON) { return eval('(' + sJSON + ')'); },
    stringify: (function () {
      var toString = Object.prototype.toString;
      var isArray = Array.isArray || function (a) { return toString.call(a) === '[object Array]'; };
      var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
      var escFunc = function (m) { return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1); };
      var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
      return function stringify(value) {
        if (value == null) {
          return 'null';
        } else if (typeof value === 'number') {
          return isFinite(value) ? value.toString() : 'null';
        } else if (typeof value === 'boolean') {
          return value.toString();
        } else if (typeof value === 'object') {
          if (typeof value.toJSON === 'function') {
            return stringify(value.toJSON());
          } else if (isArray(value)) {
            var res = '[';
            for (var i = 0; i < value.length; i++)
              res += (i ? ', ' : '') + stringify(value[i]);
            return res + ']';
          } else if (toString.call(value) === '[object Object]') {
            var tmp = [];
            for (var k in value) {
              if (value.hasOwnProperty(k))
                tmp.push(stringify(k) + ': ' + stringify(value[k]));
            }
            return '{' + tmp.join(', ') + '}';
          }
        }
        return '"' + value.toString().replace(escRE, escFunc) + '"';
      };
    })()
  };
}

/**
 * Provides requestAnimationFrame in a cross browser way.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */
if( !window.requestAnimationFrame ) {
    window.requestAnimationFrame = ( function() {
        return window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
            window.setTimeout( callback, 1000 / 60 );
        };
    })();
}

Object.inArray = function(array, value) {
	if ([].indexOf) {
		return array.indexOf(value);
	}else{
		for (var i = 0; i < array.length; i++) {
			if (array[i] === value) return i;
		}
		return -1;
	}
}
Object.isEmpty = function(obj) {
	for ( var i in obj ) { if( obj.hasOwnProperty(i) ) return false; }
	return true;
}

Object.deepExtend = function(destination, source) {
  if( source && typeof source.hasOwnProperty != "undefined" && source.hasOwnProperty("constructor") && source.constructor === Array ) source.reverse();
  for (var property in source) {
    if (source[property] && source[property].constructor &&
     (source[property].constructor === Object || source[property].constructor === Array) ) {
	  destination[property] = destination[property] || new source[property].constructor;
      arguments.callee(destination[property], source[property]);
    } else {
	   switch(source.constructor) {
		   case Object:
			if(!destination.hasOwnProperty(property) || destination[property] != source[property] ) destination[property] = source[property];
		   break;
		   case Array:
			if( typeof destination.indexOf != "undefined" ) {
				if(destination.indexOf(source[property]) < 0 ) destination.unshift(source[property]);
			}else{
				var found = false;
				for(var i=0; i<=destination.length; i++) {
					if(destination[i] == source[property]) found = true;
				}
				if(!found) destination.unshift(source[property]);
			}

		   break;
	   }
    }
  }
  return destination;
};

if (typeof Object.create != "function") {
  // Production steps of ECMA-262, Edition 5, 15.2.3.5
  // Reference: http://es5.github.io/#x15.2.3.5
  Object.create = (function() {
    // To save on memory, use a shared constructor
    function Temp() {}

    // make a safe reference to Object.prototype.hasOwnProperty
    var hasOwn = Object.prototype.hasOwnProperty;

    return function (O) {
      // 1. If Type(O) is not Object or Null throw a TypeError exception.
      if (typeof O != "object") {
        throw TypeError("Object prototype may only be an Object or null");
      }

      // 2. Let obj be the result of creating a new object as if by the
      //    expression new Object() where Object is the standard built-in
      //    constructor with that name
      // 3. Set the [[Prototype]] internal property of obj to O.
      Temp.prototype = O;
      var obj = new Temp();
      Temp.prototype = null; // Let's not keep a stray reference to O...

      // 4. If the argument Properties is present and not undefined, add
      //    own properties to obj as if by calling the standard built-in
      //    function Object.defineProperties with arguments obj and
      //    Properties.
      if (arguments.length > 1) {
        // Object.defineProperties does ToObject on its first argument.
        var Properties = Object(arguments[1]);
        for (var prop in Properties) {
          if (hasOwn.call(Properties, prop)) {
            obj[prop] = Properties[prop];
          }
        }
      }
      // 5. Return obj
      return obj;
    };
  })();
}

}(window.pannellum || (window.pannellum={}), document, undefined));
