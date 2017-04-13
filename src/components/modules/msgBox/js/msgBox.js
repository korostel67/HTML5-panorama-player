/////////////Module Message Box/////////////////
(function(pannellum, document, undefined) {
	
	"use strict";
	
	//if( !pannellum.components.modules.baseClasses.hasOwnProperty("contentBox") ) throw new Error("pannellum.components.modules.baseClasses.contentBox class is undefined");
	if( !pannellum.components.modules.hasOwnProperty("contentBox") ) throw new Error("pannellum.components.modules.contentBox class is undefined");
	
	var MsgBox = function(host, hostContainer, config) {
		MsgBox.superclass.constructor.apply(this, arguments);
		var This = this;
		this.name = 'MsgBox';
		this.container.classList.add('pnlm-message-box');
		
		pannellum.util.domElement.create({ name : 'link', attributes : {
			href: 'src/components/modules/msgBox/css/styles.css',
			onload : function(){
				//test module
				This.addFields([
					["info", { name : 'div', attributes : {'className': 'message-box-info'}, content: "Test" }],
					["info2", { name : 'div', attributes : {'className': 'message-box-info'}, content: "Test2" }],
					["info3", { name : 'div', attributes : {'className': 'message-box-info'}, content: "Test2" }]
				]);
				This.update({info:"Test3"});
				This.show();
				//end test
			}
		} }, document.head);
	}
	//pannellum.util.extend(MsgBox, pannellum.components.modules.baseClasses.contentBox);
	pannellum.util.extend(MsgBox, pannellum.components.modules.contentBox);
	
	//pannellum.components.modules.baseClasses.msgBox = MsgBox; //There is nothing to extend
	pannellum.components.modules.msgBox = MsgBox;

}(window.pannellum || (window.pannellum={}), document));
