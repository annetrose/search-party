/*
# SearchParty - Learning to Search in a Web-Based Classroom
# Author: Ben Bederson - www.cs.umd.edu/~bederson
#         University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

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

function onMessage(msg) {
    var state = JSON.parse(msg.data);
    if (state.change == "student_login") {
    	$.getJSON("/query", "qt=students", updateStudents);
    } else if (state.change == "student_logout") {
    	$.getJSON("/query", "qt=students", updateStudents);
    } else if (state.change == "student_search") {
    	$.getJSON("/query", "qt=students", updateStudents);
    } else if (state.change == "student_link_followed") {
    	$.getJSON("/query", "qt=students", updateStudents);
    }
}

function openChannel(token) {
  var channel = new goog.appengine.Channel(token);
  var socket = channel.open();
  socket.onmessage = onMessage;
}
