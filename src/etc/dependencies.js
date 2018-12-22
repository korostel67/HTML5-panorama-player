/*
 * Pannellum classes dependencies
 */
(function(window, pannellum, u){
	var dependencies = {
		"interactions" : { src: "src/etc/interactions.js"},

		"components.component" : { src: "src/etc/classes.js"},

		"components.modules.module" :{depends:["components.component"], src: "src/etc/classes.js"},
		"components.modules.contentBox" :{depends:["components.modules.module"], src: "src/etc/classes.js"},
		"components.modules.msgBox" :{depends:["components.modules.contentBox"], src: "src/components/modules/msgBox/js/msgBox.js"},
		"components.modules.panoInfo" :{depends:["components.modules.contentBox"], src: "src/components/modules/panoInfo/js/panoInfo.js"},
		"components.modules.panoPosition" :{depends:["components.modules.contentBox"], src: "src/components/modules/panoPosition/js/panoPosition.js"},

		"components.controls.control" :{depends:["components.component"], src: "src/etc/classes.js"},
		"components.controls.fullscreen" :{depends:["components.controls.control"], src: "src/components/controls/fullscreen/js/fullscreen.js"},

		"components.panoramas.panorama" : { depends : ["components.component", "interactions"], src : "src/components/panoramas/panorama/js/panorama.js" },
		"components.panoramas.equirectangular" : { depends : ["components.panoramas.panorama"], src : "src/components/panoramas/equirectangular/js/equirectangular.js" },

		"components.hotSpots.hotSpot" : { depends : ["components.component"], src : "src/etc/classes.js" },
		"components.hotSpots.panorama" : { depends : ["components.hotSpots.hotSpot"], src : "src/components/hotSpots/js/hotSpots.js" },
		"components.hotSpots.link" : { depends : ["components.hotSpots.hotSpot"], src : "src/components/hotSpots/js/hotSpots.js" },
		"components.hotSpots.image" : { depends : ["components.hotSpots.hotSpot"], src : "src/components/hotSpots/js/hotSpots.js" },
		"components.hotSpots.video" : { depends : ["components.hotSpots.hotSpot"], src : "src/components/hotSpots/js/hotSpots.js" },
		"components.hotSpots.info" : { depends : ["components.hotSpots.hotSpot"], src : "src/components/hotSpots/js/hotSpots.js" },

		"actions.transitions.simpleOpacity" : { depends : ["actions.action"], src : "src/actions/transitions/simpleOpacity/js/script.js" },

		"components.modules.loadProgress" :{depends:["components.modules.contentBox"], src: "src/components/modules/loadProgress/js/script.js"},

	}
	if( !pannellum.hasOwnProperty("dependencies") ) pannellum.dependencies = dependencies;

}(window, window.pannellum || (window.pannellum={}),undefined));
