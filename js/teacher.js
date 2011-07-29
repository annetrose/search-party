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
        var html = "# <a href='/student_list'>students</a>: ";
        html += numStudents;
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
    } else if (state.change == "student_search") {
        var sinceStr = $("#activitySlider").slider("value");
    	$.getJSON("/query", "qt=data&since=" + sinceStr, displayData);
    } else if (state.change == "student_link_followed") {
        var sinceStr = $("#activitySlider").slider("value");
    	$.getJSON("/query", "qt=data&since=" + sinceStr, displayData);
    } else if ('log' in state) {
        $("#log").append(state.log + "<br>");
    }
}

function openChannel(token) {
  var channel = new goog.appengine.Channel(token);
  var socket = channel.open();
  socket.onmessage = onMessage;
}