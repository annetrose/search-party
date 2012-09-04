// SearchParty - Learning to Search in a Web-Based Classroom
// Authors: Ben Bederson - www.cs.umd.edu/~bederson
//          Alex Quinn - www.cs.umd.edu/~aq
//          Anne Rose - www.cs.umd.edu/hcil/members/~arose
//          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
// Date: Originally created June 2012
// License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

// TODO: Handle back/forward button navigation (currently back/forward actions are recorded same as normal actions)
// TODO: Need to design to avoid quota limits (datastore read operations)
// TODO: Consider how to best modify Teacher View to support extension behavior. For instance, a student can visit a link directly (i.e., type in a url) in the extension.  Also rating a link may not be immediately preceeded by visiting the link when searching w/ the extension.
// TODO: Need visual indication of link rating (w/o showing popup)
// TODO: Add functionality to sort history order
// TODO: Allow link rating before page is fully loaded
// TODO: Show query associated with link in popup
// TODO: Show rating icon next to links in history instead of separate event?

// NOTE: The extension currently continues to record actions until student explicitly logs out
// NOTE: Some visited links generate multiple followed links (e.g., mydlink.com, facebook); links ignored if page reloaded (same url) or only difference is http vs https
// NOTE: A link followed is not sent to Search Party until a page is completely loaded because the page title is not available until then.  Pages that are navigated away from before they are fully loaded will not be recorded. Even chrome.tabs.onUpdated doesn't always have current title.  Add time delay as hack to increase odd of getting page title.
// NOTE: Students can browse directly to a page using the extension (i.e., no prior search needed).  Currently these direct links are associated with an '<empty>' query.  Need to consider how SP web interface should handle direct links.
// NOTE: The badge icon indicating whether or not a student is logged in (and actions are being recorded) is updated whenever it tries to record a student action, the extension popup is shown, the extension is loaded or the student goes to /student or / on the Search Party web interface.
// NOTE: Some followed links are more like direct links (e.g., clicking Gmail in search results) but there is no way to distinquish them currently.
// NOTE: If tabs are already open when a user starts working a task and they rate an already open link, a "direct" query is sent to SP in addition to the rating (because the SP interface currently assumes rated links have been followed previously).
// NOTE: Sites like agoogleaday.com that embed Google search and any followed links are not recorded correctly.

// TEST: chrome.tabs.Tab.openerTabId used to set query (if any) for links opened in a new tab.  Not sure what implications this might have for other pages.

// BUG: Google searches sometimes recorded twice.  Sometimes urls are same except for hash.

var g_tabs = [];
var g_last_deleted_tab = null;
var g_initWhenLogin = true;

var g_complete_histories = [];
var g_studentInfo = null;
var g_students = null;
//var TOKEN = null;

$(document).ready(function() {
	initLocalStorage();
	
	// Get student info
	$.ajax({
		type : 'POST',
		url : SEARCH_PARTY_URL + "/student_info",
		dataType : "json",
		cache : false,
		success : function(data) {
			g_studentInfo = data;
			updateState();
			updateBadge(data.status);
			if (isStudentLoggedIn()) {
				initTabs();
				getChannelToken();
				initHistoryData();
			}
		},
		error : function() {
			updateBadge(STUDENT_LOGGED_OUT); 
		}
	});
	
	// Get student token
//	$.get(SEARCH_PARTY_URL + "/student_token", function(data) {
//		parsed_data = JSON.parse(data);
//		TOKEN = parsed_data.token;
//		openChannel();
//	});
	
	var heartbeatInterval = setInterval(heartbeat, 2000);
});

function heartbeat() {
	verifyChannelToken();
	updateState();
}

//openChannel();

function getChannelToken() {
	$.get(SEARCH_PARTY_URL + "/student_token", function(data) {
		parsed_data = JSON.parse(data);
		TOKEN = parsed_data.token;
		openChannel();
	});
}

function verifyChannelToken() {
//	alert("verifyChannelToken");
//	alert("TOKEN = " + TOKEN);
	if(TOKEN != undefined) {
		getChannelToken();
	}
}

/**
 * Updates state and sends updated state data content scripts.  Updates state 
 * by requesting updated state from remote server using HTTP requests. 
 */
function refreshState() {
	
//	alert("g_students.status = " + g_students.status);
	// Update g_studentInfo
	$.ajax({
		type : 'POST',
		url : SEARCH_PARTY_URL + "/student_info",
		dataType : "json",
		cache : false,
		success : function(data) {
			g_studentInfo = data;
			updateState(); // Propogate state data to extension content scripts
			updateBadge(data.status);
//			if (isStudentLoggedIn()) {
//				initTabs();
//			}
		},
		error : function() {
			updateBadge(STUDENT_LOGGED_OUT);
		}
	});	
}

/**
 * Sends CURRENT state data to content scripts.  A better name for this 
 * function might be "updateStateOfContentScripts".
 */
function updateState() {
//	alert("calling update state");
	// Send message to content script to update timestamp of last save
	chrome.tabs.getSelected(null, function(tab) {

		var taskIndex = getStoredTask();
		if (g_studentInfo && g_studentInfo.lesson) {
			var taskDescription = g_studentInfo.lesson.tasks[taskIndex][1]; // TODO: Get stored description
		}
		var mostRecentResponse = getMostRecentResponse();
		
//		alert("g_studentInfo.status = " + g_studentInfo.status);
		
		// Create message on port
		var port = chrome.tabs.connect(tab.id, {
			name: "spTopUi"
		});
		port.postMessage({
			type: 'updateState',
			state: {
				g_studentInfo: g_studentInfo,
				g_task: {
					index: taskIndex,
					description: taskDescription,
					response: mostRecentResponse
				}, 
				g_students: g_students
			}
		});
	});
}

/**
 * onConnect event is fired when a connection is made from an extension process or content script
 */
chrome.extension.onConnect.addListener(function(port) {
	console.assert(port.name == "spTopUi");
	//alert(port.name);
	
//	console.log("message " + message.type + " received by background.js");
//	chrome.extension.getBackgroundPage().console.log("message " + message.type + " received by background.js");
//	alert("message " + message.type + " received by background.js");

	port.onMessage.addListener(function(message) {

		if (message.type == 'request') {
			// TODO: Update 'request' to 'dataRequest' or 'stateSyncRequest'
			
			if (message.request.type == 'rating') {
				
				handleRatingPlus(message.request.rating);
				
			} else if (message.request.type == 'response') {
				
				// chrome.extension.sendRequest(message.request); // This doesn't seem to work.  Why not?  Can this script not send requests to its own handler?
				handleResponse(message.request.response, message.request.explanation);
				
			}
			
		} else if (message.type == 'functionRequest') {
			
//			console.log("message " + message.type + " received by background.js");ssage.type + ": " + message.functionSignature + " received by background.js");
			
			if (message.functionSignature == 'getStoredLink') {
				var result = getStoredLink();
				
				// Send message to content script to update timestamp of last save
				chrome.tabs.getSelected(null, function(tab) {

					// Create message on port
					var responsePort = chrome.tabs.connect(tab.id, {
						name: "spTopUi"
					});
					responsePort.postMessage({
						type: 'functionResponse',
						functionSignature: 'getStoredLink',
						functionArguments: {},
						result: result,
						stateData: {
							g_studentInfo: g_studentInfo
						}
					});
				});
				
			} else if (message.functionSignature == 'updateState') {
				
				updateState();
				
			} else if (message.functionSignature == 'verifyChannelToken') {
				
				verifyChannelToken();
				
			}
			
		} else if (message.type == 'updateState') {
			
			if (message.state && message.state.g_students) {
				g_students = message.state.g_students;
			}
			
		} else {
			// Send a message of type error specifying that its cause was that the received message type was undefined.
			return { type: 'error', cause: 'undefined' };
		}
	});
});

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

function updateResponse() {
	var response = getMostRecentResponse();
	$('#response').val(response.response);
	$('#explanation').val(response.explanation);
	if (response.timestamp!='') $('#response_saved').html('Saved '+response.timestamp);
}

function initTabs() {
	g_tabs = [];
	g_last_deleted_tab = null;
	chrome.tabs.query({}, function(tabs) {
		for (i in tabs) {
			var tab = tabs[i];
			var isSearch = isSearchAction(tab.url);
			var isLink = !isSearch && isLinkAction(tab.url);

			if (isSearch || isLink) {
				var query = null;
				if (isSearch) {
					query = getSearchQuery(tab.url);
				}
				if (query == null) {
					query = EMPTY_SEARCH;
				}
				g_tabs[tab.id] = {'query':query, 'url':tab.url, 'init':true, 'pending_action':null};
		
				if (tab.selected) {
					storeTab(tab.id);
					storeLink('');
					if (isLink) {
						storeLink(tab.url);
						storeLinkTitle(tab.title);
					}
				}
			}
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

function initHistoryData() {
	for (var taskIdx=0; taskIdx<g_lessons[0].tasks.length; taskIdx++) {
		g_complete_histories[taskIdx] = [];
		for (var studentNickname in g_students) {
			var student = g_students[studentNickname];
			for (var i=0; i<student.task_history[taskIdx].length; i++) {
				var task = student.task_history[taskIdx][i];
				task.student_nickname = studentNickname;
				g_complete_histories[taskIdx].push(task);
			}
		}
		
		g_complete_histories[taskIdx].sort(function(x, y) {
			return new Date(x.timestamp) - new Date(y.timestamp);
		});		
	}
}

function getMostRecentResponse() {
	var response = { 
		'response': '',
		'explanation': '',
		'timestamp': ''
	};
//	alert(g_studentInfo);
	if (g_studentInfo && g_studentInfo.history) {
		var history = g_studentInfo.history;
		for (var i = history.length - 1; i >= 0; i--) {
			var taskItem = history[i];
			var taskType = taskItem.activity_type;
			if (taskType == "answer") {
				var timestamp = getFormattedTimestamp(getLocalTime(new Date(taskItem.timestamp)));
				response = {
					'response': taskItem.answer_text, 
					'explanation': taskItem.answer_explanation, 
					'timestamp': timestamp
				};
				break;
			}
	}
	}
	return response;
}

/**
 * Set up event listener to handle requests (sent using 
 * chrome.extension.sendRequest()).
 */
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.type=='login') {
		handleLogin();
	}
	else if (request.type=='task') {
		handleTaskChange();
	}
	else if (request.type=='rating') {
		handleRatingPlus(request.rating);
	}
	else if (request.type=='response') {
		handleResponse(request.response, request.explanation);
	}
	else if (request.type=='logout') {
		handleLogout();
	}
});

// search: fia umd (in google toolbar)
// follow: www.fia.umd.edu
// => chrome.tabs.onActivated,chrome.history.onVisited raised but not chrome.tabs.onUpdated
// Bug Report: http://code.google.com/p/chromium/issues/detail?can=2&q=109557&colspec=ID%20Pri%20Mstone%20ReleaseBlock%20OS%20Area%20Feature%20Status%20Owner%20Summary&id=109557

chrome.tabs.onActivated.addListener(function(info) {
	// tab.url may not be set yet according to documentation
	// but only onActivated called when use simply switches between tabs (no reload)
	if (isStudentLoggedIn()) {
		chrome.tabs.get(info.tabId, function(tab) {
			//debug('ACTIVATED => '+tab.url+','+tab.title);
			if (tab.url.indexOf('chrome-devtools://') == -1) {
				storeTab(info.tabId);
				if (isLinkAction(tab.url)) {
					storeLink(tab.url);
					storeLinkTitle(tab.title);
				}
				else {
					storeLink('');
				}
			}
		});
	}
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
	// tab title suppposed to be set when info.status is complete but not always the case
	// first url loaded in tab seems to give correct title, but secondary urls do not always
	// added timeout based on suggestion in bug issue below
	// http://code.google.com/p/chromium/issues/detail?id=96716
	if (isStudentLoggedIn() && info.status=='complete') {
		//debug('UPDATED => '+tab.url+','+info.status);
		window.setTimeout (
			function() {
				chrome.tabs.get(tabId, function(tab2) {
					if (tab2.url.indexOf('chrome-devtools://') == -1) {
						if (g_tabs[tabId]!=undefined && g_tabs[tabId].pending_action!=null) {
							if (g_tabs[tabId].pending_action == 'record_link') {
								g_tabs[tabId].url = tab2.url;
								g_tabs[tabId].pending_action = null;
								recordLink(g_tabs[tabId].query, g_tabs[tabId].url, tab2.title);

								if (getStoredTab() == tabId) {
									storeLink(g_tabs[tabId].url);
								}
							}
						}
					}
				});
			},
			1000
		);
	}
});

chrome.tabs.onRemoved.addListener(function(tabId) {
	if (isStudentLoggedIn()) {
		g_last_deleted_tab = g_tabs[tabId];
		if (g_last_deleted_tab != undefined) {
			g_last_deleted_tab.id = tabId;
			delete g_tabs[tabId];
		}
	}
});

/**
 * "Fired when a URL is visited, providing the HistoryItem data for that URL. 
 * This event fires before the page has loaded." 
 * (Source: http://code.google.com/chrome/extensions/history.html#event-onVisited)
 */
chrome.history.onVisited.addListener(function(historyItem) {
	if (isStudentLoggedIn()) {
		chrome.windows.getCurrent({populate: true}, function(window) {
			var tab = getActiveTab(window);
			var tabId = tab.id;
			storeTab(tabId);
			var url = historyItem.url;
			chrome.history.getVisits({'url':url}, function(visitItems) {
				var transitionType = visitItems[visitItems.length-1].transition;
		
				debug('-------------');
				debug('URL => '+url);

				// check if student on Search Party web interface
				// if so, inject js to notify popup about logout state
				if (url == SEARCH_PARTY_URL+'/student_logout') {
					chrome.tabs.executeScript(null, {file: "logout.js"});
				}
			
				if (g_tabs[tabId] != undefined) {
					// check if same url as previous and if so, skip
					if (g_tabs[tabId].url==url) {
						debug('SKIP URL => same url');
						return;
					}

					// check if only diff in url is http:// vs. https:// and if so, skip
					var url1 = g_tabs[tabId].url.replace('http://').replace('https://');
					var url2 = url.replace('http://').replace('https://');
					if (url1==url2) {
						debug('SKIP URL => http vs https');
						return;
					}	
				}

				// check if tab info initialized already
				if (!(tabId in g_tabs)) {
					if (g_last_deleted_tab != null) {
						g_tabs[tabId] = g_last_deleted_tab;
						g_last_deleted_tab = null;
					}
					else {
						g_tabs[tabId] = { 'query':EMPTY_SEARCH, 'url':'', 'init':false, 'pending_action':null };
					}
				}	


				var isSearch = isSearchAction(url);
				var isLink = !isSearch && isLinkAction(url);	

				if (isSearch) {
					query = getSearchQuery(url);
					if (query != null) {

						// some queries generate multiple urls sometimes
						// for example, /webhp and /search both served for same query sometimes
						// check if previous url was a search, and for same query and type, and if so, skip
						if (g_tabs[tabId] != undefined) {

							var prevUrl = g_tabs[tabId].url;
							if (isSearchAction(prevUrl)) {
								var prevQuery = g_tabs[tabId].query;
								var prevType = getUrlParameter(prevUrl, 'tbm');
								if (prevType==null) prevType='';
								var type = getUrlParameter(url, 'tbm');
								if (type==null) type='';
								if (query==prevQuery && type==prevType) {
									debug('SKIP SEARCH => '+query+','+url);
									return;
								}
							}
						}

						g_tabs[tabId] = {'query':query, 'url':url, 'init':false, 'pending_action':null };
						debug('RECORD SEARCH => '+query+','+url);
						handleSearch(query, url);
					}
				}
				else if (isLink) {
					// check if opened by existing tab
					// if so, set new tab to parent query (if any)
					var parentTabId = tab.openerTabId;
					if (parentTabId != undefined && g_tabs[parentTabId] != undefined && g_tabs[tabId].query==EMPTY_SEARCH) {
						g_tabs[tabId].query = g_tabs[parentTabId].query;
					}

					// check if user visited link directly (e.g., typed in, used bookmark)
					var isLinkVisitDirect = transitionType=='typed' || transitionType=='auto_bookmark';
					if (isLinkVisitDirect) {
						g_tabs[tabId].query = EMPTY_SEARCH;
					}
					g_tabs[tabId].url = url;
					g_tabs[tabId].init = false;

					if (getStoredTab()==tabId && getStoredLinkTitle()!='') {
						recordLink(g_tabs[tabId].query, g_tabs[tabId].url, getStoredLinkTitle());
						storeLinkTitle('');
					}
					else {
						// tab.title is not always correct: may not be set yet or may be title of previous page
						// wait for chrome.tabs.onUpdated to get title and record link
						// not made available for rating until recorded
						debug('TRIGGER RECORD LINK => '+url);
						g_tabs[tabId].pending_action = 'record_link';
						storeLink('');
					}
				}
			});
		});
	}
	else {
		chrome.windows.getCurrent({populate: true}, function(window) {
			var url = historyItem.url;
			chrome.history.getVisits({'url':url}, function(visitItems) {
				// check if student on Search Party web interface
				// may have logged in outside of extension
				// if so, inject js to notify popup about login state
				if (url == SEARCH_PARTY_URL+'/student' || url == SEARCH_PARTY_URL+'/html/student_ext.html') {	
					chrome.tabs.executeScript(null, {file: "login.js"});
				}
			});
		});
	}
});


function recordLink(query, url, title) {
	// check if title is really just url
	var str1 = url.replace('http://').replace('https://');
	var str2 = title.replace('http://').replace('https://');
	if (str1 == str2) {
		title = url;
	}

	// shorten title if too long
	if (title!=undefined && title.length>200) {
		title = title.substring(0,100);
	}

	debug('RECORD LINK => '+query+','+url+','+title);
	handleLink(query, url, title);
}

function handleLogin() {
	if (g_initWhenLogin) {
		initLocalStorage();
		initTabs();
		g_initWhenLogin = false;
		if(g_students != undefined && g_students.status != undefined) {
			g_students.status = 1;
		}
		refreshState();
		verifyChannelToken();
	}
	updateBadge(STUDENT_LOGGED_IN);
}

function handleLogout() {
	$.get(SEARCH_PARTY_URL+"/student_logout?ext=1", function(data) {
		updateBadge(STUDENT_LOGGED_OUT);
		g_initWhenLogin = true;
		if(g_students != undefined && g_students.status != undefined) {
			g_students.status = 0;
		}
		refreshState();
		verifyChannelToken();
	});
}

function handleTaskChange() {
	//alert("handleTaskChange()");
	initTabs();
	updateBadge(TASK_CHANGED);
	
	// Send message to content script requesting an update to the
	// in-browser SearchParty UI
	chrome.tabs.getSelected(null, function(tab) {
		
		// Create message on port
		var port = chrome.tabs.connect(tab.id, {
			name : "spTopUi"
		});

		//alert("0");
		var taskIndex = getSelectedTaskIndex();
//		alert("1");
		var taskDesc = getStoredTask();
//		alert("2");
		var mostRecentResponse = getMostRecentResponse();
//		alert("mostRecentResponse = " + mostRecentResponse.response);
		port.postMessage({
			type: 'update_top_ui',
			task_index : taskIndex,
			task_description : taskDesc,
			response: mostRecentResponse
		});

	});
}

function handleSearch(query, url) {
	if (query!=null) {
        	$.ajax({
               		type: 'POST',
               		url: SEARCH_PARTY_URL+"/search_executed",
                	dataType: "json",
                	data: {
				task_idx: getStoredTask(),
                        	query : query,
                        	url : url,
				ext : 1
                	},
                	cache: false,
                	success: function(data) {
				updateBadge(data.status);
                	},
			error: function(data) {
				updateBadge(STUDENT_LOGGED_OUT);
			}
        	});
	}
}

function handleLink(query, url, title) {
	$.ajax({
                type: 'POST',
                url: SEARCH_PARTY_URL+"/link_followed",
                dataType: "json",
                data: {
			task_idx: getStoredTask(),
                        query : query,
                        url : url,
                        title : title,
			ext : 1
                },
                cache: false,
                success: function(data) {
			updateBadge(data.status);
                },
		error: function(data) {
			updateBadge(STUDENT_LOGGED_OUT);
		}
        });
}

function handleRatingPlus(isHelpful) {
//	console.log("handleRatingPlus() called");
	// check if user is rating an initial tab (i.e., user did not explictly navigate to url 
	// when they logged in/switched task), and if so, send followed link action in addition to rating link action
	var tabId = getStoredTab();
	if (g_tabs[tabId] != undefined && g_tabs[tabId].init) {
		chrome.tabs.get(tabId, function(tab) {
			$.ajax({
		                type: 'POST',
		                url: SEARCH_PARTY_URL+"/link_followed",
		                dataType: "json",
		                data: {
					task_idx: getStoredTask(),
		                        query : EMPTY_SEARCH,
		                        url : getStoredLink(),
		                        title : tab.title,
					ext : 1
		                },
		                cache: false,
		                success: function(data) {
					if (data.status == STUDENT_LOGGED_IN) {
						g_tabs[tabId].init = false;
						data['type'] = 'rating';
		        			chrome.extension.sendRequest(data);
						handleRating(isHelpful);
					}
		                },
				error: function(data) {
					updateBadge(STUDENT_LOGGED_OUT);
				}
	       	 	});
		});
	}
	else {
		handleRating(isHelpful);
	}

}

function handleRating(isHelpful) {
//	console.log("handleRating() called");
	var data = {
		task_idx: getStoredTask(),
		url : getStoredLink(),
                ext : 1
	};
	
	if (getStoredLinkTitle() != '') {
		data.title = getStoredLinkTitle();
	}
	if (isHelpful != '') {
		data.is_helpful = isHelpful;
	}

	$.ajax({
		type : 'POST',
		url : SEARCH_PARTY_URL + "/link_rated",
		dataType : "json",
		data : data,
		cache : false,
		success : function(data) {
//			console.log("handleRating() HTTP response received");
			updateBadge(data.status);
			if (data.status == STUDENT_LOGGED_IN) {
				data['type'] = 'rating';
				chrome.extension.sendRequest(data);
			}
		},
		error : function(data) {
			updateBadge(STUDENT_LOGGED_OUT);
		}
	});
}

function isGoogleSearchSkipPage(url) {
	var onTextSearch = url.indexOf('www.google.com') != -1;
	var onImageSearch = url.indexOf('images.google.com') != -1;

	// Two very similar urls generated sometimes for text searches; 
	// url params in diff order, fp param has diff value, and url 2 has cad parameter
	// skip url with cad parameter
	// NOTE: Not sure what other urls might have a cad parameter that should *not* be skipped
	// 
	// Url 1: http://www.google.com/#hl=en&output=search&sclient=psy-ab&q=dog&oq=dog&gs_l=hp.3..0l4.1702.1830.0.1930.3.3.0.0.0.0.87.136.2.2.0...0.0...1c.eKs3hRkQdeQ&pbx=1&bav=on.2,or.r_gc.r_pw.r_qf.,cf.osb&fp=baac52dbdda8cd89&biw=1110&bih=1203
	// Url 2: http://www.google.com/#hl=en&output=search&sclient=psy-ab&q=dog&oq=dog&gs_l=hp.3..0l4.1702.1830.0.1930.3.3.0.0.0.0.87.136.2.2.0...0.0...1c.eKs3hRkQdeQ&pbx=1&fp=1&biw=1110&bih=1203&bav=on.2,or.r_gc.r_pw.r_qf.,cf.osb&cad=b 

	// /webhp - used by Google Instant

	return (onTextSearch && getUrlParameter(url, 'cad') != null) ||
        	(onTextSearch && url.indexOf('/url') != -1) ||
		((onTextSearch || onImageSearch) && url.indexOf('/imgres') != -1);
}

function isGoogleSearch(url) {
	if (url == undefined) {
		return false;
	}

	var onSkipPage = isGoogleSearchSkipPage(url);
	var onTextSearch = url.indexOf('www.google.com') != -1;
	var onImageSearch = url.indexOf('images.google.com') != -1;
	var onNewsSearch = url.indexOf('news.google.com') != -1;
        return !onSkipPage && (onTextSearch || onImageSearch || onNewsSearch);
}

function isSearchAction(url) {
	if (url == undefined || url == '') {
		return false;
	}

	return isGoogleSearch(url);
}

function getSearchQuery(url) {
	return getUrlParameter(url, 'q');
}

function isLinkAction(url) {
	if (url == undefined || url == '') {
		return false;
	}

	var onTextSearch = url.indexOf('www.google.com') != -1;
	var onImageSearch = url.indexOf('images.google.com') != -1;

	var onSkipPage = 
		(onTextSearch && getUrlParameter(url, 'cad') != null) ||
		(onTextSearch && url.indexOf('/search') != -1) ||
        	(onTextSearch && url.indexOf('/url') != -1) ||
		(onTextSearch && url.indexOf('/webhp') != -1);

	var onGoogleSearch = isGoogleSearch(url);
        var onSearchParty = url.indexOf(SEARCH_PARTY_URL) != -1;
        var onChromePage = url.substring(0,6) == 'chrome';
        return !onGoogleSearch && !onSearchParty && !onChromePage && !onSkipPage;
}

function handleResponse(response, explanation) {
//	console.log("handleResponse() called");
	var saveResponse = response != '';
	if (saveResponse) {
		$.ajax({
			type : 'POST',
			url : SEARCH_PARTY_URL + "/answer",
			dataType : "json",
			data : {
				task_idx : getStoredTask(),
				answer_text : response,
				answer_explanation : explanation,
				ext : 1
			},
			cache : false,
			success : function(data) {
				updateBadge(data.status);
				if (data.status == STUDENT_LOGGED_IN) {
					data['type'] = 'answer';
					chrome.extension.sendRequest(data);
					
					// Send message to content script to update timestamp of last save
					chrome.tabs.getSelected(null, function(tab) {
	
						// Create message on port
						var port = chrome.tabs.connect(tab.id, {
							name: "spTopUi"
						});
						port.postMessage({
							type: 'request',
							request: data
						});
					});
				}
			},
			error : function(data) {
				updateBadge(data.status);
			}
		});
	}
}

function getActiveTab(window) {
	var tab = null;
	for (var i=0; i<window.tabs.length; i++) {
		if (window.tabs[i].active) {
			tab = window.tabs[i];
			break;
		}
	}
	return tab;
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

function onSocketMessage(msg) {
	// Note:  Messages are limited to 32K.  This is not an issue now, but it
	// might come up in the future.
	//
	// http://code.google.com/appengine/docs/python/channel/overview.html
	window.status = msg.data;
	updates = JSON.parse(msg.data);
	var num_updates = updates.length;
	for(var i=0; i<num_updates; i++) {
		var update = updates[i];
		switch(update.type) {
			case "log_in":
				handle_update_log_in(update.student_nickname, update.task_idx);
				break;
			case "log_out":
				handle_update_log_out(update.student_nickname);
				break;
			case "task":
				handle_update_task(update.student_nickname, update.task_idx);
				break;
			case "query":
				handle_update_query(update.student_nickname, update.task_idx, update.query, update.timestamp);
				break;
			case "link_followed":
				handle_update_link_followed(update.student_nickname, update.task_idx, update.query, update.url, update.title, update.timestamp);
				break;
			case "link_rated":
				handle_update_link_rated(update.student_nickname, update.task_idx, update.url, update.is_helpful, update.timestamp);
				break;
			case "answer":
				handle_update_answer(update.student_nickname, update.task_idx, update.text, update.explanation, update.timestamp);
				break;
			default:
				break;
		}
	}
}

function onSocketOpen() {
//	alert("socket opened");
}

function onSocketError(error) {
//	alert("socket error");
	if (error.code == 401) {
		$.post('/channel_expired/'+g_lessons[0].lesson_code, {}, updateChannelToken, 'json');
	}
}

function onSocketClose() {
//	alert("socket closed");
}

function updateChannelToken(data) {
	TOKEN = data['token'];
	openChannel();
}

//=================================================================================
// Task and Message Handlers
//=================================================================================

function handle_update_log_in(student_nickname, task_idx) {
	var student_info = g_students[student_nickname];
	if (student_info==undefined ) {
		student_info = {};
		student_info.logged_in = true;
		student_info.task_idx = task_idx;		
		student_info.task_history = [];
		student_info.tasks = [];
		var numTasks = numberOfTasks();
		for (var i=0; i<numTasks; i++) {
			student_info.task_history.push([]);
			student_info.tasks.push({"searches":[], answer:{text:"", explanation:""}});
		}
		g_students[student_nickname] = student_info;
	}
	else {
		student_info.logged_in = true;
		student_info.task_idx = task_idx;
	}
//	updateUI();
	updateState();
}

function handle_update_log_out(student_nickname) {
	if (g_students[student_nickname]!=undefined) {
		var student_info = g_students[student_nickname];
		student_info.logged_in = false;
		student_info.task_idx = null;
//		updateUI();
		updateState();
	}
}

function handle_update_task(student_nickname, task_idx) {
	if (g_students[student_nickname]!=undefined) {
		g_students[student_nickname].task_idx = task_idx;
	}
}

function handle_update_query(student_nickname, task_idx, query, timestamp) {
//	alert("Channel received " + query + " for task " + task_idx);
	if (g_students[student_nickname] != undefined) {
		var task = { 
			activity_type: "search", 
			search: query, 
			link: null, 
			link_title: null, 
			is_helpful: null, 
			answer_text: null, 
			answer_explanation: null, 
			timestamp: timestamp
		};
		g_students[student_nickname].task_history[task_idx].push(task);
		g_students[student_nickname].tasks[task_idx].searches.push({ "query": query, "links_followed": [] });
		task.student_nickname = student_nickname;
//		g_complete_histories[task_idx].push(task);
		
//		if (task_idx == selectedTaskIdx()) {
//		    updateMinMaxTaskTimes(timestamp);
//			updateUIWithStudentActivity(student_nickname);
//		}

		updateState();
	}
}

function handle_update_link_followed(student_nickname, task_idx, query, url, title, timestamp) {
	if (g_students[student_nickname]!=undefined) {
		var task = {activity_type:"link", search:query, link:url, link_title:title, is_helpful:null, answer_text:null, answer_explanation:null, timestamp:timestamp};
		g_students[student_nickname].task_history[task_idx].push(task);		
		task.student_nickname = student_nickname;
		g_complete_histories[task_idx].push(task);
		
		var searches = g_students[student_nickname].tasks[task_idx].searches;
		var num_searches = searches.length;
		var search_info = null;
		for (var i=(num_searches-1); i>=0; i--) {
			var _search_info = searches[i];
			if(_search_info.query==query) {
				search_info = _search_info;
				break;
			}
		}
		if (search_info==null ) {
			search_info = {"query":query, "links_followed":[]};
			searches.push(search_info);
		}
		search_info.links_followed.push({"url":url, "title":title});
//		if (task_idx == selectedTaskIdx()) {
//		    updateMinMaxTaskTimes(timestamp);
//			updateUIWithStudentActivity(student_nickname);
//		}

		updateState();
	}
}

function handle_update_link_rated(student_nickname, task_idx, url, is_helpful, timestamp) {	
	if (g_students[student_nickname]!=undefined) {
		var task = {activity_type:"link_rating", search:null, link:url, link_title:null, is_helpful:is_helpful, answer_text:null, answer_explanation:null, timestamp:timestamp};
		g_students[student_nickname].task_history[task_idx].push(task);
		task.student_nickname = student_nickname;
		g_complete_histories[task_idx].push(task);
		
		var searches = g_students[student_nickname].tasks[task_idx].searches;
		var num_searches = searches.length;
		for (var i=0; i<num_searches; i++) {
			var search_info = searches[i];
			var links_followed = search_info.links_followed;
			var num_links = links_followed.length;
			for (var j=0; j<num_links; j++) {
				var link_info = links_followed[j];
				var link_url = link_info.url;
				if (link_url==url) {
					link_info.is_helpful = is_helpful;
				}
			}
		}
//		if (task_idx == selectedTaskIdx()) {
//		    updateMinMaxTaskTimes(timestamp);
//			updateUIWithStudentActivity(student_nickname);
//		}

		updateState();
	}
}

function handle_update_answer(student_nickname, task_idx, text, explanation, timestamp) {
	if (g_students[student_nickname]!=undefined) {
		var task = {activity_type:"answer", search:null, link:null, link_title:null, is_helpful:null, answer_text:text, answer_explanation:explanation, timestamp:timestamp};
		g_students[student_nickname].task_history[task_idx].push(task);
		task.student_nickname = student_nickname;
		g_complete_histories[task_idx].push(task);
		
		var answer_info = g_students[student_nickname].tasks[task_idx].answer;
		answer_info.text = text;
		answer_info.explanation = explanation;
//		if (task_idx == selectedTaskIdx()) {
//		    updateMinMaxTaskTimes(timestamp);
//			updateUIWithStudentActivity(student_nickname);
//		}

		updateState(); // MAKE SURE THIS UPDATES THE CACHED g_students AND UPDATES USING THAT ONE!  ONLY LOAD THE WHOLE CLOUD ONE TIME.
	}
}

function updateMinMaxTaskTimes(timestamp) {
	var localTime = getLocalTime(new Date(timestamp));
	if (!g_minTaskTime) {
		g_minTaskTime = localTime;
		g_maxTaskTime = localTime;
	}
	else if (localTime < g_minTaskTime) {
		g_minTaskTime = localTime;
	}
	else if (localTime > g_maxTaskTime) {
		g_maxTaskTime = localTime;
	}
}