
/*
# SearchParty - Learning to Search in a Web-Based Classroom
# Author: Ben Bederson - www.cs.umd.edu/~bederson
#         University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

function updateNumStudents(data) {
    var numStudents = data['num_students'];
    if (numStudents == 0) {
        var html = "No students logged in";
    } else {
        // var html = "# <a href='/student_list'>students</a>: " + numStudents;
        var html = "# students: " + numStudents;
    }
    $("#num_students").html(html);
}

function displaySearchers(terms) {
    var html = "";
    for (i in terms) {
        var term = terms[i];
        if (i > 0) {
            html += ", ";
        }
        html += term;
    }
    var searchers = $("#searchers");
    searchers.show();
    searchers.html(html);
    searchers.css("left", $(this).position().left + searchers.width());
    searchers.css("top", $(this).position().top);
}

function displayData(data) {
    // Search terms
	var searchTerms = data['terms'];
	var html = "";
	var count = searchTerms.length;
	if (count > 0) {
	    html += "<ul>";
	    for (i in searchTerms) {
		    var j = count - 1 - i;
		    var term = searchTerms[j][0];
		    var termCount = searchTerms[j][1];
		    html += "<li><a class='term'>" + term + "</a> (" + termCount + ")</li>";
	    }
	    html += "</ul>";
    } else {
        html = "&lt;none&gt;";
    }
	$("#searchTerms").html(html);

    // Followed links
	var links = data['links'];
	var html = "";
	var count = links.length;
	if (count > 0) {
	    html += "<ul>";
	    for (i in links) {
	        var j = count - 1 - i;
		    var link = links[j][0];
		    var linkCount = links[j][1];
		    html += "<li><a href='" + link + "' target='_blank'>" + link + "</a> (" + linkCount + ")</li>";
	    }
	    html += "</ul>";
    } else {
        html = "&lt;none&gt;";
    }
	$("#links").html(html);
	
	$(".term").mouseenter(function() {
	    var searchTerms = $(this).html();
    	$.getJSON("/query", "qt=search&terms=" + searchTerms, displaySearchers);
        var searchers = $("#searchers");
        searchers.css("height", "20px");
        searchers.css("left", $(this).position().left + $(this).width() + 30);
        searchers.css("top", $(this).position().top - (searchers.height() - $(this).height()));
	});
	$(".term").mouseleave(function() {
	    $("#searchers").hide();
    });
}

function onMessage(msg) {
    var state = JSON.parse(msg.data);
    if (state.change == "student_login") {
    	$.getJSON("/query", "qt=num_students", updateNumStudents);
    } else if (state.change == "student_logout") {
    	$.getJSON("/query", "qt=num_students", updateNumStudents);
    	$.getJSON("/query", "qt=students", updateStudents);  // for students list
    } else if (state.change == "student_search") {
        var sinceStr = $("#activitySlider").slider("value");
    	$.getJSON("/query", "qt=data&since=" + sinceStr, displayData);
    	$.getJSON("/query", "qt=students", updateStudents);  // for students list
    } else if (state.change == "student_link_followed") {
        var sinceStr = $("#activitySlider").slider("value");
    	$.getJSON("/query", "qt=data&since=" + sinceStr, displayData);
    	$.getJSON("/query", "qt=students", updateStudents);  // for students list
    } else if ('log' in state) {
        $("#log").append(state.log + "<br>");
    } 
}

function openChannel(token) {
  var channel = new goog.appengine.Channel(token);
  var socket = channel.open();
  socket.onmessage = onMessage;
}

var current_pane_name = null;
function loadPane(pane_name) {
	if(current_pane_name !== null) {
		//document.getElementById("pane_"+current_pane_name).style.display = "none";
		//document.getElementById("load_"+current_pane_name+"_btn").style.backgroundColor = "#dddddd";
		//$(".pane_selected").removeClass("pane_selected");
		$(pane_id(current_pane_name)).removeClass("selected");
		$(load_btn_id(current_pane_name)).removeClass("selected");
		//$("pane_"+current_pane_name).css("background-color", "#dddddd");
	}
	current_pane_name = pane_name;
	$(pane_id(current_pane_name)).addClass("selected");
	$(load_btn_id(current_pane_name)).addClass("selected");
//	document.getElementById("pane_"+current_pane_name).style.display = "block";
//	document.getElementById("load_"+current_pane_name+"_btn").style.backgroundColor = "#ffff88";
	window.location.hash = current_pane_name;
}
function pane_id(pane_name) {
	return "pane_" + pane_name;
}
function load_btn_id(pane_name) {
	return "load_" + pane_name + "_btn";
}

function updateStudents(data) {
	var students = data;
	if (students.length == 0) {
	    var html = "No students logged in";
	} else {
	    var html = "Currently logged in students:";
	    html += "<ul>";
	    for (var i in students) {
	        var student = students[i];
	        var name = student[0]
	        var activities = student[1];
		    html += "<li>" + name + ": ";
		    for (var j in activities) {
		        if (j > 0) {
		            html += " => ";
		        }
		        var activity = activities[j];
		        var activityType = activity[0];
		        var action = activity[1];
		        if (activityType == 'search') {
		            html += action;
	            } else if (activityType == 'link') {
	                html += "<a href = '" + action + "'>" + action + "</a>";
		        }
		    }
	    }
	    html += "</ul>";
    }
    
	$("#students").html(html);
}

function initialize() {
	// The variables start_pane and token must be set globally before this code is called.
	
	openChannel(token);
	$("#todayButton").button();
	$("#todayButton").button("disable");
	$("#todayButton").click(function() {
		$("#activityFromDate").html("today");
		$("#activitySlider").slider("value", 5);
		$("#todayButton").button("disable");
	});
	$("#activitySlider").slider({
		min: 1,
		max: 5,
		value: 5
	});
	$("#activitySlider").bind( "slide", function(event, ui) {
		switch (ui.value) {
			case 1:
				$("#activityFromDate").html("the beginning");
				$("#todayButton").button("enable");
				break;
			case 2:
				$("#activityFromDate").html("last week");
				$("#todayButton").button("enable");
				break;
			case 3:
				$("#activityFromDate").html("this week");
				$("#todayButton").button("enable");
				break;
			case 4:
				$("#activityFromDate").html("yesterday");
				$("#todayButton").button("enable");
				break;
			case 5:
				$("#activityFromDate").html("this morning");
				$("#todayButton").button("disable");
				break;
		}
		$.getJSON("/query", "qt=data&since=" + ui.value, displayData);
	});
	$("#activitySlider").bind( "slidechange", function(event, ui) {
		$.getJSON("/query", "qt=data&since=" + ui.value, displayData);
	});

	// Refresh dynamic data on page load
	$.getJSON("/query", "qt=num_students", updateNumStudents);
	$.getJSON("/query", "qt=data&since=5", displayData);
	
	// For student list
	// Refresh dynamic data on page load
	$.getJSON("/query", "qt=students", updateStudents);
	initializeGraph();

	loadPane(start_pane);
}


function initializeGraph() {
//    var width = $(document).width() - 20;
//    var height = $(document).height() - 60;
    var width = 811;
    var height = 334;
    g = new Graph();
    g.addNode("Marty");
    g.addNode("Allison");
    g.addNode("Tasha");
    g.addNode("Ben");
    g.addNode("Emma");
	g.addEdge("Marty",   "Allison", {label:"aardvark, pajamas, nighty, slippers"})
	g.addEdge("Allison", "Emma",    {label:"aardvark, pajamas, blanket"})
	g.addEdge("Emma", "Ben",    {label:"warm, night, cold"})
	g.addEdge("Ben", "Tasha",    {label:"animal, nightware, ants, warm"})
	g.addEdge("Tasha", "Marty",    {label:"aardvark, slippers, nighty, ants, warm, night"})
	g.addEdge("Ben", "Marty",    {label:"aardvark, warm, night, ants"})

    /* layout the graph using the Spring layout implementation */
    var layouter = new Graph.Layout.Spring(g);
    
    /* draw the graph using the RaphaelJS draw implementation */
    var renderer = new Graph.Renderer.Raphael('canvas', g, width, height);
    
    redraw_graph = function() {
        layouter.layout();
        renderer.draw();
    };
}
