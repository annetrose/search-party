/*
# SearchParty - Learning to Search in a Web-Based Classroom
# Author: Ben Bederson - www.cs.umd.edu/~bederson
#         University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

function updateHistory(data) {
    var activities = data
    var html = "";
    
    for (var i in activities) {
        if (i > 0) {
            html += " => ";
        }
        var activity = activities[i];
        var activityType = activity[0];
        var action = activity[1];
        if (activityType == 'search') {
            var searchCall = "doSearch(\"" + action + "\")";
            html += "<a class='term' onclick='" + searchCall + "'>" + action + "</a>";
        } else if (activityType == 'link') {
            var linkFollowed = "linkFollowed(\"" + action + "\")";
            html += "<a target='_blank' onclick='" + linkFollowed + "' href = '" + action + "'>" + action + "</a>";
        }
    }
    
    $("#history").html(html);
}

function onMessage(msg) {
    var state = JSON.parse(msg.data);
    if ("log" in state) {
		$("#log").append("message received: " + state.log + "<br>");
	} else if ('status' in state) {
		if (state.status=="on") {
			$("#status_header").hide();
		} else {
			$("#status_header").show();
			$("#status_header").html("Teacher is OFFLINE");
		}
    }
	
	// if (state.change == "student_login") {
    //  $.getJSON("/query", "qt=students", updateStudents);
    // } else if (state.change == "student_logout") {
    //  $.getJSON("/query", "qt=students", updateStudents);
    // } else if (state.change == "student_search") {
    //  $.getJSON("/query", "qt=students", updateStudents);
    // } else if (state.change == "student_link_followed") {
    //  $.getJSON("/query", "qt=students", updateStudents);
    // }
}

function openChannel(token) {
  var channel = new goog.appengine.Channel(token);
  var socket = channel.open();
  socket.onmessage = onMessage;
}
