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
            html += "<br/>";
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


//  below here were copied from HTML on 10-12-2011

function initEventHandlers() {
	$("#cse").contents().find("input[name='search']").focus();
	$("#cse").contents().find("input[value='Search']").click(function(event) {
		var searchTerms = $("input[name='search']").val();
		searchExecuted(searchTerms);
	});
}

function doSearch(searchStr) {
	$("input[name='search']").focus();
	$("input[name='search']").val(searchStr);
	$("input[value='Search']").trigger('click');
}

function searchCompleteCallback() {  // called from js/student_custom_search.js
	// TODO:  Send the search query and, if possible, the title of the link
	$("#cse").contents().find("a[class='gs-title']").click(function(event) {
		var href = $(this).attr("href");
        var title = $(this).text();
		linkFollowed(href, title)
	});
	
	// Ads seem to show up a bit later, so we wait a bit and then remove them
	setTimeout("hideAds()", 500);
}

function hideAds() {
	$("#cse").contents().find(".gsc-adBlock").css("display", "none");
	$("#cse").contents().find(".gsc-adBlockVertical").css("display", "none");
	$("#cse").contents().find(".gsc-tabsArea").css("display", "none");			
}

function searchExecuted(query) {
    window.g_lastQuery = query;
	$.post("/search_executed", {"query" : query, "task_idx":selectedTaskIdx()});
	getHistory();
}

function linkFollowed(url, title) {
	$.post("/link_followed", {"url" : url,  "title":title, "query":g_lastQuery, "task_idx":selectedTaskIdx()});
	getHistory();
}

function initialize() {
	openChannel(TOKEN);
//	onResize();

	// Refresh dynamic data on page load
//	getHistory();
};

//$(window).resize(function() {
//	onResize();
//});

//function onResize() {
//	var height = $("#body").height();
//	$("#browser_table_row").css("height", height - 100);
//	$("#browser_iframe").attr("src", "http://www.google.com");
//}

function getHistory() {
	var task_idx = selectedTaskIdx();   // selectedTaskIdx is defined in js/task_chooser.js
	$.getJSON("/query", "qt=student_activity&task_idx="+task_idx, updateHistory);			
}
