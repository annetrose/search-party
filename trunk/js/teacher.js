/*
# SearchParty - Learning to Search in a Web-Based Classroom
# Author: Ben Bederson - www.cs.umd.edu/~bederson
#         University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

function updateNumStudents_Request() {
	// LESSON_CODE is global, defined in the HTML file
	// $.getJSON("/query", "qt=num_students", updateNumStudents_Callback);
	//$.getJSON("/query", "qt=num_students&lesson_code="+LESSON_CODE, updateNumStudents_Callback);
}

function updateNumStudents_Callback(data) {
    //var numStudents = data['num_students'];
    //if (numStudents === 0) {
    //    var html = "No students logged in";
    //} else {
    //    // var html = "# <a href='/student_list'>students</a>: " + numStudents;
    //    var html = "# students: " + numStudents;
    //}
    $("#num_students").html(data["num_students"]);
}



function displaySearchers_Request(searchTerms) {
	//$.getJSON("/query", "qt=search&terms=" + searchTerms, displaySearchers_Callback);
}

function displaySearchers_Callback(terms) {
    var html = terms.join(", ");
    var searchers = $("#searchers");
    searchers.show();
    searchers.html(html);  // TODO:  Escape html.
    searchers.css("left", $(this).position().left + searchers.width());
    searchers.css("top", $(this).position().top);
}



function updateStudentActivities_Request(data) {
	//$.getJSON("/query", "qt=student_activity&lesson_code=" + LESSON_CODE, updateStudentActivities_Callback);
}

function updateStudentActivities_Callback(data) {
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
		displaySearchers_Request(searchTerms);
        var searchers = $("#searchers");
        searchers.css("height", "20px");
        searchers.css("left", $(this).position().left + $(this).width() + 30);
        searchers.css("top", $(this).position().top - (searchers.height() - $(this).height()));
	});
	$(".term").mouseleave(function() {
	    $("#searchers").hide();
    });
}


function updateStudents_Request() {
	//$.getJSON("/query", "qt=students&lesson_code"+LESSON_CODE, updateStudents_Callback);  // for students list
}

function updateStudents_Callback(data) {
	var students = data;
	var html;
	if (students.length == 0) {
	    html = "No students logged in";
	} else {
	    html = "Currently logged in students:";
	    html += "<ul>";
	    for (var i in students) {
	        var student = students[i];
	        var name = student[0];
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


function onMessage(msg) {
	// Note:  Messages are limited to 32K.  This is not an issue now, but it
	// might come up in the future.
	//
	// http://code.google.com/appengine/docs/python/channel/overview.html

    var state = JSON.parse(msg.data);
	var sinceStr;
	var shouldUpdateNumStudents=false;
	var shouldUpdateTermsAndLinks=false;
    if (state.change == "student_login") {
		updateNumStudents_Request();
    }
	else if (state.change == "student_logout") {
		updateNumStudents_Request();
		updateStudents_Request();
    }
	else if (state.change == "student_search") {
		updateStudentActivities_Request();
		updateStudents_Request();
    }
	else if (state.change == "student_link_followed") {
		updateStudentActivities_Request();
		updateStudents_Request();
    }
	else if ('log' in state) {
        $("#log").append(state.log + "<br>");
    } 
}

var g_currentPaneName = null;

function loadPane(paneName) {
	if(g_currentPaneName !== null) {
		$("#"+getPaneId(g_currentPaneName)).removeClass("selected");
		$("#"+loadButtonId(g_currentPaneName)).removeClass("selected");
	}
	g_currentPaneName = paneName;
	$("#"+getPaneId(g_currentPaneName)).addClass("selected");
	$("#"+loadButtonId(g_currentPaneName)).addClass("selected");
	window.location.hash = g_currentPaneName;
}
function getPaneId(paneName) {
	return "pane_" + paneName;
}
function loadButtonId(paneName) {
	return "load_" + paneName + "_btn";
}


function initialize() {
	// Open Channel
	var channel = new goog.appengine.Channel(TOKEN);
	var socket = channel.open();
	socket.onmessage = onMessage;

    // DON'T REFRESH ANYTHING, FOR NOW
    //
    // We're going to redo this so the data is slipped into the initial page.
    //
	// Refresh dynamic data on page load
	//updateNumStudents_Request();
	//updateStudentActivities_Request();
	//updateStudents_Request();

	//initializeGraph();

	loadPane(START_PANE);
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

