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

var g_studentInfo = null;

$(document).ready(function() {
	initLocalStorage();
	
	// Get student info
	$.ajax({
		type : 'POST',
		url : SEARCH_PARTY_URL + "/student_info",
		dataType : "json",
		cache : false,
		success : function(data) {
			updateBadge(data.status);
			if (isStudentLoggedIn()) {
				initTabs();
			}
		},
		error : function() {
			updateBadge(STUDENT_LOGGED_OUT);
		}
	});
	
	// Initialize SP UI
	updateTopUi(true);
});

/**
 * onConnect event is fired when a connection is made from an extension process or content script
 */
chrome.extension.onConnect.addListener(function(port) {
	console.assert(port.name == "spTopUi");
	
	port.onMessage.addListener(function(msg) {
		
		
		
	});
});

function updateTopUi(init) {
	// $('#content').hide();
	// $('#loading').show();

	// TODO: Get cached copy of student and task data.
	if (isStudentLoggedIn()) {
		
//		if (g_studentInfo != null) {
//			// Create message on port
//			var taskIndex = getStoredTask();
//			var taskDesc = g_studentInfo.lesson.tasks[taskIndex][1]; // TODO: Get stored description
////			port.postMessage({
////				message_type: 'update_top_ui',
////				task_index: taskIndex,
////				task_description: taskDesc
////			});
//		} else {
		if (true) {
			$.ajax({
				type: 'POST',
				url: SEARCH_PARTY_URL + "/student_info",
				dataType: "json",
				data: {
					task_idx: getStoredTask()
				},
				cache: false,
				success: function(data) {
					g_studentInfo = data;
					if (data.status == STUDENT_LOGGED_IN) {
						var taskIndex = getStoredTask();
						var taskDesc = g_studentInfo.lesson.tasks[taskIndex][1];
		
						// Send message to content script requesting an update to the in-browser SearchParty UI
						chrome.tabs.getSelected(null, function(tab) {
		
							// Create message on port
							var port = chrome.tabs.connect(tab.id, {
								name: "spTopUi"
							});
							port.postMessage({
								message_type: 'update_top_ui',
								task_index: taskIndex,
								task_description: taskDesc
							});
						});
					}
					// $('#loading').hide();
					// $('#content').show();
				},
				error : function() {
					g_studentInfo = null;
					$('#content').html('Error connecting to ' + SEARCH_PARTY_URL);
					$('#loading').hide();
					$('#content').show();
				}
			});
		}
		
	} else {
	
		// Send message to remove top pane if it exists, otherwise display nothing, just the vanilla page.
		
		// Send message to content script requesting an update to the in-browser SearchParty UI
		chrome.tabs.getSelected(null, function(tab) {

			// Create message on port
			var port = chrome.tabs.connect(tab.id, {
				name: "spTopUi"
			});
			port.postMessage({
				message_type: 'update_top_ui',
				task_index: taskIndex,
				task_description: taskDesc
			});
		});
	
	}
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
		updateTopUi(true); // TODO: HACK - Move this somewhere where it makes more sense.
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

var g_loginIntervalId = null;
function handleLogin() {
	if (g_initWhenLogin) {
		initLocalStorage();
		initTabs();
		g_initWhenLogin = false;
		
		
		
		g_loginIntervalId = setInterval(function() {			
			
			if (!g_initWhenLogin) {
				
				// Send message to content script requesting an update to the in-browser SearchParty UI
				chrome.tabs.getSelected(null, function(tab) {
	
					// Create message on port
					var port = chrome.tabs.connect(tab.id, {
						name : "spTopUi"
					});
					port.postMessage({
						message_type: 'show_top_ui'
					});
					
					// Check if Search Party is visible.  If so, terminate this interval function.
					if (document.getElementById('searchPartyTopFrame') != 'none') {
						// Clear interval function.  This prevents future calls to the function.
						clearInterval(g_loginIntervalId);
					}
	
				});
			}
			
		}, 250);
		
		
		
	}
	updateBadge(STUDENT_LOGGED_IN);
}

function handleLogout() {
	$.get(SEARCH_PARTY_URL+"/student_logout?ext=1", function(data) {
		updateBadge(STUDENT_LOGGED_OUT);
		g_initWhenLogin = true;
		
		// Send message to content script requesting an update to the
		// in-browser SearchParty UI
		chrome.tabs.getSelected(null, function(tab) {

			// Create message on port
			var port = chrome.tabs.connect(tab.id, {
				name : "spTopUi"
			});
			port.postMessage({
				message_type: 'hide_top_ui'
			});

		});
	});
}

function handleTaskChange() {
	initTabs();
	updateBadge(TASK_CHANGED);

	// Send message to content script requesting an update to the
	// in-browser SearchParty UI
	chrome.tabs.getSelected(null, function(tab) {

		// Create message on port
		var port = chrome.tabs.connect(tab.id, {
			name : "spTopUi"
		});

		var taskIndex = getSelectedTaskIndex();
		var taskDesc = getStoredTask();
		port.postMessage({
			message_type: 'show_top_ui',
			task_index : taskIndex,
			task_description : taskDesc
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
                type: 'POST',
                url: SEARCH_PARTY_URL+"/link_rated",
                dataType: "json",
                data: data,
                cache: false,
                success: function(data) {
			updateBadge(data.status);
			if (data.status == STUDENT_LOGGED_IN) {
				data['type'] = 'rating';
		        	chrome.extension.sendRequest(data);
			}
                },
		error: function(data) {
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