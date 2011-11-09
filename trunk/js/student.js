/*
# SearchParty - Learning to Search in a Web-Based Classroom
# Author: Ben Bederson - www.cs.umd.edu/~bederson
#         University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

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
}

function openChannel(token) {
  var channel = new goog.appengine.Channel(token);
  var socket = channel.open();
  socket.onmessage = onMessage;
}

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
	// Find result links and register click handler.
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

function switchToResultPage() {
	$("#result_page_container").show();
	$("#search_container").hide();
}
function switchToSearch() {
	$("#result_page_container").hide();
	$("#search_container").show();
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
//	var onclick = "g_current_result_url = decodeURIComponent('" + encodeURIComponent(url) + "'); alert(g_current_result_url); return true;";
//	var linkHTML = '<a href="' + url + '" title="' + title + '" target="_blank" onclick="' + onclick + '">' + displayTitle + '</a>';
	g_current_result_url = url;
	switchToResultPage();
	$("#result_page_title").html(escapeForHtml(title))
}

function onAnswerSubmitted(text, explanation) {
	// Add this followed link to the list.
	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var answerInfo = {text:text, explanation:explanation};
	taskInfo.answerInfo = answerInfo;
}

function initialize() {
	switchToSearch();

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

	$("#helpful_button").click(onLinkRated);

	$("#not_helpful_button").click(onLinkRated);

};

function onLinkRated() {
	switchToSearch();

	var is_helpful_str;
	var is_helpful;
	if(this.id=="helpful_button") {
		is_helpful_str = "1";
		is_helpful = true;
	}
	else if(this.id=="not_helpful_button") {
		is_helpful_str = "0";
		is_helpful = false;
	}
	else {
		alert("ERROR 1108");
		return;
	}

	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var searches = taskInfo.searches;
	var numSearches = searches.length;
	for(var i=0; i<numSearches; i++) {
		var search = searches[i];
		var query = search.query;
		var linksFollowed = search.links_followed;
		var numLinksFollowed = linksFollowed.length;
		for(var j=0; j<numLinksFollowed; j++) {
			var linkInfo = linksFollowed[j];
			if(linkInfo.url==g_current_result_url) {
				linkInfo.is_helpful = is_helpful;
			}
		}
	}

	updateQueryHistory();

	$.post("/link_rated", {"url":g_current_result_url, "task_idx":selectedTaskIdx(), "is_helpful":is_helpful_str});
}

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
					var className = (linkInfo.is_helpful ? "helpful" : "not_helpful");
					var linkHtml = makeLinkHTML(linkInfo, 16, className);
					//var linkHtml = makeLinkHTML(linkInfo, 0);
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
