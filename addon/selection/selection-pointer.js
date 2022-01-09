// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineOption("selectionPointer", false, function(cm, val) {
    var data = cm.state.selectionPointer;
    if (data) {
      CodeMirror.off(cm.getWrapperElement(), "mousemove", data.mousemove);
      CodeMirror.off(cm.getWrapperElement(), "mouseout", data.mouseout);
      CodeMirror.off(window, "scroll", data.windowScroll);
      cm.off("cursorActivity", reset);
      cm.off("scroll", reset);
      cm.state.selectionPointer = null;
      cm.display.lineDiv.style.cursor = "";
    }
    if (val) {
      data = cm.state.selectionPointer = {
        value: typeof val == "string" ? val : "default",
        mousemove: function(event) { mousemove(cm, event); },
        mouseout: function(event) { mouseout(cm, event); },
        windowScroll: function() { reset(cm); },
        rects: null,
        mouseX: null, mouseY: null,
        willUpdate: false
      };
      CodeMirror.on(cm.getWrapperElement(), "mousemove", data.mousemove);
      CodeMirror.on(cm.getWrapperElement(), "mouseout", data.mouseout);
      CodeMirror.on(window, "scroll", data.windowScroll);
      cm.on("cursorActivity", reset);
      cm.on("scroll", reset);
    }
  });

  function mousemove(cm, event) {
    var data = cm.state.selectionPointer;
    if (event.buttons == null ? event.which : event.buttons) {
      data.mouseX = data.mouseY = null;
    } else {
      data.mouseX = event.clientX;
      data.mouseY = event.clientY;
    }
    scheduleUpdate(cm);
  }

  function mouseout(cm, event) {
    if (!cm.getWrapperElement().contains(event.relatedTarget)) {
      var data = cm.state.selectionPointer;
      data.mouseX = data.mouseY = null;
      scheduleUpdate(cm);
    }
  }

  function reset(cm) {
    cm.state.selectionPointer.rects = null;
    scheduleUpdate(cm);
  }

  function scheduleUpdate(cm) {
    if (!cm.state.selectionPointer.willUpdate) {
      cm.state.selectionPointer.willUpdate = true;
      setTimeout(function() {
        update(cm);
        cm.state.selectionPointer.willUpdate = false;
      }, 50);
    }
  }

  function update(cm) {
    var data = cm.state.selectionPointer;
    if (!data) return;
    if (data.rects == null && data.mouseX != null) {
      data.rects = [];
      if (cm.somethingSelected()) {
        var sel = cm.display.selectionDiv.firstChild
		    if (sel) {
		      for (; sel; sel = sel.nextSibling)
		    	data.rects.push(sel.getBoundingClientRect());
			  }
		    else {
          const selection=cm.doc.sel.ranges[0];
		    	var selstart=selection.anchor;
		    	var selend=selection.head;
		    	var multiline=false;
		    	
		    	function getRect(selstart, selend)
		    	{  	
		    		const rect=cm.charCoords(selstart,"window");
		    		rect.right=cm.charCoords(selend,"window").left;
		    		
		    		return rect;
		    	}

          //reverse order if needed
		    	if (selstart.line != selend.line)
		    	{
		    		multiline=true;
		    		if (selstart.line > selend.line)
			    	{
			    		selstart=selection.head;
			    		selend=selection.anchor;
			    	}
		    	}
		    	else if (selstart.ch > selend.ch)
		    	{
		    		selstart=selection.head;
		    		selend=selection.anchor;
		    	}
		    	
		    	if (!multiline)
		    		data.rects.push(getRect(selstart,selend));
		    	else
		    	{
		    		//first line
		    		var line=cm.getLine(selstart.line);
		    		data.rects.push(getRect(selstart, CodeMirror.Pos(selstart.line,line.length)));
		    		
		    		//in-between lines
		    		const times=selend.line-selstart.line-1;
		    		if (times > 0)
		    		{
			    		var tmp=CodeMirror.Pos(selstart.line,0);
				    	for (var i = 0; i < times; i++)
				    	{
				    		tmp.line++;
				    		line=cm.getLine(tmp.line);
				    		data.rects.push(getRect(tmp, CodeMirror.Pos(tmp.line,line.length)));
				    	}
		    		}
			    	
			    	//last line
			    	line=cm.getLine(selend.line);
		    		data.rects.push(getRect(CodeMirror.Pos(selend.line,0),selend));
			    	
		    	}
		    	
		    	//TODO: wrap
		    	
		    }
      }
    }
    var inside = false;
    if (data.mouseX != null) for (var i = 0; i < data.rects.length; i++) {
      var rect = data.rects[i];
      if (rect.left <= data.mouseX && rect.right >= data.mouseX &&
          rect.top <= data.mouseY && rect.bottom >= data.mouseY)
        inside = true;
    }
    var cursor = inside ? data.value : "";
    if (cm.display.lineDiv.style.cursor != cursor)
      cm.display.lineDiv.style.cursor = cursor;
  }
});
