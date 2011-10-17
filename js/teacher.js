/*
# SearchParty - Learning to Search in a Web-Based Classroom
# Author: Ben Bederson - www.cs.umd.edu/~bederson
#         University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/



function onMessage(msg) {
	// Note:  Messages are limited to 32K.  This is not an issue now, but it
	// might come up in the future.
	//
	// http://code.google.com/appengine/docs/python/channel/overview.html

	updates = JSON.parse(msg.data);
	var num_updates = updates.length;
	for(var i=0; i<num_updates; i++) {
		var update = updates[i];
		switch(update.type) {
			case "query":
				handle_update_query(update.student_nickname, update.query);
				break;
			case "link_followed":
				handle_update_link_followed(update.student_nickname, update.query, update.task_idx, update.url, update.title);
				break;
			case "log_in":
				handle_update_log_in(update.student_nickname, update.task_idx);
				break;
			case "log_out":
				handle_update_log_out(update.student_nickname);
				break;
			case "task":
				handle_update_task(update.student_nickname, update.task_idx);
				break;
			case "answer":
				handle_update_answer(update.student_nickname, update.task_idx, update.text, update.explanation);
				break;
			default:
				break;
		}
	}
}

function handle_update_query(student_nickname, task_idx, query) {
	g_students[student_nickname].tasks[task_idx].searches.push({"query":query, "links_followed":[]});
	updateUI();
}

function handle_update_link_followed(student_nickname, query, url, title) {
	var searches = g_students[student_nickname].tasks[task_idx].searches;
	var num_searches = searches.length;
	var search_info = null;
	for(var i=(num_searches-1); i>=0; i--) {
		var _search_info = searches[i];
		if(_search_info.query==query) {
			search_info = _search_info;
			break;
		}
	}
	if( search_info==null ) {
		search_info = {"query":query, "links_followed":[]};
		searches.push(search_info);
	}
	search_info.links_followed.push({"url":url, "title":title});
	updateUI();
}

function handle_update_log_in(student_nickname, task_idx) {
	var student_info = g_students[student_nickname];
	if( student_info==undefined ) {
		student_info = {};
		student_info.logged_in = true;
		student_info.task_idx = task_idx;
		var tasks_list = [];
		student_info.tasks = tasks_list;
		var numTasks = numberOfTasks();
		for(var i=0; i<numTasks; i++) {
			tasks_list.push({"searches":[], answer:null});
		}
		g_students[student_nickname] = student_info;
	}
	else {
		student_info.logged_in = true;
		student_info.task_idx = task_idx;
	}
	updateUI();
}

function handle_update_log_out(student_nickname) {
	var student_info = g_students[student_nickname];
	student_info.logged_in = false;
	student_info.task_idx = null;
	updateUI();
}

function handle_update_task(student_nickname, task_idx) {
	g_students[student_nickname].task_idx = task_idx;
	updateUI();
}

function handle_update_answer(student_nickname, task_idx, text, explanation) {
	g_students[student_nickname].tasks[task_idx].answer = {"text":text, "explanation":explanation};
	updateUI();
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

function updateNumStudents() {
	var numStudents = calculateNumStudents();
	$("#num_students").html(numStudents);
}

function updateStudents() {
	var studentNames = getStudentNames();
	var lines = [];
	lines.push("<ol>");
	var numStudents = studentNames.length;
	for( var i=0; i<numStudents; i++ ) {
		var student_nickname = studentNames[i];
		var attribs = (g_students[student_nickname].logged_in ? '' : ' style="color:gray"');
		var annotation = (g_students[student_nickname].logged_in ? '' : ' (logged out)');
		lines.push("<li" + attribs + ">" + student_nickname + annotation + "</li>");
	}
	lines.push("</ol>");
	lines.push("<hr/>");
	lines.push("<pre><tt>");
	lines.push(JSON.stringify(g_students, null, 4));
	lines.push("</tt></pre>");
	var html = lines.join("");
	$("#students").html(html);
}

function asList(items, listType) {
	// listType should be either "ul" or "ol"
	lines = [];
	lines.push("<" + listType + ">");
	var numItems = items.length;
	for( var i=0; i<numItems; i++ ) {
		lines.push("<li>" + items[i] + "</li>");
	}
	lines.push("</" + listType + ">");
	return lines.join("");
}

function calculateNumStudents() {
	var numStudents = 0;
	for( var student_nickname in g_students ) {
		if( g_students[student_nickname].logged_in ) {
			numStudents++;
		}
	}
	return numStudents;
}

function getStudentNames() {
	var studentNames = [];
	for( var student_nickname in g_students ) {
		studentNames.push(student_nickname);
	}
	studentNames.sort();
	return studentNames;
}

function updateUI() {
	updateNumStudents();
	updateStudents();
}

function initialize() {
	// Open Channel
	var channel = new goog.appengine.Channel(TOKEN);
	var socket = channel.open();
	socket.onmessage = onMessage;

	updateUI();
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







//function updateNumStudents_Request() {
//	// LESSON_CODE is global, defined in the HTML file
//	// $.getJSON("/query", "qt=num_students", updateNumStudents_Callback);
//	//$.getJSON("/query", "qt=num_students&lesson_code="+LESSON_CODE, updateNumStudents_Callback);
//}
//
//function updateNumStudents_Callback(data) {
//    //var numStudents = data['num_students'];
//    //if (numStudents === 0) {
//    //    var html = "No students logged in";
//    //} else {
//    //    // var html = "# <a href='/student_list'>students</a>: " + numStudents;
//    //    var html = "# students: " + numStudents;
//    //}
//    $("#num_students").html(data["num_students"]);
//}
//
//
//
//function displaySearchers_Request(searchTerms) {
//	//$.getJSON("/query", "qt=search&terms=" + searchTerms, displaySearchers_Callback);
//}
//
//function displaySearchers_Callback(terms) {
//    var html = terms.join(", ");
//    var searchers = $("#searchers");
//    searchers.show();
//    searchers.html(html);  // TODO:  Escape html.
//    searchers.css("left", $(this).position().left + searchers.width());
//    searchers.css("top", $(this).position().top);
//}
//
//
//
//function updateStudentActivities_Request(data) {
//	//$.getJSON("/query", "qt=student_activity&lesson_code=" + LESSON_CODE, updateStudentActivities_Callback);
//}
//
//function updateStudentActivities_Callback(data) {
//    // Search terms
//	var searchTerms = data['terms'];
//	var html = "";
//	var count = searchTerms.length;
//	if (count > 0) {
//	    html += "<ul>";
//	    for (i in searchTerms) {
//		    var j = count - 1 - i;
//		    var term = searchTerms[j][0];
//		    var termCount = searchTerms[j][1];
//		    html += "<li><a class='term'>" + term + "</a> (" + termCount + ")</li>";
//	    }
//	    html += "</ul>";
//    } else {
//        html = "&lt;none&gt;";
//    }
//	$("#searchTerms").html(html);
//
//    // Followed links
//	var links = data['links'];
//	var html = "";
//	var count = links.length;
//	if (count > 0) {
//	    html += "<ul>";
//	    for (i in links) {
//	        var j = count - 1 - i;
//		    var link = links[j][0];
//		    var linkCount = links[j][1];
//		    html += "<li><a href='" + link + "' target='_blank'>" + link + "</a> (" + linkCount + ")</li>";
//	    }
//	    html += "</ul>";
//    } else {
//        html = "&lt;none&gt;";
//    }
//	$("#links").html(html);
//	
//	$(".term").mouseenter(function() {
//	    var searchTerms = $(this).html();
//		displaySearchers_Request(searchTerms);
//        var searchers = $("#searchers");
//        searchers.css("height", "20px");
//        searchers.css("left", $(this).position().left + $(this).width() + 30);
//        searchers.css("top", $(this).position().top - (searchers.height() - $(this).height()));
//	});
//	$(".term").mouseleave(function() {
//	    $("#searchers").hide();
//    });
//}
//
//
//function updateStudents_Request() {
//	//$.getJSON("/query", "qt=students&lesson_code"+LESSON_CODE, updateStudents_Callback);  // for students list
//}
//
//function updateStudents_Callback(data) {
//	var students = data;
//	var html;
//	if (students.length == 0) {
//	    html = "No students logged in";
//	} else {
//	    html = "Currently logged in students:";
//	    html += "<ul>";
//	    for (var i in students) {
//	        var student = students[i];
//	        var name = student[0];
//	        var activities = student[1];
//		    html += "<li>" + name + ": ";
//		    for (var j in activities) {
//		        if (j > 0) {
//		            html += " => ";
//		        }
//		        var activity = activities[j];
//		        var activityType = activity[0];
//		        var action = activity[1];
//		        if (activityType == 'search') {
//		            html += action;
//	            } else if (activityType == 'link') {
//	                html += "<a href = '" + action + "'>" + action + "</a>";
//		        }
//		    }
//	    }
//	    html += "</ul>";
//    }
//	$("#students").html(html);
//}

//function onMessage(msg) {
//	// Note:  Messages are limited to 32K.  This is not an issue now, but it
//	// might come up in the future.
//	//
//	// http://code.google.com/appengine/docs/python/channel/overview.html
//
//	alert(msg.data)
//    var state = JSON.parse(msg.data);
//	var sinceStr;
//	var shouldUpdateNumStudents=false;
//	var shouldUpdateTermsAndLinks=false;
//    if (state.change == "student_login") {
//		updateNumStudents_Request();
//    }
//	else if (state.change == "student_logout") {
//		updateNumStudents_Request();
//		updateStudents_Request();
//    }
//	else if (state.change == "student_search") {
//		updateStudentActivities_Request();
//		updateStudents_Request();
//    }
//	else if (state.change == "student_link_followed") {
//		updateStudentActivities_Request();
//		updateStudents_Request();
//    }
//	else if ('log' in state) {
//        $("#log").append(state.log + "<br>");
//    } 
//}
