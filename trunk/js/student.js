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
		onSearchExecuted(searchTerms);
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
		onLinkFollowed(href, title)
	});
	
	// Ads seem to show up a bit later, so we wait a bit and then remove them
	setTimeout("hideAds()", 500);
}

function hideAds() {
	$("#cse").contents().find(".gsc-adBlock").css("display", "none");
	$("#cse").contents().find(".gsc-adBlockVertical").css("display", "none");
	$("#cse").contents().find(".gsc-tabsArea").css("display", "none");			
}

function onSearchExecuted(query) {
    g_lastQuery = query;
	$.post("/search_executed", {"query" : query, "task_idx":selectedTaskIdx()});

	// Add this search to the list.
	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var searches = taskInfo.searches;
	var searchInfo = {query:query, links_followed:[]};
	searches.push(searchInfo);

	// Update the rendering of the history list.
	updateQueryHistory();
}

function onLinkFollowed(url, title) {
	var query = g_lastQuery;
	$.post("/link_followed", {"url" : url,  "title":title, "query":query, "task_idx":selectedTaskIdx()});

	// Add this followed link to the list.
	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var searches = taskInfo.searches;
	var searchInfo = searches[searches.length - 1];
	var linksFollowed = searchInfo.links_followed;
	var linkInfo = {url:url, title:title};
	linksFollowed.push(linkInfo);

	// Update the rendering of the history list.
	updateQueryHistory();
}

function onAnswerSubmitted(text, explanation) {
	// Add this followed link to the list.
	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var answerInfo = {text:text, explanation:explanation};
	taskInfo.answerInfo = answerInfo;
}

function initialize() {
	openChannel(TOKEN);
	updateQueryHistory();

	var checkContent = function() {
		var answerText = document.getElementById("answer_text").value;
		var answerTextIsEmpty = (answerText.trim().length==0);
		var answerExplanation = document.getElementById("answer_explanation").value;
		var answerExplanationIsEmpty = (answerExplanation.trim().length==0);
		document.getElementById("answer_button").disabled = (answerTextIsEmpty || answerExplanationIsEmpty);
	};
	$("#answer_text").keyup(checkContent);
	$("#answer_explanation").keyup(checkContent);
	$("#answer_button").click(function() {
			var answerText = document.getElementById("answer_text").value;
			var answerExplanation = document.getElementById("answer_explanation").value;
			$.post("/answer", {
				task_idx: selectedTaskIdx(),
				answer_text: answerText,
				answer_explanation: answerExplanation
			});
			document.getElementById("answer_msg").innerHTML = "Saved (" + ((new Date()).toLocaleTimeString()) + ")";
			onAnswerSubmitted(answerText, answerExplanation);
			return false;
	});
};

function updateQueryHistory() {
	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var searches = taskInfo.searches;
	var numSearches = searches.length;
	var queryHistory = $("#query_history");
	if(numSearches==0) {
		queryHistory.replaceWith('<div id="query_history">No searches, yet</div>')
	}
	else {
		var parts = [];
		parts.push('<ol id="query_history">');
		for(var i=0; i<numSearches; i++) {
			var search = searches[i];
			var query = search.query;
			parts.push('<li>');
			parts.push(escapeForHtml(query));
			var linksFollowed = search.links_followed;
			var numLinksFollowed = linksFollowed.length;
			if( numLinksFollowed > 0 ) {
				parts.push('<ol type="a" class="query_history_links">');
				for(var j=0; j<numLinksFollowed; j++) {
					var linkInfo = linksFollowed[j];
					parts.push('<li>');
					var linkHtml = makeLinkHTML(linkInfo, 16);
					parts.push(linkHtml);
					parts.push('</li>');
				}
				parts.push('</ol>');
			}
			parts.push();
			parts.push('</li>');
		}
		parts.push('</ol>');
		var listHtml = parts.join("\n");
		queryHistory.replaceWith(listHtml);
	}
}

function onTaskChanged(taskIdx) { // called from js/task_chooser.js
	$.post("/task_changed", {"task_idx":selectedTaskIdx()});
	document.getElementById("answer_text").value = "";
	document.getElementById("answer_msg").innerHTML = "";
	document.getElementById("answer_explanation").value = "";
	document.getElementById("answer_button").disabled = true;

	// Fill in previously submitted answer text and explanation.
	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var answerInfo = {text:text, explanation:explanation};
	taskInfo.answerInfo = taskInfo.answer;
}
