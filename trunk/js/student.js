/*
# SearchParty - Learning to Search in a Web-Based Classroom
# Author: Ben Bederson - www.cs.umd.edu/~bederson
#         University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

NO_FRAME_DOMAINS = ["youtube.com", "google.com", "oprah.com", "facebook.com"];

function initializeStudent() {
	openChannel();
	initUI();
};

function initUI() {
	 var lesson = g_lessons[0];
     var lesson_code = lesson.lesson_code;
     $('#lesson_title').html(lesson.title);
     $('#lesson_code').html(lesson_code);
     $('#task_chooser').selectbox();
     updateTaskDescription(0);    
     
	switchToSearch();
	updateQueryHistory();

	var checkContent = function() {
		var answerText = document.getElementById("answer_text").value;
		var answerTextIsEmpty = (answerText.trim().length==0);
		var answerExplanation = document.getElementById("answer_explanation").value;
		document.getElementById("answer_button").disabled = answerTextIsEmpty;
	};
	$("#answer_text").keyup(checkContent);
	$("#answer_explanation").keyup(checkContent);
	$("#answer_button").click(function() {
			var answerText = document.getElementById("answer_text").value;
			var answerExplanation = document.getElementById("answer_explanation").value;
			$.ajax({
				type: 'POST',
				url: "/answer", 
				dataType: "json",
				data: {
					task_idx: selectedTaskIdx(),
					student_nickname : g_studentNickname,
					lesson_code : g_lessons[0].lesson_code,
					answer_text: answerText,
					answer_explanation: answerExplanation
				},
				cache: false,
				success: function(data) {
					if (data.status==0) {
		            	showLoggedOutWarning();
		            }
				}
			});
			
			document.getElementById("answer_msg").innerHTML = "Saved (" + ((new Date()).toLocaleTimeString()) + ")";
			onAnswerSubmitted(answerText, answerExplanation);
			return false;
	});

	$("#helpful_button").click(onLinkRated);
	$("#not_helpful_button").click(onLinkRated);
	$("#neutral_button").click(onLinkNeutral);
}

//=================================================================================
// Channel Presence
//=================================================================================

function openChannel() {
	var channel = new goog.appengine.Channel(TOKEN);
	var socket = channel.open();
	socket.onopen = onSocketOpen;
	socket.onmessage = onSocketMessage;
	socket.onerror = onSocketError;
	socket.onclose = onSocketClose;
}

function onSocketOpen() {
}

function onSocketMessage(msg) {
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

function onSocketError(error) {
	if (error.code==401) {
		$.post('/channel_expired/'+g_lessons[0].lesson_code, {}, updateChannelToken, 'json');
	}
}

function onSocketClose() {
}

function updateChannelToken(data) {
	TOKEN = data['token'];
	openChannel();
}

//=================================================================================
// UI Event Handlers
//=================================================================================

function initEventHandlers() {
	$("#custom_search_element").contents().find("input[name='search']").focus();
	$("#custom_search_element").contents().find("input[value='Search']").click(function(event) {
		var searchTerms = $("input[name='search']").val();
		onSearchExecuted(searchTerms);
	});
}

function updateTaskDescription(taskIdx) {
    var html = g_lessons[0].tasks[taskIdx][1];
    if (html == '') html = '(none)';
    $('#task_description').html(html);
}

function onTaskChanged(taskIdx) { // called from js/task_chooser.js
    updateTaskDescription(taskIdx);
	$.post("/task_changed", {
		task_idx : selectedTaskIdx(),
		student_nickname : g_studentNickname,
		lesson_code : g_lessons[0].lesson_code,
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

function onSearchComplete() {  // called from js/student_custom_search.js
	g_lastQuery = $("input[name='search']").val();
	$.ajax({
		type: 'POST',
		url: "/search_executed", 
		dataType: "json",
		data: {
			query : g_lastQuery,
			student_nickname : g_studentNickname,
			lesson_code : g_lessons[0].lesson_code,
			task_idx : selectedTaskIdx() 
		},
		cache: false,
		success: function(data) {
            if (data.status==1) {
            	// Add this search to the list.
            	var taskIdx = selectedTaskIdx();
            	var taskInfo = g_student_info.tasks[taskIdx];
            	var searches = taskInfo.searches;
            	var searchInfo = { query:g_lastQuery, links_followed:[] };
            	searches.push(searchInfo);

            	// Update the rendering of the history list.
            	updateQueryHistory();

            	// Clear search text box
            	//$("input[name='search']").val('');
            	
            	// Find result links and register click handler.
            	$("#custom_search_element").contents().find("a[class='gs-title']").click(function(event) {
            		var url = $(this).attr("href");
            		if(url.indexOf("://www.google.com/url?") > 0) {
            			// For example:
            			// http://www.google.com/url?q=http://www.thefreedictionary.com/fawn&sa=U&ei=...&ved=...&client=internal-uds-cse&usg=...
            			var queryParts = url.slice(url.indexOf("?")+1).split("&");
            			for( var queryPartNum in queryParts ) {
            				var queryPart = queryParts[queryPartNum];
            				if( queryPart.substr(0,2)==="q=" ) {
            					url = queryPart.substr(2);
            					break;
            				}
            			}
            		}
                    var title = $(this).text();
            		onLinkFollowed(url, title);
            		openLink(url, title);
            		return false;
            	});
            	
            	// Ads seem to show up a bit later, so we wait a bit and then remove them
            	setTimeout("hideAds()", 500);
            }
            else {
                showLoggedOutWarning();
           }
        },
        error: function() {
        }
	});
}

function showLoggedOutWarning() {
	$('#logged_out_warning').dialog({
        autoOpen: true,
        modal: true,
        buttons: {
          Ok: function() {
            $(this).dialog("close");
            window.location.reload(true);
          }
        }
    });
}

function onQueryLinkClicked(event) {
	var url = event.target.href;
	var title = event.target.title;
	openLink(url, title);
	return false;
}

function onLinkFollowed(url, title) {
	$.ajax({
		type: 'POST',
		url: "/link_followed", 
		dataType: "json",
		data: {
			url : url,
			title : title,
			query : g_lastQuery,
			student_nickname : g_studentNickname,
			lesson_code : g_lessons[0].lesson_code,
			task_idx : selectedTaskIdx(),		
		},
		cache: false,
		success: function(data) {
			if (data.status==0) {
            	showLoggedOutWarning();
            }
		}
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
}

function onLinkRated() {
	switchToSearch();

	var is_helpful_str;
	var is_helpful;
	if (this.id=="helpful_button") {
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
		for (var j=0; j<numLinksFollowed; j++) {
			var linkInfo = linksFollowed[j];
			if (linkInfo.url==g_current_result_url) {
				linkInfo.is_helpful = is_helpful;
			}
		}
	}

	updateQueryHistory();
	
	$.ajax({
		type: 'POST',
		url: "/link_rated", 
		dataType: "json",
		data: {
			url : g_current_result_url,task_idx : selectedTaskIdx(),
			is_helpful : is_helpful_str,
			student_nickname : g_studentNickname,
			lesson_code : g_lessons[0].lesson_code,
		},
		cache: false,
		success: function(data) {
			if (data.status==0) {
            	showLoggedOutWarning();
            }
		}
	});
}

function onLinkNeutral() {
	switchToSearch();
}

function onAnswerSubmitted(text, explanation) {
	// Add this followed link to the list.
	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var answerInfo = {text:text, explanation:explanation};
	taskInfo.answer = answerInfo;
}

function updateQueryHistory() {
	var taskIdx = selectedTaskIdx();
	var taskInfo = g_student_info.tasks[taskIdx];
	var processedSearches = sortAndDedupeSearches(taskInfo.searches);
	var numProcessedSearches = processedSearches.length;
	var queryHistory = $("#query_history");
	var scheme=5;

	if (numProcessedSearches==0) {
		queryHistory.replaceWith('<div id="query_history">No searches, yet</div>')
	}
	else {
		var parts = [];
		parts.push('<ol id="query_history">');
		for(var searchIdx=0; searchIdx<numProcessedSearches; searchIdx++) {
			var search = processedSearches[searchIdx];
			var searchNumToDisplay = numProcessedSearches - searchIdx;
			var query = search.query;
			parts.push('<li value="' + searchNumToDisplay + '" style="margin-top:12px;">')
			parts.push(escapeForHtml(query));
			var linksFollowed = search.links_followed;
			var numLinksFollowed = linksFollowed.length;
			if (numLinksFollowed > 0) {
				parts.push('<ul class="query_history_links scheme'+scheme+'">');
				for(var j=0; j<numLinksFollowed; j++) {
					var linkInfo, className, linkHtml;

					linkInfo = linksFollowed[j];
					className = 'unrated';
					var is_helpful = linkIsHelpful(linkInfo);
					if (is_helpful != null) {
						className = (is_helpful ? "helpful" : "not_helpful");
					}
					
					parts.push('<li class="' + className + '">');
					if (scheme==3 && is_helpful!=null) {
						if( is_helpful ) {
							parts.push('<img src="/imgs/star-on.png" width="23" height="23" alt="helpful"/>')
						}
						else {
							parts.push('<img src="/imgs/star-off5.png" width="23" height="23" alt="not helpful"/>')
						}
					}
					linkHtml = makeLinkHTML(linkInfo, 20, className, "return onQueryLinkClicked(event);");
					parts.push(linkHtml+'&nbsp;');
					if (scheme==4 && is_helpful!=null) {
						if( is_helpful ) {
							parts.push('<img src="/imgs/star-on.png" width="23" height="23" alt="helpful"/>')
						}
					}
					else if (scheme==5 && is_helpful!=null) {
						if( is_helpful ) {
							parts.push('<img src="' + THUMBS_UP_14X14_DATA_URL + '" width="14" height="14" alt="helpful"/>')
						}
						else {
							parts.push('<img src="' + THUMBS_DOWN_14X14_DATA_URL + '" width="14" height="14" alt="not helpful"/>')
						}
					}
					parts.push('</li>');
				}
				parts.push('</ul>');
			}
			parts.push();
			parts.push('</li>');
		}
		parts.push('</ol>');
		var listHtml = parts.join("");
		queryHistory.replaceWith(listHtml);
	}
}

function linkIsHelpful(linkInfo) {	
	// link rated helpful returns true
	// link rated unhelpful returns false
	// link not rated returns null
	var isHelpful = null;
	if (linkInfo.is_helpful != null) {
		isHelpful = linkInfo.is_helpful;
	}
	return isHelpful;
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

function openLink(url, title) {
	$("#result_page_title").html("");
	if( domainAllowsFraming(url) ) {
		// Open the link in the IFRAME.  If we used the a.target attribute
		// Firefox insisted on opening it in a new tab/window.
		$("#result_frame").get(0).src = "";
		$("#result_frame").get(0).src = url;
		$("#result_frame").css("display", "block");
		$("#no_frame_message").css("display", "none");
	}
	else {
		$("#result_frame").css("display", "none");
		$("#no_frame_message").css("display", "block");
		window.open(url);
	}
	$("#result_page_title").html(title);
	g_current_result_url = url;
	switchToResultPage();
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

function hideAds() {
	$("#custom_search_element").contents().find(".gsc-adBlock").css("display", "none");
	$("#custom_search_element").contents().find(".gsc-adBlockVertical").css("display", "none");
	$("#custom_search_element").contents().find(".gsc-tabsArea").css("display", "none");			
}

//=================================================================================
// Helpers
//=================================================================================

function parseUrl(url) {
	var urlRegExp = new RegExp("^([a-z]{3,5})"    // type
			                 + "://"              // ://
							 + "([^?/#:]+)"       // domain
							 + "(:([0-9]{1,5}))?" // port
							 + "(/[^?#:]*)?"      // path
							 + "(\\?([^?/#:]+))?" // query string
							 + "(#[^?/#:]*)?");   // hash locator
	var parts = urlRegExp.exec(url);
	return {
		type: parts[1],
		domain: parts[2],
		port: parts[4] || null,
		path: parts[5] || null,
		queryString: (parts[7] || null)
	};
}

function domainAllowsFraming(url) {
	var domain = parseUrl(url).domain;
	var urlParsed = parseUrl(url);
	var domain = urlParsed.domain;
	var noFrameDomains = NO_FRAME_DOMAINS;
	var result = true;
	for( var numNoFrameDomains=noFrameDomains.length, i=0; i<numNoFrameDomains; i++ ) {
		var noFrameDomain = noFrameDomains[i];
		if( noFrameDomain===domain ) {
			result = false;
			break;
		}
		else {
			var pos = domain.lastIndexOf(noFrameDomain);
			if((pos + noFrameDomain.length == domain.length) && (pos==0 || domain.charAt(pos-1)=="." ) ) {
				result = false;
				break;
			}
		}
	}
	return result;
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