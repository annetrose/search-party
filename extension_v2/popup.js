//var g_studentInfo = null; // Moved this to background.js

$(document).ready(function() {
	
	//alert("hey");
	//getQueryHistoryHtml();
	loadStudent(true);
});

/**
 * Loads student data and optionally updates the UI to reflect the updated student data.
 *
 * @init If true, initialize the UI, otherwise only update student data.
 */
function loadStudent(init) {
	$('#content').hide();
	$('#loading').show();
	$.ajax({
		type : 'POST',
		url : SEARCH_PARTY_URL + "/student_info",
		dataType : "json",
		data : {
			task_idx : getStoredTask()
		},
		cache : false,
		success : function(data) {
			g_studentInfo = data;
			updateBadge(data.status);
			
			if (init) {
				initUI(data);
			}
			
			if (data.status == 1) { // Check if student is logged in
				var taskIndex = getSelectedTaskIndex();
				var taskDesc = g_studentInfo.lesson.tasks[taskIndex][1];
				$('#task_desc').html(taskDesc);
				$('#task_history').html(getHistoryHtml());
				
				var json_text = JSON.stringify(g_studentInfo, null, 2);

				if (getStoredLink() != '') {
					var ratingHtml = '<h2>Link Rating</h2>';
					if (getStoredLinkTitle() != '')
						ratingHtml += getStoredLinkTitle() + '<br/>';
					ratingHtml += getStoredLink() + '<br/>';
					ratingHtml += getRatingSelector() + '<br/>';
					ratingHtml += '<hr style="color:grey"/>';
					$('#rating_area').html(ratingHtml);
					updateLinkRating(getStoredLink());
					$('input[name=rating]').change(onRatingChanged);
				} else {
					$('#rating_area').html('');
				}

				var responseHtml = '<h2>Response</h2>';
				responseHtml += json_text + '<br /><br />';
				responseHtml += getResponseControls() + '<br/>';
				responseHtml += '<hr style="color:grey"/>';
				$('#response_area').html(responseHtml);
				updateResponse();
				$('#response').change(function() {
					onUnsavedResponse();
				});
				$('#explanation').change(function() {
					onUnsavedResponse();
				});
				$('#submit_response').click(function() {
					onResponseChanged();
				});

				// Send message to content script requesting an update to the
				// in-browser SearchParty UI
				chrome.tabs.getSelected(null, function(tab) {

					// Create message on port
					var port = chrome.tabs.connect(tab.id, {
						name : "spTopUi"
					});
					port.postMessage({
						message_type: 'show_top_ui',
						task_index : taskIndex,
						task_description : taskDesc
					});

				});

			}
			$('#loading').hide();
			$('#content').show();
		},
		error : function() {
			g_studentInfo = null;
			$('#content').html('Error connecting to ' + SEARCH_PARTY_URL);
			$('#loading').hide();
			$('#content').show();
		}
	});
}

function initUI(data) {
	var content = '<div style="font-size: 14pt; font-weight: bold; float: left;">Search Party';
//	if (data.status==1) {
//		content += ' <a id="student_link" href="#" class="note">[View web interface]</a>';
//	}
	content += '</div>';

	if (data.status == 1) {
		var nickname = data.anonymous===true ? "Anonymous" : data.student_nickname;
		content += '<div style="float:right">Welcome '+nickname+' | <a href="#" id="logout_link">Logout</a></div>';
		content += '<div style="clear:both"></div>';
		content += '<div class="note" style="float:right">Activity #'+data.lesson.lesson_code+'</div>';
		content += '<h2>Task</h2>';
		content += getTaskSelector()+'<br/>';
		content += '<div id="task_desc"></div>';
		content += '<hr style="color:grey"/>';
		content += '<div id="rating_area"></div>';
		content += '<div id="response_area"></div>';
		content += '<h2>Search History</h2>';
		content += '<div id="task_history"></div>';
	}
	else {
		content += '<div style="clear:both"></div>';
		content += '<p>Please login to <a href="#" id="login_link">Search Party</a> as a student to record searches.</p>';
	}
	$('#content').html(content);

	if (data.status == 1) {
		var taskIndex = getStoredTask();
		$('#task_chooser').val(taskIndex);
		$('#task_chooser').change(onTaskChanged);
		$('#student_link').click(onShowWebInterface);
		$('#logout_link').click(onLogout);
	}
	else {
		$('#login_link').click(onLogin); 
	}
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.type=='rating' || request.type=='answer') {
		g_studentInfo.history.push(request);
		$('#task_history').html(getHistoryHtml());
	}
	else {
		console.log(request.type+' not handled');
	}

	if (request.type=='answer') {
		if (request.timestamp!='') {
			var timestamp = getFormattedTimestamp(getLocalTime(new Date(request.timestamp)));
			$('#response_saved').html('Saved '+timestamp);
		}
	}
});

/**
 * Generate HTML for the task selector for the extension pop-up.
 * @returns {String}
 */
function getTaskSelector() {
	var html = '<select id="task_chooser">';	
	for (var i=0; i<g_studentInfo.lesson.tasks.length; i++) {
		html += '<option value="'+i+'">'+(i+1)+'. '+g_studentInfo.lesson.tasks[i][0]+'</option>';
	}
	html += '</select>';
	return html;
}

/**
 * Callback function called when the selection in the drop-down menu in the   
 * extension pop-up changes.
 */
function onTaskChanged() {
	// SP server not notified about task change so SP UI and 
	// extension can work on different tasks if they choose
	storeTask(getSelectedTaskIndex());
	loadStudent(false);
	chrome.extension.sendRequest({'type':'task', 'task':getSelectedTaskIndex()});
}

/**
 * Get the index of the selected item in the task drop-down menu. 
 * @returns
 */
function getSelectedTaskIndex() {
	return $('#task_chooser').prop('selectedIndex');
}

/**
 * Generate HTML for the page rating UI for the extension pop-up. 
 * @returns {String}
 */
function getRatingSelector() {
	var html = '<input type="radio" id="helpful" name="rating" value="1"> Helpful</input> ';
	html += '<input type="radio" id="unhelpful" name="rating" value="0"> Unhelpful</input>';
	return html;
}

function onRatingChanged() {
	var rating = $('input:radio[name=rating]:checked').val();
	chrome.extension.sendRequest({'type':'rating', 'rating':rating});
}

function updateLinkRating(url) {
	var history = g_studentInfo.history;
	for (var i=history.length-1; i>=0; i--) {
		var taskItem = history[i];
                var taskType = taskItem.activity_type;
		if (taskItem.link == url && taskType == "link_rating") {
			if (taskItem.is_helpful) {
				$('#helpful').attr('checked', 'checked');
			}
			else {
				$('#unhelpful').attr('checked', 'checked');
			}
			break;
		}
	}
}

function getResponseControls() {
	var html = '<input type="text" id="response" name="response" value="" style="width:300px"><br/>';
	html += 'Note<br/>';
	html += '<textarea rows="2" name="explanation" id="explanation" style="width:300px"></textarea><br/>';
	html += '<button id="submit_response" name="submit_response">Save</button> ';
	html += '<span id="response_saved" class="note"></span>';
	return html;
}

function getMostRecentResponse() {
	var response = {'response':'', 'explanation':'', 'timestamp':''};
	var history = g_studentInfo.history;
	for (var i=history.length-1; i>=0; i--) {
		var taskItem = history[i];
                var taskType = taskItem.activity_type;
		if (taskType == "answer") {
			var timestamp = getFormattedTimestamp(getLocalTime(new Date(taskItem.timestamp)));
			response = {'response':taskItem.answer_text, 'explanation':taskItem.answer_explanation, 'timestamp':timestamp};
			break;
		}
	}
	return response;
}

function updateResponse() {
	var response = getMostRecentResponse();
	$('#response').val(response.response);
	$('#explanation').val(response.explanation);
	if (response.timestamp!='') $('#response_saved').html('Saved '+response.timestamp);
}

function onUnsavedResponse() {
	var msg = 'Unsaved changes';
	var response = $('#response').val();
	if (response=='') msg += ' - response must not be empty';
	$('#response_saved').html(msg);
}

function onResponseChanged() {
	var response = $('#response').val();
	if (response != '') {
		var explanation = $('#explanation').val();
		chrome.extension.sendRequest({'type':'response', 'response':response, 'explanation':explanation});
	}
	else {
		onUnsavedResponse();
	}
}

function onLogin() {
	updateSearchPartyTab(SEARCH_PARTY_URL+'/student_login?ext=1');
}

function onShowWebInterface() {
	var taskIdx = getSelectedTaskIndex();
	updateSearchPartyTab(SEARCH_PARTY_URL+'/student?task='+(taskIdx+1));
}

function onLogout() {
	chrome.extension.sendRequest({'type':'logout'});
	window.close();
}

function getHistoryHtml() {
	var html = '';

	var history = g_studentInfo.history;
	if (history.length==0) {
		html = '(none)';
	}

	//for (var i=0; i<history.length; i++) {
	for (var i=history.length-1; i>=0; i--) {
		var taskItem = history[i];
                var taskType = taskItem.activity_type;
                if (taskType=='link_rating') {
                        if (taskItem.is_helpful) taskType='link_helpful';
                        else taskType='link_unhelpful';
                }

		var timestamp = getFormattedTimestamp(getLocalTime(new Date(taskItem.timestamp)));
                var type = '';
                var details = '';
                if (taskType=='search') {
                        type = 'Query';
			var searchType = getGoogleSearchType(taskItem.link);
			if (searchType != 'normal') {
				type += '<br/><span class="note">('+searchType+')</span>';
			}
                        details = taskItem.search;
               	        if (taskItem.link) details = '<a href="'+taskItem.link+'" target="_blank">'+taskItem.search+'</a>';
                }
                else if (taskType=='link') {
                        type = "Visited Link";
			if (taskItem.search == EMPTY_SEARCH) {
				type += '<br/><span class="note">(direct)</span>';
			}
			details = '';
			if (taskItem.link_title!=taskItem.link) {
                        	details = taskItem.link_title+'<br/>';
			}
               	        details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
                }
                else if (taskType=='link_helpful') {
		    // page title not stored in rating action
                    type = "Rated Helpful";
                    details = '';
		    if (taskItem.link_title!=null && taskItem.link_title!=taskItem.link) {
                       	details = taskItem.link_title+'<br/>';
		    }
                    details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
                }
                else if (taskType=='link_unhelpful') {
		    // page title not stored in rating action
                    type = "Rated Unhelpful";
                    details = '';
		    if (taskItem.link_title!=null && taskItem.link_title!=taskItem.link) {
                       	details = taskItem.link_title+'<br/>';
		    }
                    details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
                }
                else if (taskType=='answer') {
                    type = "Response";
                    details = taskItem.answer_text;
                    if (taskItem.answer_explanation) details += '<br/><em>'+taskItem.answer_explanation+'</em>';
                }

		html += '<p class="historyitem">';
		html += '<span class="itemtype">'+type+'</span>';
		html += '<span class="itemdetail">'+details+'</span>';
		html += '<span class="itemtime">'+timestamp+'</span>';
		html += '</p>';
        }
	return html;
}

function getQueryHistoryHtml() {
	var html = '';

	alert(g_studentInfo.tasks[0]);
	
//	var history = g_studentInfo.tasks[0];
//	
//	if (history.length==0) {
//		html = '(none)';
//	}
//	
//	//g_students[student_nickname].tasks[task_idx].searches.push({"query":query, "links_followed":[]});
//
//	//for (var i=0; i<history.length; i++) {
//	for (var i=history.length-1; i>=0; i--) {
//		var taskItem = history[i];
//                var taskType = taskItem.activity_type;
//                if (taskType=='link_rating') {
//                        if (taskItem.is_helpful) taskType='link_helpful';
//                        else taskType='link_unhelpful';
//                }
//
//		var timestamp = getFormattedTimestamp(getLocalTime(new Date(taskItem.timestamp)));
//                var type = '';
//                var details = '';
//                if (taskType=='search') {
//                        type = 'Query';
//			var searchType = getGoogleSearchType(taskItem.link);
//			if (searchType != 'normal') {
//				type += '<br/><span class="note">('+searchType+')</span>';
//			}
//                        details = taskItem.search;
//               	        if (taskItem.link) details = '<a href="'+taskItem.link+'" target="_blank">'+taskItem.search+'</a>';
//                }
//                else if (taskType=='link') {
//                        type = "Visited Link";
//			if (taskItem.search == EMPTY_SEARCH) {
//				type += '<br/><span class="note">(direct)</span>';
//			}
//			details = '';
//			if (taskItem.link_title!=taskItem.link) {
//                        	details = taskItem.link_title+'<br/>';
//			}
//               	        details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
//                }
//                else if (taskType=='link_helpful') {
//		    // page title not stored in rating action
//                    type = "Rated Helpful";
//                    details = '';
//		    if (taskItem.link_title!=null && taskItem.link_title!=taskItem.link) {
//                       	details = taskItem.link_title+'<br/>';
//		    }
//                    details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
//                }
//                else if (taskType=='link_unhelpful') {
//		    // page title not stored in rating action
//                    type = "Rated Unhelpful";
//                    details = '';
//		    if (taskItem.link_title!=null && taskItem.link_title!=taskItem.link) {
//                       	details = taskItem.link_title+'<br/>';
//		    }
//                    details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
//                }
//                else if (taskType=='answer') {
//                    type = "Response";
//                    details = taskItem.answer_text;
//                    if (taskItem.answer_explanation) details += '<br/><em>'+taskItem.answer_explanation+'</em>';
//                }
//
//		html += '<p class="historyitem">';
//		html += '<span class="itemtype">'+type+'</span>';
//		html += '<span class="itemdetail">'+details+'</span>';
//		html += '<span class="itemtime">'+timestamp+'</span>';
//		html += '</p>';
//        }
//	return html;
}

function getGoogleSearchType(url) {
	var type = 'normal';
	if (url) {
		var param = getUrlParameter(url, 'tbm')
		if (param == 'isch') {
			type = 'image';
		}
		else if (param == 'vid') {
			type = 'video';
		}
		else if (param == 'nws') {
			type = 'news';
		}
		else if (param == 'shop') {
			type = 'shopping';
		}
		else if (param == 'plcs') {
			type = 'places';
		}
	}
	return type;
}

function updateSearchPartyTab(url) {
	chrome.tabs.query({}, function(tabs) {
		var spTabId = -1;
		for (i in tabs) {
			var tab = tabs[i];
			if (tab.url.indexOf(SEARCH_PARTY_URL) != -1) {
				spTabId = tab.id;
				break;
			}
		}

		if (spTabId != -1) {
			chrome.tabs.update(spTabId, {'url':url, 'active':true}, null);
		}
		else {
			chrome.tabs.create({'url':url}, null);
		}
	});
}

function getLocalTime(gmt)  {
    var min = gmt.getTime() / 1000 / 60; // convert gmt date to minutes
    var localNow = new Date().getTimezoneOffset(); // get the timezone offset in minutes
    var localTime = min - localNow; // get the local time
    return new Date(localTime * 1000 * 60); // convert it into a date
}

function getFormattedTimestamp(ts) {
    var month = ''+(ts.getMonth()+1);
    if (month.length==1) month = '0' + month;
    var day = ''+ts.getDate();
    if (day.length == 1) day = '0' + day;
    var date =  month + '/' + day + '/'+ (ts.getFullYear()+'').substr(2);
    var hours = ''+ts.getHours();
    var mins = ''+ts.getMinutes();
    if (mins.length == 1) mins = '0' + mins;
    var time = hours + ':' + mins;
    return date + '&nbsp;' + time;
}

