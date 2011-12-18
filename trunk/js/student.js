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
	$("#custom_search_element").contents().find("input[name='search']").focus();
	$("#custom_search_element").contents().find("input[value='Search']").click(function(event) {
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
	$("#custom_search_element").contents().find("a[class='gs-title']").click(function(event) {
		var href = $(this).attr("href");
		if(href.indexOf("://www.google.com/url?") > 0) {
			// For example:
			// http://www.google.com/url?q=http://www.thefreedictionary.com/fawn&sa=U&ei=...&ved=...&client=internal-uds-cse&usg=...
			var queryParts = href.slice(href.indexOf("?")+1).split("&");
			alert( JSON.stringify(queryParts) );
			for( var queryPartNum in queryParts ) {
				var queryPart = queryParts[queryPartNum];
				if( queryPart.substr(0,2)==="q=" ) {
					href = queryPart.substr(2);
					break;
				}
			}
		}
        var title = $(this).text();
		onLinkFollowed(href, title);

		// Open the link in the IFRAME.  If we used the a.target attribute
		// Firefox insisted on opening it in a new tab/window.
		$("#result_frame").get(0).src = href;
		return false;
	});
	
	// Ads seem to show up a bit later, so we wait a bit and then remove them
	setTimeout("hideAds()", 500);
}

function getSpecificURLParameter(url, theArgName) {
	/* Thanks to  Eric Scheid ("ironclad") for this snippet, which was downloaded from ...
	 * http://www.evolt.org/article/Javascript_to_Parse_URLs_in_the_Browser/17/14435/?format=print
	 * ... on 4-27-2010 ...
	 * ... and adapted by Alex Quinn.
	 */

	var queryString = url.slice(url.indexOf("?"));
	var sArgs = queryString.slice(1).split('&');
    var r = '';
    for (var i = 0; i < sArgs.length; i++) {
        if (sArgs[i].slice(0,sArgs[i].indexOf('=')) == theArgName) {
            r = sArgs[i].slice(sArgs[i].indexOf('=')+1);
            break;
        }
    }
    r = (r.length > 0 ? unescape(r).split(',') : '');
	if(r.length==1) {
		r = r[0];
	}
	else if(r.length==0) {
		r = '';
	}
	else {
		// alert("ERROR 5610:  Please tell Alex Quinn at aq@cs.umd.edu.");
		r = "";
	}
	return r;
}
function hideAds() {
	$("#custom_search_element").contents().find(".gsc-adBlock").css("display", "none");
	$("#custom_search_element").contents().find(".gsc-adBlockVertical").css("display", "none");
	$("#custom_search_element").contents().find(".gsc-tabsArea").css("display", "none");			
}

function onSearchExecuted(query) {
    g_lastQuery = query;
	$.post("/search_executed", {
		query : query,
		student_nickname : g_studentNickname,
		lesson_code : g_lessonCode,
		task_idx : selectedTaskIdx()}
	);

	// Add this search to the list.
	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var searches = taskInfo.searches;
	var searchInfo = {query:query, links_followed:[]};
	searches.push(searchInfo);

	// Update the rendering of the history list.
	updateQueryHistory();
}

function onQueryLinkClicked(event) {
	var url = event.target.href;
	var title = event.target.title;

	var href = url;
	$("#result_frame").get(0).src = "";
	$("#result_page_title").html("");
	$("#result_page_title").html(title);
	$("#result_frame").get(0).src = url;
	g_current_result_url = url;
	switchToResultPage();
	return false;
}

function switchToResultPage() {
	$("#result_page_container").show();
	$("#search_container").hide();
}
function switchToSearch() {
	$("#result_frame").get(0).src = "about:blank";
	$("#result_page_container").hide();
	$("#search_container").show();
}

function onLinkFollowed(url, title) {
	var query = g_lastQuery;
	$.post("/link_followed", {
		url : url,
		title : title,
		query : query,
		student_nickname : g_studentNickname,
		lesson_code : g_lessonCode,
		task_idx : selectedTaskIdx()
	});

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
	taskInfo.answer = answerInfo;
}

function initialize() {
	switchToSearch();

	openChannel(TOKEN);
	updateQueryHistory();

	var checkContent = function() {
		var answerText = document.getElementById("answer_text").value;
		var answerTextIsEmpty = (answerText.trim().length==0);
		var answerExplanation = document.getElementById("answer_explanation").value;
//		var answerExplanationIsEmpty = (answerExplanation.trim().length==0);
//		document.getElementById("answer_button").disabled = (answerTextIsEmpty || answerExplanationIsEmpty);
		document.getElementById("answer_button").disabled = answerTextIsEmpty;
	};
	$("#answer_text").keyup(checkContent);
	$("#answer_explanation").keyup(checkContent);
	$("#answer_button").click(function() {
			var answerText = document.getElementById("answer_text").value;
			var answerExplanation = document.getElementById("answer_explanation").value;
			$.post("/answer", {
				task_idx: selectedTaskIdx(),
				student_nickname : g_studentNickname,
				lesson_code : g_lessonCode,
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

	$.post("/link_rated", {
		url : g_current_result_url,task_idx : selectedTaskIdx(),
		is_helpful : is_helpful_str,
		student_nickname : g_studentNickname,
		lesson_code : g_lessonCode,
	});
}

function getLinkInfosByQuery(searches) {
	// Aggregate links by query
	// Links sorted by time descending

	var linkInfosByQuery = {};
	var urlsSeen = {};
	var numSearches = searches.length;
	for(var searchIdx=numSearches-1; searchIdx>=0; searchIdx--) {  // descending time order
		var search = searches[searchIdx];
		var query = search.query;

		var linksForThisQuery = linkInfosByQuery[query];
		if(linksForThisQuery==undefined) {
			linkInfosByQuery[query] = linksForThisQuery = [];
		}

		var linksFollowed = search.links_followed;
		var numLinksFollowed = linksFollowed.length;
		for(var linkIdx=numLinksFollowed-1; linkIdx>=0; linkIdx--) {  // descending time order
			var linkInfo = linksFollowed[linkIdx];
			var url = linkInfo.url;
			var urlsSeenKey = url + "::" + query;
			if(urlsSeen[urlsSeenKey]==undefined) {
				urlsSeen[urlsSeenKey] = true;
				linksForThisQuery.push(linkInfo);
			}
		}
	}
	return linkInfosByQuery;
}

function sortAndDedupeSearches(searches) {
	// Sort by time descending
	// Group all links under same query
	// Dedupe queries, keeping the most recent
	// Links also sorted by time descending

	var linkInfosByQuery = getLinkInfosByQuery(searches);
	var queriesSeen = {};
	var numSearches = searches.length;
	var processedSearches = [];
	for(var searchIdx=numSearches-1; searchIdx>=0; searchIdx--) {  // descending time order
		var search = searches[searchIdx];
		var query = search.query;
		if(queriesSeen[query]==undefined) {
			queriesSeen[query] = true;
			var linkInfos = linkInfosByQuery[query];
			if(linkInfos != undefined) {
				var searchInfo = {
					query: query,
					links_followed: linkInfosByQuery[query]
				};
				processedSearches.push(searchInfo);
			}
		}
	}
	return processedSearches;
}

function updateQueryHistory() {
	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var processedSearches = sortAndDedupeSearches(taskInfo.searches);
	var numProcessedSearches = processedSearches.length;
	var queryHistory = $("#query_history");

	var scheme=5;


	if(numProcessedSearches==0) {
		queryHistory.replaceWith('<div id="query_history">No searches, yet</div>')
	}
	else {
		var parts = [];
		parts.push('<ol id="query_history">');
//		for(var searchIdx=numProcessedSearches-1; searchIdx>=0; searchIdx--) {
		for(var searchIdx=0; searchIdx<numProcessedSearches; searchIdx++) {
			var search = processedSearches[searchIdx];
			var searchNumToDisplay = numProcessedSearches - searchIdx;
			var query = search.query;
			parts.push('<li value="' + searchNumToDisplay + '">')
			parts.push(escapeForHtml(query));
			var linksFollowed = search.links_followed;
			var numLinksFollowed = linksFollowed.length;
			if( numLinksFollowed > 0 ) {
				parts.push('<ul class="query_history_links scheme'+scheme+'">');
//				parts.push('<ol type="a" class="query_history_links">');
				for(var j=0; j<numLinksFollowed; j++) {
					var linkInfo, className, linkHtml;

					linkInfo = linksFollowed[j];
					var is_helpful = (linkInfo.is_helpful != false);
					className = (is_helpful ? "helpful" : "not_helpful");
					parts.push('<li class="' + className + '">');
					if( scheme==3 ) {
						if( is_helpful ) {
							parts.push('<img src="/imgs/star-on.png" width="23" height="23" alt="helpful"/>')
						}
						else {
							parts.push('<img src="/imgs/star-off5.png" width="23" height="23" alt="not helpful"/>')
						}
					}
					else if( scheme==5 ) {
						if( is_helpful ) {
//							parts.push('<img src="/imgs/thumbs-up-14x14.png" width="14" height="14" alt="helpful"/>')
							parts.push('<img src="' + THUMBS_UP_14X14_DATA_URL + '" width="14" height="14" alt="helpful"/>')
						}
						else {
//							parts.push('<img src="/imgs/thumbs-down-14x14.png" width="14" height="14" alt="not helpful"/>')
							parts.push('<img src="' + THUMBS_DOWN_14X14_DATA_URL + '" width="14" height="14" alt="not helpful"/>')
						}
					}
					linkHtml = makeLinkHTML(linkInfo, 14, className, "return onQueryLinkClicked(event);");
					//var linkHtml = makeLinkHTML(linkInfo, 0);
					parts.push(linkHtml);
					if( scheme==4 ) {
						if( is_helpful ) {
							parts.push('<img src="/imgs/star-on.png" width="23" height="23" alt="helpful"/>')
						}
					}
					parts.push('</li>');
				}
				parts.push('</ul>');
//				parts.push('</ol>');
			}
			parts.push();
			parts.push('</li>');
		}
		parts.push('</ol>');
		var listHtml = parts.join("");
		queryHistory.replaceWith(listHtml);
	}
}

function onTaskChanged(taskIdx) { // called from js/task_chooser.js
	$.post("/task_changed", {
		task_idx : selectedTaskIdx(),
		student_nickname : g_studentNickname,
		lesson_code : g_lessonCode,
	});
	// Fill in previously submitted answer text and explanation.
	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var answerInfo = taskInfo.answer;
	var answerText = answerInfo.text;
	var answerExplanation = answerInfo.explanation;

	document.getElementById("answer_text").value = answerText;
	document.getElementById("answer_msg").innerHTML = "";
	document.getElementById("answer_explanation").value = answerExplanation;
	document.getElementById("answer_button").disabled = true;

	updateQueryHistory();
}
