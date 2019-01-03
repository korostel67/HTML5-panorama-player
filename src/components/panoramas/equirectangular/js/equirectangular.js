// This is a plan for panorama type extension

(function(pannellum, document, undefined) {
	"use strict";

	if( !pannellum.components.panoramas.hasOwnProperty("panorama") ) throw new Error("pannellum.components.panoramas.panorama class is undefined");

//Equirectangular base class pannellum.util.extends Panorama base class
	var Equirectangular = function(host, hostContainer, config) {
		Equirectangular.superclass.constructor.apply(this, arguments);
		var dataTypes = {
			useGPanoXMP : pannellum.dataTypes.dtBool({ default: false })
		}
		var This = this;
		this.checkConfig( config, dataTypes );
		this.name = 'Equirectangular';
		this.pose = undefined;
		// Vertex shader for equirectangular and cube
		var vertexShader = [
		'attribute vec2 a_texCoord;',
		'varying vec2 v_texCoord;',
		'void main() {',
				// Set position
				'gl_Position = vec4(a_texCoord, 0.0, 1.0);',
				// Pass the coordinates to the fragment shader
				'v_texCoord = a_texCoord;',
		'}'
		].join('');
		this.vertexShader = function() { return vertexShader; }();
		// Fragment shader
		var fragmentShader = [
		'precision mediump float;',
		'uniform float u_aspectRatio;',
		'uniform float u_psi;',
		'uniform float u_theta;',
		'uniform float u_f;',
		'uniform float u_h;',
		'uniform float u_v;',
		'uniform float u_vo;',
		'uniform float u_rot;',
		'const float PI = 3.14159265358979323846264;',
		// Texture
		'uniform sampler2D u_image;',
		// Coordinates passed in from vertex shader
		'varying vec2 v_texCoord;',
		'void main() {',
		    // Map canvas/camera to sphere
		    'float x = v_texCoord.x * u_aspectRatio;',
		    'float y = v_texCoord.y;',
		    'float sinrot = sin(u_rot);',
		    'float cosrot = cos(u_rot);',
		    'float rot_x = x * cosrot - y * sinrot;',
		    'float rot_y = x * sinrot + y * cosrot;',
		    'float sintheta = sin(u_theta);',
		    'float costheta = cos(u_theta);',
		    'float a = u_f * costheta - rot_y * sintheta;',
		    'float root = sqrt(rot_x * rot_x + a * a);',
		    'float lambda = atan(rot_x / root, a / root) + u_psi;',
		    'float phi = atan((rot_y * costheta + u_f * sintheta) / root);',
		    // Wrap image
		    'if(lambda > PI)',
		        'lambda = lambda - PI * 2.0;',
		    'if(lambda < -PI)',
		       'lambda = lambda + PI * 2.0;',
		    // Map texture to sphere
		    'vec2 coord = vec2(lambda / PI, phi / (PI / 2.0));',
		    // Look up color from texture
		    // Map from [-1,1] to [0,1] and flip y-axis
		    'if(coord.x < -u_h || coord.x > u_h || coord.y < -u_v + u_vo || coord.y > u_v + u_vo)',
		        'gl_FragColor = vec4(0, 0, 0, 1.0);',
		    'else',
		        'gl_FragColor = texture2D(u_image, vec2((coord.x + u_h) / (u_h * 2.0), (-coord.y + u_v + u_vo) / (u_v * 2.0)));',
		'}'
		].join('\n');
		this.fragmentShader = function() { return fragmentShader; }();

		this.prepare();

		pannellum.eventBus.addEventListener("panorama:image_loaded", function(event, prop) {
			try {
					if( (event.dispatcher==This) ) This.init( This.config.haov * Math.PI / 180, This.config.vaov * Math.PI / 180, This.config.vOffset * Math.PI / 180 );
			} catch(e) {
					// Panorama not loaded
					pannellum.errorMessage.show("messageBox", e.name, e.message, e.stack);
			}
		}, This);

	}
	pannellum.util.extend(Equirectangular, pannellum.components.panoramas.panorama);

	/**
	 * Render new view of panorama.
	 * @memberof Equirectangular
	 * @instance
	 * @param {number} pitch - Pitch to render at.
	 * @param {number} yaw - Yaw to render at.
	 * @param {number} hfov - Horizontal field of view to render with.
	 * @param {boolean} returnImage - Return rendered image? Can be used for creating fading effect on scenes change
	 */

	Equirectangular.prototype.render = function(returnImage) {
	    if ( !this.gl ) {
				throw new pannellum.customErrors.undefinedDataError('No WebGL available for rendering!');
	    }
			Equirectangular.superclass.render.apply(this, arguments);
			var pitch = this.config.pitch * Math.PI / 180;
			var yaw = this.config.yaw * Math.PI / 180;
			var hfov = this.config.hfov * Math.PI / 180;
			var focal;
	//## WebGL
	//## # renderWebGL() {
	//## WebGL
	//## # CM, EQ, VD
	//## # prepareView() {
	        // Apply pitch and roll transformation if applicable
	        if (this.pose !== undefined) {
	//## WebGL
	//## # # EQ, VD
	            var horizonPitch = this.pose[0],
	                horizonRoll = this.pose[1];

	            // Calculate new pitch and yaw
	            var orig_pitch = pitch,
	                orig_yaw = yaw,
	                x = Math.cos(horizonRoll) * Math.sin(pitch) * Math.sin(horizonPitch) +
	                    Math.cos(pitch) * (Math.cos(horizonPitch) * Math.cos(yaw) +
	                    Math.sin(horizonRoll) * Math.sin(horizonPitch) * Math.sin(yaw)),
	                y = -Math.sin(pitch) * Math.sin(horizonRoll) +
	                    Math.cos(pitch) * Math.cos(horizonRoll) * Math.sin(yaw),
	                z = Math.cos(horizonRoll) * Math.cos(horizonPitch) * Math.sin(pitch) +
	                    Math.cos(pitch) * (-Math.cos(yaw) * Math.sin(horizonPitch) +
	                    Math.cos(horizonPitch) * Math.sin(horizonRoll) * Math.sin(yaw));
	            pitch = Math.asin(z);
	            yaw = Math.atan2(y, x);

	            // Calculate roll
	            var v = [Math.cos(orig_pitch) * (Math.sin(horizonRoll) * Math.sin(horizonPitch) * Math.cos(orig_yaw) -
	                    Math.cos(horizonPitch) * Math.sin(orig_yaw)),
	                    Math.cos(orig_pitch) * Math.cos(horizonRoll) * Math.cos(orig_yaw),
	                    Math.cos(orig_pitch) * (Math.cos(horizonPitch) * Math.sin(horizonRoll) * Math.cos(orig_yaw) +
	                    Math.sin(orig_yaw) * Math.sin(horizonPitch))],
	                w = [-Math.cos(pitch) * Math.sin(yaw), Math.cos(pitch) * Math.cos(yaw)];
	            var roll = Math.acos((v[0]*w[0] + v[1]*w[1]) /
	                (Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]) *
	                Math.sqrt(w[0]*w[0]+w[1]*w[1])));
	            if (v[2] < 0)
	                roll = 2 * Math.PI - roll;
	            this.gl.uniform1f(this.program.rot, roll);
	        }
	//## # }
	//## # setUniform() {
	        // Pass psi, theta, and focal length
	        this.gl.uniform1f(this.program.psi, yaw);
	        this.gl.uniform1f(this.program.theta, pitch);

	        // Calculate focal length from vertical field of view
	        var vfov = 2 * Math.atan(Math.tan(hfov * 0.5) / (this.canvas.width / this.canvas.height));
	        focal = 1 / Math.tan(vfov * 0.5);
	        this.gl.uniform1f(this.program.f, focal);
	//## # }
	//## # updateTexture() {

	//## # }
	//## # draw() {
	        // Draw using current buffer
	        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
	//## # }
	//## # }
	//## WebGL
	//## CM, MR, EQ, VD
	    if (returnImage !== undefined) {
	        return this.canvas.toDataURL('image/png');
	    }
	};


	/**
	 * Initialize renderer.
	 * @memberof Equirectangular
	 * @instance
//## WebGL, CSS3
//## CM, EQ, VD
	 * @param {number} haov - Initial horizontal angle of view.
	 * @param {number} vaov - Initial vertical angle of view.
	 * @param {number} voffset - Initial vertical offset angle.
//## WebGL, CSS3
//## CM, MR, EQ, VD
	 * @param {function} callback - Load callback function.
	 */
//## WebGL, CSS3
//## CM, MR, EQ, VD
	Equirectangular.prototype.init = function(haov, vaov, voffset) {
		Equirectangular.superclass.init.call(this);
//## WebGL, CSS3
//## CM, MR
		//var s;
    // This awful browser specific test exists because iOS 8/9 and IE 11
    // don't display non-power-of-two cubemap textures but also don't
    // throw an error (tested on an iPhone 5c / iOS 8.1.3 / iOS 9.2).
    // Therefore, the WebGL context is never created for these browsers for
    // NPOT cubemaps, and the CSS 3D transform fallback renderer is used
    // instead.
//## # initWebGL() {
//## CM
//## # WebGL
//## # CM, MR, EQ, VD
	  // Enable WebGL on canvas
    this.gl = this.canvas.getContext('experimental-webgl', {alpha: false, depth: false});
//## # }
    // If there is no WebGL, fall back to CSS 3D transform renderer.
    // While browser specific tests are usually frowned upon, the
    // fallback viewer only really works with WebKit/Blink and IE 10/11
    // (it doesn't work properly in Firefox).
//## CSS3
//## MR, CM
//## The rollback to cubemap
//## # checkWebGL() {1}
    if ( !this.gl ) {
//## # checkWebGL() {2
//## CM with the above check, MR, EQ, VD with NO fallbackPath
      //console.log('Error: no WebGL support detected!');
      //throw {type: 'no webgl'};
			throw new pannellum.customErrors.compatiblityError('Sorry, no WebGL support detected!');
    }
//## WebGL supported
//## CM, MR, EQ, VD
//## # prepareWebGL() {
    if (this.panoImage.basePath) {
      this.panoImage.fullpath = this.panoImage.basePath + this.panoImage.path;
    } else {
      this.panoImage.fullpath = this.panoImage.path;
    }
		// Make sure image isn't too big
//## WebGL
//## # EQ, CM, VD
//## # checkImgeSize() {
		var width, maxWidth;
//## WebGL
//## # EQ, VD
		width = Math.max(this.panoImage.width, this.panoImage.height);
		maxWidth = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
		if (width > maxWidth) {
			//console.log('Error: The image is too big; it\'s ' + width + 'px wide, but this device\'s maximum supported width is ' + maxWidth + 'px.');
			throw new pannellum.customErrors.compatiblityError(
				"This panorama is too big for your device!\
				It\'s " + width + "px wide, but your device only supports\
				 images up to " + maxWidth + "px wide. Try another device.\
				(If you\'re the author, try scaling down the image.)"
			);
		}
//## # }
//## # setPose() {
    // Store horizon pitch and roll if applicable
    if (this.panoImage.horizonPitch !== undefined && this.panoImage.horizonRoll !== undefined) {
//## WebGL
//## # # EQ, VD
      this.pose = [this.panoImage.horizonPitch, this.panoImage.horizonRoll];
    }
//## # }
    // Set 2d texture binding
    var glBindType = this.gl.TEXTURE_2D;
    // Create viewport for entire canvas

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // Create vertex shader
//## # prepareVertexShader() {
    var vs = this.gl.createShader(this.gl.VERTEX_SHADER);
//## WebGL
//## EQ, CM, VD
    //var vertexSrc = this.vertexShader;
    this.gl.shaderSource(vs, this.vertexShader);
    this.gl.compileShader(vs);
//## # }
    // Create fragment shader
//## # prepareFragmentShader() {
    var fs = this.gl.createShader(this.gl.FRAGMENT_SHADER);
//## WebGL
//## EQ, VD
		//var fragmentSrc = this.fragmentShader;
    this.gl.shaderSource(fs, this.fragmentShader);
    this.gl.compileShader(fs);
//## # }
//## # linkWebGLProgram() {
    // Link WebGL program
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);
//## # }
    // Log errors
    if(!this.gl.getShaderParameter(vs, this.gl.COMPILE_STATUS))
        console.log(this.gl.getShaderInfoLog(vs));
    if(!this.gl.getShaderParameter(fs, this.gl.COMPILE_STATUS))
        console.log(this.gl.getShaderInfoLog(fs));
    if(!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS))
        console.log(this.gl.getProgramInfoLog(this.program));
//## # useWebGLProgram() {
    // Use WebGL program
    this.gl.useProgram(this.program);
    this.program.drawInProgress = false;
    // Look up texture coordinates location
    this.program.texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
    this.gl.enableVertexAttribArray(this.program.texCoordLocation);
//## # }
//## # configureWebGLProgram() {
//## WebGL
//## # CM, EQ, VD
    // Provide texture coordinates for rectangle
    this.program.texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.program.texCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,1,1,1,1,-1,-1,1,1,-1,-1,-1]), this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(this.program.texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
    // Pass aspect ratio
    this.program.aspectRatio = this.gl.getUniformLocation(this.program, 'u_aspectRatio');
    this.gl.uniform1f(this.program.aspectRatio, this.canvas.width / this.canvas.height);
    // Locate psi, theta, focal length, horizontal extent, vertical extent, and vertical offset
    this.program.psi = this.gl.getUniformLocation(this.program, 'u_psi');
    this.program.theta = this.gl.getUniformLocation(this.program, 'u_theta');
    this.program.f = this.gl.getUniformLocation(this.program, 'u_f');
    this.program.h = this.gl.getUniformLocation(this.program, 'u_h');
    this.program.v = this.gl.getUniformLocation(this.program, 'u_v');
    this.program.vo = this.gl.getUniformLocation(this.program, 'u_vo');
    this.program.rot = this.gl.getUniformLocation(this.program, 'u_rot');
    // Pass horizontal extent, vertical extent, and vertical offset
    this.gl.uniform1f(this.program.h, haov / (Math.PI * 2.0));
    this.gl.uniform1f(this.program.v, vaov / Math.PI);
    this.gl.uniform1f(this.program.vo, voffset / Math.PI * 2);
    // Create texture
    this.program.texture = this.gl.createTexture();
    this.gl.bindTexture(glBindType, this.program.texture);
//## # aploadImages() {
  	// Upload images to texture depending on type
//## WebGL
//## # # EQ, VD
// Upload image to the texture
		this.gl.texImage2D(glBindType, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, this.panoImage);
//## # }
    // Set parameters for rendering any size
    this.gl.texParameteri(glBindType, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(glBindType, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(glBindType, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(glBindType, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
//## # configureWebGLProgram() }
		// Check if there was an error
    if (this.gl.getError() !== 0) {
      //console.log('Error: Something went wrong with WebGL!');
      throw new Error('Error: Something went wrong with WebGL!');
    }
//## # prepareWebGL }

		this.resize();
		pannellum.eventBus.dispatch("panorama:initialized", this);
	};

	Equirectangular.prototype.resize = function() {
		Equirectangular.superclass.resize.call(this);
		if (this.gl) this.gl.uniform1f(this.program.aspectRatio, this.canvas.width / this.canvas.height);
	};

	Equirectangular.prototype.prepare = function() {
		var This = this;
		this.panoImage = new Image();

		// If we have absolute panorama URL and it is outside of current domain
		// set panorama image crossOrigin attribute = ""
		if (pannellum.util.getUrlType(this.config.panorama) === 'absolute') {
			if ((new URL(this.config.panorama)).origin !== window.location.origin) {
	      this.panoImage.crossOrigin = "";
	    }
		}

		this.panoImage.onload = function() {
			window.URL.revokeObjectURL(this.src);  // Clean up
			pannellum.eventBus.dispatch("panorama:image_loaded", This);
		};
		var settigs = {
			url		: this.config.panorama,
			method	: "GET",
			async	: true,
			noCache : false,
			responseType : "blob",
			requestHeaders : {"Accept": "image/*,*/*;q=0.9"},
			onProgress: function(progress_data){
				pannellum.eventBus.dispatch("panorama:load_progress", This, progress_data);
			}
		}
		pannellum.util.xHttpRequest(settigs).then(function(request){
			var img = request.response;
			if (!This.config.useGPanoXMP) {
				This.panoImage.src = window.URL.createObjectURL(img);
			}else{
				parseGPanoXMP(img);
			}
		}).catch(function(error){
			pannellum.errorMessage.show("messageBox", error.name, error.message, error.stack);
		});

		/**
		 * Parses Google Photo Sphere XMP Metadata.
		 * https://developers.google.com/photo-sphere/metadata/
		 * @public
		 * @param {Image} image - Image to read XMP metadata from.
		 */
		function parseGPanoXMP(image) {
			var reader = new FileReader();
			reader.addEventListener('loadend', function() {
				var img = reader.result;
				try{
					// This awful browser specific test exists because iOS 8 does not work
					// with non-progressive encoded JPEGs.
					if (navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 8_/)) {
						var flagIndex = img.indexOf('\xff\xc2');
						if (flagIndex < 0 || flagIndex > 65536) {
							throw new pannellum.customErrors.compatiblityError(
								"Due to iOS 8's broken WebGL 		implementation, only \
								progressive encoded JPEGs work for your device (this \
								panorama uses standard encoding).");
						}
					}
				}catch(error){
					pannellum.errorMessage.show("messageBox", error.name, error.message, error.stack);
				}
				var start = img.indexOf('<x:xmpmeta');
				if (start > -1) {
					var xmpData = img.substring(start, img.indexOf('</x:xmpmeta>') + 12);

					// Extract the requested tag from the XMP data
					var getTag = function(tag) {
						var result;
						if (xmpData.indexOf(tag + '="') >= 0) {
							result = xmpData.substring(xmpData.indexOf(tag + '="') + tag.length + 2);
							result = result.substring(0, result.indexOf('"'));
						} else if (xmpData.indexOf(tag + '>') >= 0) {
							result = xmpData.substring(xmpData.indexOf(tag + '>') + tag.length + 1);
							result = result.substring(0, result.indexOf('<'));
						}
						if (result !== undefined) {
							return Number(result);
						}
						return null;
					};

					// Relevant XMP data
					var xmp = {
						fullWidth: getTag('GPano:FullPanoWidthPixels'),
						croppedWidth: getTag('GPano:CroppedAreaImageWidthPixels'),
						fullHeight: getTag('GPano:FullPanoHeightPixels'),
						croppedHeight: getTag('GPano:CroppedAreaImageHeightPixels'),
						topPixels: getTag('GPano:CroppedAreaTopPixels'),
						heading: getTag('GPano:PoseHeadingDegrees'),
						horizonPitch: getTag('GPano:PosePitchDegrees'),
						horizonRoll: getTag('GPano:PoseRollDegrees')
					};

					if (xmp.fullWidth !== null && xmp.croppedWidth !== null &&
						xmp.fullHeight !== null && xmp.croppedHeight !== null &&
						xmp.topPixels !== null) {

						// Set up viewer using GPano XMP data
						This.config.haov = xmp.croppedWidth / xmp.fullWidth * 360;
						This.config.vaov = xmp.croppedHeight / xmp.fullHeight * 180;
						This.config.vOffset = ((xmp.topPixels + xmp.croppedHeight / 2) / xmp.fullHeight - 0.5) * -180;
						if (xmp.heading !== null) {
							// TODO: make sure this works correctly for partial panoramas
							This.config.northOffset = xmp.heading;
						}
						if (xmp.horizonPitch !== null && xmp.horizonRoll !== null) {
							This.panoImage.horizonPitch = xmp.horizonPitch / 180 * Math.PI;
							This.panoImage.horizonRoll = xmp.horizonRoll / 180 * Math.PI;
						}
						// TODO: add support for initial view settings
					}
				}

				// Load panorama
				This.panoImage.src = window.URL.createObjectURL(image);
			});
			if (reader.readAsBinaryString !== undefined){
				reader.readAsBinaryString(image);
			}else{
				reader.readAsText(image);
			}
		}
	}

	pannellum.components.panoramas.equirectangular = Equirectangular;

}(window.pannellum || (window.pannellum={}), document));
