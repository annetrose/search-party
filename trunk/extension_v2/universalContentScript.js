var g_top_ui_visible = false;

var g_task = null;
var g_task_index = 0;
var g_studentInfo = null;

MAX_TAG_LENGTH = 30;
var g_groupQueriesWithSameWords = false;
var g_itemList = null;
var g_students = null;

//clouds
var DEFAULT_CLOUD_SHOW_OPTION = 'link';
var g_cloudShowOption = DEFAULT_CLOUD_SHOW_OPTION;
var g_actionColors = { search:'#888888', link:'#454C45', link_helpful:'#739c95', link_unhelpful:'#5C091F', answer:'blue' };

// Open port from this content script to extension for message passing
var port = chrome.extension.connect({ name: "spTopUi" });

createSearchPartyInterface();
//hideSearchPartyTopUi();
//showSearchPartyTopUi();
//request_refreshState(); // TODO: Call refrest_refreshState() instead to guarantee fresh data on every page?
request_updateState();
request_verifyChannelToken();

function onResponseChanged() {
	//alert("onResponseChanged");
	
	var response = $('#searchPartyTopFrame').contents().find('#response').val();
	if (response != '') {
		var explanation = $('#searchPartyTopFrame').contents().find('#explanation').val();
		//chrome.extension.sendRequest({'type':'response', 'response':response, 'explanation':explanation});
		
		// Open port to send message (background.js receives and handles this message)
//		var port = chrome.extension.connect({ name: "spTopUi" });
		alert(response);
		alert(explanation);
//		var port = chrome.extension.connect({ name: "spTopUi" });
		port.postMessage({
			type: 'request',
			request: { 'type':'response', 'response': response, 'explanation': explanation }
		});
		
		//alert("Sent response");
	}
	else {
		onUnsavedResponse();
	}
}
function onUnsavedResponse() {
	var msg = 'Unsaved changes';
	var response = $('#response').val();
	if (response=='') msg += ' - response must not be empty';
	$('#response_saved').html(msg);
}

function onRatingChanged() {
	console.log("onRatingChanged() called");
	var rating = $('#searchPartyTopFrame').contents().find('input:radio[name=rating]:checked').val();
//	console.log("rating = " + rating);
	//chrome.extension.sendRequest({'type':'rating', 'rating':rating});
	
	// Open port to send message (background.js receives and handles this message)
//	var port = chrome.extension.connect({ name: "spTopUi" });
//	alert("port = " + port);
	port.postMessage({
		type: 'request',
		request: { 'type': 'rating', 'rating': rating }
	});
//	console.log("sent request");
}

function updateLinkRating(url) {
	console.log("updateLinkRating() called");
	if (g_studentInfo != undefined && g_studentInfo != null) {
		var history = g_studentInfo.history;
		for (var i=history.length-1; i>=0; i--) {
			var taskItem = history[i];
			var taskType = taskItem.activity_type;
			if (taskItem.link == url && taskType == "link_rating") {
				if (taskItem.is_helpful) {
					$('#searchPartyTopFrame').contents().find('#helpful').attr('checked', 'checked');
				}
				else {
					$('#searchPartyTopFrame').contents().find('#unhelpful').attr('checked', 'checked');
				}
				break;
			}
		}
	}
}

/**
 * Request to background page to call the function getStoredLink() and return 
 * the results.
 */
function request_getStoredLink() {
	console.log("request_getStoredLink() called");
	// Open port to send request for function call to background.js message handler
//	var port = chrome.extension.connect({ name: "spTopUi" });
	port.postMessage({
		type: 'functionRequest',
		functionSignature: 'getStoredLink',
		functionArguments: {}
	});
}

/**
 * Request to background page to call the function getStoredLink() and return 
 * the results.
 */
function request_updateState() {
	console.log("request_updateState() called");
//	if (g_studentInfo && g_studentInfo.status == 1) {
//		if (g_top_ui_visible == false) {
//			showLoadingSearchPartyTopUi();
//		}
//	}
	// Open port to send request for function call to background.js message handler
	var port = chrome.extension.connect({ name: "spTopUi" });
	port.postMessage({
		type: 'functionRequest',
		functionSignature: 'updateState',
		functionArguments: {}
	});
}

/**
 * Request to background page to call the function getStoredLink() and return 
 * the results.
 */
function request_verifyChannelToken() {
	console.log("request_verifyChannelToken() called");
//	if (g_studentInfo && g_studentInfo.status == 1) {
//		if (g_top_ui_visible == false) {
//			showLoadingSearchPartyTopUi();
//		}
//	}
	// Open port to send request for function call to background.js message handler
	var port = chrome.extension.connect({ name: "spTopUi" });
	port.postMessage({
		type: 'functionRequest',
		functionSignature: 'verifyChannelToken',
		functionArguments: {}
	});
}

/**
 * Request to background page to call the function getStoredLink() and return 
 * the results.
 */
function request_refreshState() {
	console.log("request_updateState() called");
	// Open port to send request for function call to background.js message handler
//	var port = chrome.extension.connect({ name: "spTopUi" });
	port.postMessage({
		type: 'functionRequest',
		functionSignature: 'refreshState',
		functionArguments: {}
	});
}

function createSearchPartyInterface() {
	
	// Height of embedded top UI, or width in your case
	var height = '200px';
	
	//resolve html tag, which is more dominant than <body>
	var html;
	if (document.documentElement) {
		html = $(document.documentElement); //just drop $ wrapper if no jQuery
	} else if (document.getElementsByTagName('html') && document.getElementsByTagName('html')[0]) {
		html = $(document.getElementsByTagName('html')[0]);
	} else if ($('html').length > -1) { // drop this branch if no jQuery
		html = $('html');
	} else {
		alert('No <html> element exists, so Search Party cannot be displayed.');
		throw 'No <html> element exists, so Search Party cannot be displayed.';
	}
	
	//position
	// Change positioning of <html> tag to relative positioning.
	if (html.css('position') === 'static') { // or getComputedStyle(html).position
		html.css('position', 'relative'); //or use .style or setAttribute
	}
	
	//top (or right, left, or bottom) offset
	var currentTop = html.css('top'); //or getComputedStyle(html).top
	if (currentTop === 'auto') {
		currentTop = 0;
	} else {
		currentTop = parseFloat($('html').css('top')); //parseFloat removes any 'px' and returns a number type
	}
	html.css(
		'top',     //make sure we're -adding- to any existing values
		currentTop + parseFloat(height) + 'px'
	);
	
	// Render the SearchParty Top Frame
	var searchPartyFrameId = 'searchPartyTopFrame';
	if(document.getElementById(searchPartyFrameId)) {
		alert('id:' + searchPartyFrameId + 'taken please dont use this id!');
		throw 'id:' + searchPartyFrameId + 'taken please dont use this id!';
	}
	html.append(
		'<iframe id="' + searchPartyFrameId + '" scrolling="no" frameborder="0" allowtransparency="false" '
			+ 'style="position: fixed; width: 100%; border:none; z-index: 2147483647; top: 0px;'
	        + 'height: ' + height + '; right: 0px; left: 0px;">'
		+ '</iframe>'
	);
	
	// Style the SearchParty Top Frame
	document.getElementById(searchPartyFrameId).contentDocument.body.innerHTML =
		'<style type="text/css"> \
		html, body { \
			height: ' + height + '; \
			width: 100%; \
			z-index: 2147483647; \
			background-color: #E5E5E5; \
			border-bottom: 1px solid #DEDEDE; \
			font-family: arial,sans-serif; \
			font-size: 13px; \
		} \
		</style> \
		\
		<div id="loadingUi" style="display: none;"> \
		<div style="margin: 10 auto; width: 114px;"> \
			<img src="http://search-party.appspot.com/imgs/sp_logo.png" style="width: 114px; height: 49px;"> \
		</div> \
		<div style="margin: 0 auto; width: 24px;"> \
			<img src="http://search-party.appspot.com/imgs/loading.gif"> \
		</div> \
		</div> \
		\
		<div id="completeUi" style="background: url(http://search-party.appspot.com/imgs/sp_logo.png) no-repeat left center; background-size: 114px 49px; width: 100%; height: ' + height + '; padding-left: 140px; margin-left: 13px;"> \
		<div> \
		<div id="sptask" style="font-weight: normal; padding-bottom: 15px; font-size: 16px; width: 960px; color: #DD4B39;"></div> \
		\
		<div> \
		\
			<div style="width: 300px; border: 0px solid red; float: left;"> \
			Response<br /> \
			<input type="text" id="response" name="response" value="" style="float:left; width:300px; height:27px; line-height:27px; text-indent:10px; font-family:arial, sans-serif; font-size:16px; color:#333; background: #fff; border:solid 1px #d9d9d9; border-top:solid 1px #c0c0c0; border-right:none;"> \
			<br/><br /> \
			\
			Note<br/> \
			<textarea rows="2" name="explanation" id="explanation" style="width:300px"></textarea><br/> \
			<button id="submit_response" name="submit_response" style="cursor:pointer; width:70px; height: 31px; font-size:13px; color: #ffffff; background: #4d90fe center; border: 1px solid #3079ED; -moz-border-radius: 2px; -webkit-border-radius: 2px;">Save</button> \
			<span id="response_saved" class="note"></span> \
			</div> \
			\
			<div style="width: 160px; padding-left: 10px; border: 0px solid red; float: left;"> \
			Rate This Page:<br/> \
			<input type="radio" id="helpful" name="rating" value="1"> Helpful</input><br /> \
			<input type="radio" id="unhelpful" name="rating" value="0"> Unhelpful</input> \
			</div> \
			\
			<div style="width: 600px; padding-left: 10px; border: 0px solid red; float: left;"> \
				<div id="complete_history" class="complete_history"></div> \
				<div id="tag_cloud" class="tag_cloud" style="width: 600px; height: 150px;"></div> \
			</div> \
			\
			<div style="clear: both;"></div> \
		\
		</div> \
		</div>';

	// Set up UI event listeners
	$('#searchPartyTopFrame').contents().find('#submit_response').click(function() { 
		onResponseChanged();
	});
	
	$('#searchPartyTopFrame').contents().find('input[name=rating]').change(onRatingChanged);
	
	if (g_studentInfo != undefined && g_studentInfo.status != undefined) {
		if (g_studentInfo.status == 0) { // Check if student is logged in
			hideSearchPartyTopUi(); // Show UI
		} else if (g_studentInfo.status == 1) {
			showSearchPartyTopUi(); // Show UI // Show UI (this is the default state, so do nothing
		}
	}
//	showLoadingSearchPartyTopUi();
}

function hideSearchPartyTopUi() {

	// Hide the SP top UI
	$('#searchPartyTopFrame').contents().find('#completeUi').css("display", "none");
	$('#searchPartyTopFrame').contents().find('#loadingUi').css("display", "block");
	document.getElementById('searchPartyTopFrame').style.display = 'none';
	
	var html;
	if (document.documentElement) {
		html = $(document.documentElement); //just drop $ wrapper if no jQuery
	} else if (document.getElementsByTagName('html') && document.getElementsByTagName('html')[0]) {
		html = $(document.getElementsByTagName('html')[0]);
	} else if ($('html').length > -1) { // drop this branch if no jQuery
		html = $('html');
	} else {
		alert('No <html> element exists, so Search Party cannot be displayed.');
		throw 'No <html> element exists, so Search Party cannot be displayed.';
	}
	
	var spTopUiHeightWhileHidden = '0px';
	
	// Move HTML page back up to the top of the page since the SP top UI has been hidden
	html.css(
		'top',     //make sure we're -adding- to any existing values
		spTopUiHeightWhileHidden
	);
	
	// Update state variable
	g_top_ui_visible = false;
}

function showSearchPartyTopUi() {

	var spTopUiHeightWhileVisible = '200px';
	
	// Hide the SP top UI
	$('#searchPartyTopFrame').css('height', spTopUiHeightWhileVisible);
//	$('#searchPartyTopFrame').animate({ 'height': spTopUiHeightWhileVisible }, 400);
	$('#searchPartyTopFrame').contents().find('#completeUi').css("display", "block");
	$('#searchPartyTopFrame').contents().find('#loadingUi').css("display", "none");
	document.getElementById('searchPartyTopFrame').style.display = 'block';
	
	var html;
	if (document.documentElement) {
		html = $(document.documentElement); //just drop $ wrapper if no jQuery
	} else if (document.getElementsByTagName('html') && document.getElementsByTagName('html')[0]) {
		html = $(document.getElementsByTagName('html')[0]);
	} else if ($('html').length > -1) { // drop this branch if no jQuery
		html = $('html');
	} else {
		alert('No <html> element exists, so Search Party cannot be displayed.');
		throw 'No <html> element exists, so Search Party cannot be displayed.';
	}
	
	// Move HTML page back up to the top of the page since the SP top UI has been hidden
	html.css(
		'top',     //make sure we're -adding- to any existing values
		spTopUiHeightWhileVisible
	);
	
	// Update state variable
	g_top_ui_visible = true;
}

function showLoadingSearchPartyTopUi() {
	
	var spTopUiHeightWhileLoading = '110px';

	// SHow the SP "loading" top UI
	$('#searchPartyTopFrame').css('height', spTopUiHeightWhileLoading);
	$('#searchPartyTopFrame').contents().find('#completeUi').css("display", "none");
	$('#searchPartyTopFrame').contents().find('#loadingUi').css("display", "block");
	document.getElementById('searchPartyTopFrame').style.display = 'block';
	
	var html;
	if (document.documentElement) {
		html = $(document.documentElement); //just drop $ wrapper if no jQuery
	} else if (document.getElementsByTagName('html') && document.getElementsByTagName('html')[0]) {
		html = $(document.getElementsByTagName('html')[0]);
	} else if ($('html').length > -1) { // drop this branch if no jQuery
		html = $('html');
	} else {
		alert('No <html> element exists, so Search Party cannot be displayed.');
		throw 'No <html> element exists, so Search Party cannot be displayed.';
	}
	
	// Move HTML page back up to the top of the page since the SP top UI has been hidden
	html.css(
		'top',     //make sure we're -adding- to any existing values
		spTopUiHeightWhileLoading
	);
	
	// Update state variable
	g_top_ui_visible = false;
}

/**
 * "onConnect event is fired when a connection is made from an extension process or content script"
 */
chrome.extension.onConnect.addListener(function(port) {
	console.assert(port.name == "spTopUi");
	port.onMessage.addListener(function(message) {
		
		console.log("message " + message.type + " received by universalContentScript.js");

		if (message.type == 'request') {
			
			if (message.request.type == 'answer') {
				
				// Update timestamp
				if (message.request.timestamp != '') {
					var timestamp = getFormattedTimestamp(getLocalTime(new Date(message.request.timestamp)));
					$('#searchPartyTopFrame').contents().find('#response_saved').html('Saved ' + timestamp);
				}
				
				// Update response
				$('#searchPartyTopFrame').contents().find('#response').val(message.request.answer_text);
				
				// Update note
				$('#searchPartyTopFrame').contents().find('#explanation').val(message.request.answer_explanation);
			}
			
		} else if (message.type == 'functionResponse') {
			
//			type: 'functionResponse',
//			functionSignature: 'getStoredLink',
//			functionArguments: {},
//			result: result
			
			console.log("message functionResponse received by universalContentScript.js");
			
			if (message.functionSignature == 'getStoredLink') {
				
				if (message.stateData && message.stateData.g_studentInfo) {
					g_studentInfo = message.stateData.g_studentInfo;
				}
				updateLinkRating(message.result);
			}
			
		} else if (message.type == 'updateState') {
		
			if (message.state && message.state.g_studentInfo) {
				g_studentInfo = message.state.g_studentInfo;
			}
			
			if (message.state && message.state.g_task) {
				g_task = message.state.g_task;
			}
			
			if (message.state && message.state.g_students) {
				g_students = message.state.g_students;
			}
			
			// TODO: Update UI with latest received data
			//createSearchPartyInterface();
			
			if (g_studentInfo) {
				console.log("g_studentInfo.status = " + g_studentInfo.status);
			}
			
			refreshUi();
		}

	});
});

function refreshUi() {
	
	// Show or hide the interface
	if (g_studentInfo.status == 1) {
//		if (document.getElementById('searchPartyTopFrame').style.display == 'none') {
		showSearchPartyTopUi();
//		}
			
		// Update task description
		$('#searchPartyTopFrame').contents().find('#sptask').html(g_task.description);
		
		// Update response
		$('#searchPartyTopFrame').contents().find('#response').val(g_task.response.response);
		
		// Update note
		$('#searchPartyTopFrame').contents().find('#explanation').val(g_task.response.explanation);
		
		// Update timestamp
		$('#searchPartyTopFrame').contents().find('#response_saved').html(g_task.response.timestamp);
		
		request_getStoredLink();
		updateStudents(g_studentInfo.lesson.lesson_code);
		
	} else if (g_studentInfo.status == 0) {
		
//		if (document.getElementById('searchPartyTopFrame').style.display == 'block') {
		hideSearchPartyTopUi();
//		}

	}
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
    var day = '' + ts.getDate();
    if (day.length == 1) day = '0' + day;
    var date =  month + '/' + day + '/'+ (ts.getFullYear()+'').substr(2);
    var hours = ''+ts.getHours();
    var mins = ''+ts.getMinutes();
    if (mins.length == 1) mins = '0' + mins;
    var time = hours + ':' + mins;
    return date + '&nbsp;' + time;
}






//=================================================================================
// Word Clouds
//=================================================================================

function updateStudents(activity_id) {
	console.log("updateStudents() called");
	var requestUrl = 'http://search-party.appspot.com/student_info/' + activity_id;
	
	// Update with cached data
	if (g_students != null) {
		updateCompleteHistory();
	}
	
	// Request refreshed data
	$.get(requestUrl, function(data) {
		var parsedData = JSON.parse(data);
//		alert(data);
//		alert(parsedData);
		g_students = JSON.parse(parsedData[0]);
//		eval(parsedData);
		updateState();
		updateCompleteHistory();
	});
}

/**
 * Sends CURRENT state data to background script. 
 */
function updateState() {
	port.postMessage({
		type: 'updateState',
		state: {
			g_students: g_students
		}
	});
}

function updateCompleteHistory() {			
	var accumulator = new QueryAccumulator();
	$.each(g_students, function (studentNickname, studentInfo) {
		//$.each(studentInfo.tasks[selectedTaskIdx()].searches, function (i,searchInfo) {
		$.each(studentInfo.tasks[g_task.index].searches, function (i, searchInfo) {
			// Skip "<empty>".  Do not add it to the list because it's not useful for users!
			if (searchInfo.query == "<empty>") {
				return 1; // jQuery equivalent of "continue" for its $.each function
			}
			var isHelpful = searchIsHelpful(searchInfo);
			accumulator.add(searchInfo.query, studentNickname, isHelpful);
		});
	});
	accumulator.setSort('ABC');
	var itemList = accumulator.getItems();
	updateAnyWithItems(itemList);
	$('#pane_title').html('Complete History');
	$('#task_activity').hide();
	if (itemList.hasItems()) {
		var saveState2 = g_groupQueriesWithSameWords;
		g_groupQueriesWithSameWords=true;
		drawHistoryCloud(itemList);
		//listCompleteStudentHistories();
		g_groupQueriesWithSameWords = saveState2;
	}
}

function selectedTaskIdx() {
	return g_task.index;
}

function updateAnyWithItems(itemList) {
	g_itemList = itemList;
	//$("#data_display_content").html(itemList.asHTML());
	
//	$(".logout_btn").click(function(event) {
//		event.stopPropagation();
//	    var lesson = g_lessons[0];
//	    var lessonCode = lesson.lesson_code;
//		logoutStudent($(this).val(), lessonCode);
//	});
}

function escapeForHtml(s) {
	return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");
}

function StudentAccumulator() {
	this.add = function(studentNickname, isLoggedIn) {
		var occurrenceDict = this._occurrenceDict;
		var occurrenceKey = studentNickname;
		var counterItem = occurrenceDict[occurrenceKey];
		if (counterItem===undefined) {
			counterItem = new StudentDataItem(studentNickname, isLoggedIn);
			occurrenceDict[occurrenceKey] = counterItem;
		}
	};

	this.getItems = function() {
		var items = valuesOfObject(this._occurrenceDict);
		// Sort names alphabetically w/logged in users on top		
		if (this._sortBy == "Login Status") {
			items.sort( function (a,b) {
				if (a.isLoggedIn==true && b.isLoggedIn==false) {
					return -1;
				}
				else if (a.isLoggedIn==false && b.isLoggedIn==true) {
					return 1;
				}
				else {
					var aName = a.studentNickname.toLowerCase();
					var bName = b.studentNickname.toLowerCase();
					return (aName > bName ? 1 : (aName < bName ? -1 : 0));
				}
			});
		}
		// Sort alphabetically by student nickname
		else {
			sortInPlaceAlphabetically(items, 'studentNickname');
		}
		return new ItemList(items, "student", "Students");
	}

	this.getSort = function() {
		return this._sortBy;
	}
	
	this.setSort = function(sort) {
		if (sort != null) {
			this._sortBy = sort;
		}
	}
	
	this.getDisplayOption = function() {
		return this._displayOption;
	}
	
	this.setDisplayOption = function(option) {
		if (option != null) {
			this._displayOption = option;
		}
	}

	this.sortOptions = ["Login Status", "ABC"];
	this._sortBy = "Login Status";
	this.displayOptions = ["Grouped by Type", "Ordered by Time"];
	this._displayOption = "Grouped by Type";
	this._occurrenceDict = {};
}

function WordAccumulator() {
	this.studentRatings = [];
	
	this.add = function(word, query, studentNickname, isHelpful) {
//		var stem = getWordStem(word).toLowerCase();
		var stem = getWordStem(word);
		var uniquenessKey = stem + "::" + query.toLowerCase() + "::" + studentNickname;
		var uniquenessDict = this._uniquenessDict;
		if (this._uniquenessDict[uniquenessKey]===undefined) {
			this._uniquenessDict[uniquenessKey] = true;
			var occurrenceKey = stem.toLowerCase();
			var counterItem = this._occurrenceDict[occurrenceKey];
			
			// add new word
			if (counterItem===undefined) {
				var wordsDict = {};
				wordsDict[word] = 1;
				var ratings = new RatingCounter();
				ratings.increment(isHelpful);
				this.studentRatings[studentNickname+'::'+occurrenceKey] = isHelpful;
				this._occurrenceDict[occurrenceKey] = counterItem = {
					wordsDict : wordsDict,
					stem  : stem,
					queries : [query],
					studentNicknames : [studentNickname],
					ratings : ratings,
					count : 1
				};
			}
			
			// add new student to word
			else if ($.inArray(studentNickname, counterItem.studentNicknames)==-1) {
				counterItem.count += 1;
				counterItem.wordsDict[word] = (counterItem.wordsDict[word] || 0) + 1;
				counterItem.studentNicknames.push(studentNickname);
				if ($.inArray(query, counterItem.queries)==-1) {
					counterItem.queries.push(query);
				}
				counterItem.ratings.increment(isHelpful);
				this.studentRatings[studentNickname+'::'+occurrenceKey] = isHelpful;
			}
			
			// update word attrs for existing student
			else {
				if ($.inArray(query, counterItem.queries)==-1) {
					counterItem.queries.push(query);
				}
				var existingRating = this.studentRatings[studentNickname+'::'+occurrenceKey];
				var rating = counterItem.ratings.update(isHelpful, existingRating);
				this.studentRatings[studentNickname+'::'+occurrenceKey] = rating;
			}
		}
	};

	this.getItems = function() {
		var items = valuesOfObject(this._occurrenceDict);
		// Sorts by DESCENDING FREQUENCY
		if (this._sortBy == "Frequency") {
			sortInPlaceByCountDescending(items, 'stem');
		}
		// Sort alphabetically
		else {
			sortInPlaceAlphabetically(items, 'stem');
		}
		
		items = $.map(items, function (item, i) {
			var wordsDict = item.wordsDict;
			var allWordsSortedByFrequency = keysOfObjectSortedByValueDescending(wordsDict);
			var wordsStr = allWordsSortedByFrequency.join(", ");
			return new WordDataItem(wordsStr, wordsDict, item.stem, item.queries, item.studentNicknames, item.count, item.ratings)
		});
		
		return new ItemList(items, "word", "Words");
	}
	
	this.getSort = function() {
		return this._sortBy;
	}
	
	this.setSort = function(sort) {
		if (sort != null) {
			this._sortBy = sort;
		}
	}

	this.sortOptions = ["Frequency", "ABC"];
	this._sortBy = "Frequency";
	this._occurrenceDict = {};
	this._uniquenessDict = {};
}

function AnswerAccumulator() {
	this.add = function(answerText, studentNickname) {
		// POLICY:  Quietly ignore blank answers.
		if (answerText.trim()!=="") {			
			var uniquenessKey = studentNickname + "::" + answerText;
			var uniquenessDict = this._uniquenessDict;
			if (this._uniquenessDict[uniquenessKey]===undefined) {
				this._uniquenessDict[uniquenessKey] = true;
				var occurrenceDict = this._occurrenceDict;
				var occurrenceKey = answerText.toLowerCase();
				var counterItem = occurrenceDict[occurrenceKey];
				if (counterItem===undefined) {
					counterItem = new AnswerDataItem(answerText, [studentNickname], 1);
					occurrenceDict[occurrenceKey] = counterItem;
				}
				else {
					counterItem.count += 1;
					counterItem.studentNicknames.push(studentNickname);
				}
			}
		}
	};

	this.getItems = function() {
		var items = valuesOfObject(this._occurrenceDict);
		// Sorts by DESCENDING FREQUENCY
		if (this._sortBy == "Frequency") {
			sortInPlaceByCountDescending(items, 'answerText');
		}
		// Sort alphabetically
		else {
			sortInPlaceAlphabetically(items, 'answerText');
		}
		return new ItemList(items, "answer", "Responses");
	}
	
	this.getSort = function() {
		return this._sortBy;
	}
	
	this.setSort = function(sort) {
		if (sort != null) {
			this._sortBy = sort;
		}
	}

	this.sortOptions = ["Frequency", "ABC"];
	this._sortBy = "Frequency";
	this._occurrenceDict = {};
	this._uniquenessDict = {};
}

function normalizeQuery(query) {
	var normalized = query;
	
	// group queries with same words (e.g., ice cream, cream ice)
	// ignores stop words and duplicates
	if (g_groupQueriesWithSameWords) {
		var words = getWordsForQuery(normalized);
		var coreWords = [];
		$.each(words, function(i,word) {
			if (!isStopWord(word) && $.inArray(word, coreWords)==-1) {
				coreWords.push(word);
			}
		});
		coreWords.sort();
		normalized = coreWords.join(' ');
	}
	
	// group queries with only case differences
	normalized = normalized.toLowerCase();
	
	// group queries with only quotation differences
	normalized = normalized.replace(/"/g,"");
		
	return normalized;
}

function searchIsHelpful(searchInfo) {	
	// searches with only unrated links return null;
	// searches with only helpful or unrated links return true;
	// searches with only unhelpful or unrated links return false
	var linksFollowed = searchInfo.links_followed;
	var numLinksFollowed = linksFollowed.length;
	var helpfulLinkCount = 0;
	var unhelpfulLinkCount = 0;
	for (var i=0; i<numLinksFollowed; i++) {
		if (linksFollowed[i].is_helpful != null) {
		    if (linksFollowed[i].is_helpful) {
			    helpfulLinkCount++;
		    }
		    else {
			    unhelpfulLinkCount++;
		    }
		}
	}

	var isHelpful = null;
	if (helpfulLinkCount>0) isHelpful = true;
	else if (unhelpfulLinkCount>0) isHelpful = false
	return isHelpful;
}

function QueryAccumulator() {
	this.studentRatings = [];

	this.add = function(query, studentNickname, isHelpful) {
		var uniquenessKey = studentNickname + "::" + query;
		var uniquenessDict = this._uniquenessDict;
		if (this._uniquenessDict[uniquenessKey]===undefined) {
			this._uniquenessDict[uniquenessKey] = true;
			var occurrenceDict = this._occurrenceDict;
			var occurrenceKey = normalizeQuery(query);
			var counterItem = occurrenceDict[occurrenceKey];
						
			// add new query
			if (counterItem===undefined) {
				var ratings = new RatingCounter();
				ratings.increment(isHelpful);
				counterItem = new QueryDataItem(query, [studentNickname], 1, ratings, [query]);
				occurrenceDict[occurrenceKey] = counterItem;
				this.studentRatings[studentNickname+'::'+occurrenceKey] = isHelpful;
			}
			
			// add new student to query
			else if ($.inArray(studentNickname, counterItem.studentNicknames)==-1) {
				counterItem.count += 1;
				counterItem.studentNicknames.push(studentNickname);
				counterItem.ratings.increment(isHelpful);
				if ($.inArray(query, counterItem.variations)==-1) {
					counterItem.variations.push(query);
				}
				this.studentRatings[studentNickname+'::'+occurrenceKey] = isHelpful;
			}
			
			// update query attrs for existing student
			else {
				var existingRating = this.studentRatings[studentNickname+'::'+occurrenceKey];
				var rating = counterItem.ratings.update(isHelpful, existingRating);
				this.studentRatings[studentNickname+'::'+occurrenceKey] = rating;
				if ($.inArray(query, counterItem.variations)==-1) {
					counterItem.variations.push(query);
				}
			}
		}
	};

	this.getItems = function() {		
		var items = valuesOfObject(this._occurrenceDict);
		// Sorts by DESCENDING FREQUENCY
		if (this._sortBy == "Frequency") {
			sortInPlaceByCountDescending(items, 'variations');
		}
		// Sort alphabetically
		else {
			sortInPlaceAlphabetically(items, 'variations');
		}
		return new ItemList(items, "query", "Queries");
	}
	
	this.getSort = function() {
		return this._sortBy;
	}
	
	this.setSort = function(sort) {
		if (sort != null) {
			this._sortBy = sort;
		}
	}

	this.sortOptions = ["Frequency", "ABC"];
	this._sortBy = "Frequency";
	this.getCustomOptions = function() {
		var options = [];
		var checked = "";
		if (g_groupQueriesWithSameWords) {
			checked = 'checked="checked"';
		}
		options.push('<input id="group_queries" type="checkbox" '+checked+' onclick="g_groupQueriesWithSameWords=this.checked; updateUI();"/>Group queries with same core words ');
		return options;
	}
	
	this._occurrenceDict = {};
	this._uniquenessDict = {};
}

function DataItem(type, displayText, count, className) {
	// For info on JavaScript OOP, see:
	// http://www.javascriptkit.com/javatutors/oopjs.shtml (new and this)
	// http://www.javascriptkit.com/javatutors/oopjs2.shtml (constructors)
	// http://www.javascriptkit.com/javatutors/oopjs3.shtml (inheritance)

	this.type = type;
	this.displayText = displayText;
	this.count = count;
	this.className = className;
}

function valuesOfObject(o) {
	var values = [];
	for(var k in o) {
		values.push(o[k]);
	};
	return values;
}

function sortInPlaceAlphabetically(items, propertyName) {
	items.sort(function(a,b) {
		var aValue = a[propertyName];
		var bValue = b[propertyName];
		
		// check if property is an array
		// if so, convert to comma-separated sorted string of values
		if ($.isArray(aValue)) {
			aValue = aValue.sort().join(', ');
			bValue = bValue.sort().join(', ');
		}
			
		// case insensitive sort
		var aValue = aValue.toLowerCase();
		var bValue = bValue.toLowerCase();
		return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
	});
}

function QueryDataItem(query, studentNicknames, count, ratings, variations) {
	this._super = DataItem;
	this._super("query", query, count, "query_data_item");

	this.query = query;
	this.studentNicknames = studentNicknames;
	this.ratings = ratings;
	this.variations = variations;
	
	this.getKey = function() {
		return this.query.replace('"','&quot;');
	}
	
	this.asHTML = function() {
		return escapeForHtml(this.variations.sort().join(', ')) + ' '+ this.ratings.asHTML();
	}

	this.asExpandedHTML = function() {
		return this.asHTML();
	}
	
	this.getAnnotationsItemLists = function() {
		var studentAccumulator = new StudentAccumulator();
//		var queryAccumulator = new QueryAccumulator();
		var wordAccumulator = new WordAccumulator();
		var answerAccumulator = new AnswerAccumulator();
		var linkAccumulator = new LinkAccumulator();

		var query = this.query;
		var variations = this.variations;
		$.each(g_students, function (studentNickname,studentInfo) {
			var taskInfo = studentInfo.tasks[selectedTaskIdx()];
			$.each(taskInfo.searches, function (i,searchInfo) {
				if (normalizeQuery(searchInfo.query)==normalizeQuery(query)) {
					studentAccumulator.add(studentNickname, studentInfo.is_logged_in);
					var isHelpful = searchIsHelpful(searchInfo);
					$.each(searchInfo.links_followed, function (j,linkInfo) {
						linkAccumulator.add(linkInfo.url, linkInfo.title, linkInfo.is_helpful, query, studentNickname);
					});
						$.each(getWordsForQuery(query), function (k,word) {
							wordAccumulator.add(word, query, studentNickname, isHelpful);
						});
					answerAccumulator.add(taskInfo.answer.text, studentNickname);
				}
			});
		});

		return [studentAccumulator.getItems(),
				wordAccumulator.getItems(),
				linkAccumulator.getItems(),
				answerAccumulator.getItems()];
	}
}



function ItemList(items, type, title) {
	this.items = items;
	this.type = type;
	this.title = title;
	
	this.itemsAsHTML = function() {
		var items = this.items;
		var html;
		if (items.length==0) {
			html = '<div style="margin-bottom:18px;">(none)</div>'
		}
		else {
			html = '<div id="task_activity" class="accordion2">';
			var thisList = this;
			$.each(items, function(idx,dataItem) {
				html += thisList.itemAsHTML(idx, dataItem);
			});
			html += '</div>';
		}
		return html;
	}
	
	this.itemAsHTML = function(idx, dataItem) {
		var html = '';
		
		// item# div
		if (dataItem.getKey) {
			if (this.type == "student") {
				var logoutButton = '';
			    if (dataItem.isLoggedIn) {
			    	logoutButton = ' <button class="logout_btn" value="'+dataItem.studentNickname+'" title="Logout student">X</button>';
				}
			    html += '<div id="item'+(idx+1)+'" class="accordion_section"><a href="#"><span class="text_key">'+dataItem.getKey()+'</span>'+dataItem.asHTML()+logoutButton+'<div id="student'+(idx+1)+'_history" class="student_history" style="float:right; margin-right:5px"></div></a></div>';
			}
			else {
				html += '<div id="item'+(idx+1)+'" class="accordion_section"><a href="#"><span class="text_key">'+dataItem.getKey()+'</span>'+dataItem.asHTML()+'</a></div>';						
			}
		}
		else {
			html += '<div><a href="#">' + dataItem.asHTML() + '</a></div>';
		}
	
		// item#_expanded div: contains item#_groups and student#_history_list (if on student pane)
		html += '<div id="item'+(idx+1)+'_expanded">';
		html += '<div id="item'+(idx+1)+'_groups" class="item_groups">';
		if (dataItem.getHeaderHTML) {
			html += dataItem.getHeaderHTML();
		}
		
		var itemLists = dataItem.getAnnotationsItemLists();
		$.each(itemLists, function(i,itemList) {
			html += itemList.asExpandedHTML();
		});
		
		html += '</div>';
		
		if (this.type == "student") {
			html += '<div id="student'+(idx+1)+'_history_list" class="student_history_list" style="display:block"></div>';
		}
		
		html += '</div>';
		
		return html;
	}
	
	this.asHTML = function() {
		var html = '<h3 id="pane_title" style="margin-bottom:10px">' + escapeForHtml(this.title) + '</h3>';
		html += '<div id="summary_chart" class="summary_chart"></div>';
		html += '<div id="tag_cloud" class="tag_cloud"></div>';
		html += '<div id="complete_history" class="complete_history"></div>';
		html += '<div id="display_options" class="display_options"></div>';
		html += this.itemsAsHTML();
		html += '</div>';
		return html;
	}
	
	this.itemsAsExpandedHTML = function() {
		var items = this.items;
		// tightened space vertically (atr)
		//var html = '<ol style="margin-bottom:18px">'
		var html = '<ol style="margin-bottom:12px">'
		if( items.length==0 ) {
			html += '<li class="data_display_item">(none)</li>'
		}
		else {
			$.each(items, function(idx,dataItem) {
				html += '<li class="data_display_item">'+dataItem.asExpandedHTML()+'</li>';
			});
		}
		html += '</ol>'
		return html;
	}
	
	this.asExpandedHTML = function() {
		// tightened space vertically (atr)
		//return '<h3 style="margin-bottom:10px">' + escapeForHtml(this.title) + '</h3>' + this.itemsAsExpandedHTML();
		return '<h5>' + escapeForHtml(this.title) + '</h5>' + this.itemsAsExpandedHTML();
	}
	
	this.hasItems = function() {
		return this.items.length > 0;
	}
}

function RatingCounter() {
	this.helpful = 0;
	this.unhelpful = 0;
	this.neutral = 0;
	this.total = 0;
	
	this.increment = function(isHelpful) {
		// POLICY:  if isHelpful is null or undefined or otherwise unspecified, don't count it at all.
		if (isHelpful === true) {
			this.helpful += 1;
		}
		else if (isHelpful === false) {
			this.unhelpful += 1;
		}
		else {
			this.neutral += 1;
		}
		this.total += 1;
	}
	
	this.update = function(isHelpful, prevIsHelpful) {
		var rating = prevIsHelpful;
		if (isHelpful === true) {
			if (prevIsHelpful === false) {
				this.unhelpful -= 1;
			}
			else if (prevIsHelpful === null) {
				this.neutral -= 1;
			}
			this.helpful += 1;
			rating = true;
		}
		else if (isHelpful === false) {
			if (prevIsHelpful === null) {
				this.neutral -= 1;
			}
			this.unhelpful += 1;
			rating = false;
		}
		return rating;
	}
	
	this.asHTML = function() {
		var html = "";
		if (this.total > 0) {
			//html += this.total + ': ';
			if (this.helpful > 0) {
				html += '<img src="' + THUMBS_UP_URL + '" alt="helpful" width="12" height="12" />' + this.helpful;
				if (this.unhelpful + this.neutral > 0) {
					html += ", ";
				}
			}
			if (this.unhelpful > 0) {
			    html += '<img src="' + THUMBS_DOWN_URL + '" alt="unhelpful" width="12" height="12" />' + this.unhelpful;
				if (this.neutral > 0) {
					html += ", ";
				}
			}
			if (this.neutral > 0) {
				html += this.neutral+' unrated';
			}
			
			if (html != "") {
				html = "(" + html + ")";
			}
		}
		return '<span style="white-space:nowrap">' + html + '</span>';
	}
	
    this.asExpandedHTML = function() {
    	return this.asHTML();
    }
}

function LinkAccumulator() {
	this.add = function(url, title, isHelpful, query, studentNickname) {
		var uniquenessKey = url + "::" + query + "::" + studentNickname;
		var uniquenessDict = this._uniquenessDict;
		if (this._uniquenessDict[uniquenessKey]===undefined) {
			this._uniquenessDict[uniquenessKey] = true;
			var occurrenceDict = this._occurrenceDict;
			var occurrenceKey = url;
			var counterItem = occurrenceDict[occurrenceKey];
			var linkContext = {
				studentNickname: studentNickname,
				query: query,
				isHelpful: isHelpful
			};
			if (counterItem===undefined) {
				occurrenceDict[occurrenceKey] = counterItem = {
					linkContexts : [],
					url : url,
					title : title,
					ratings : new RatingCounter(),
					count : 0
				};
			}
			counterItem.count += 1;
			counterItem.linkContexts.push(linkContext);
			counterItem.ratings.increment(isHelpful);
		}
	};

	this.getItems = function() {
		var items = valuesOfObject(this._occurrenceDict);
		// Sorts by DESCENDING FREQUENCY
		if (this._sortBy == "Frequency") {
		    sortInPlaceByCountDescending(items, "title");
		}
		// Sort alphabetically
		else {
			sortInPlaceAlphabetically(items, 'title');
		}
		items = $.map(items, function(item, i) {
			return new LinkDataItem(item.url, item.title, item.count, item.ratings);
		});
		return new ItemList(items, "link", "Links Followed");
	}
	
	this.getSort = function() {
		return this._sortBy;
	}
	
	this.setSort = function(sort) {
		if (sort != null) {
			this._sortBy = sort;
		}
	}

	this.sortOptions = ["Frequency", "ABC"];
	this._sortBy = "Frequency";
	this._occurrenceDict = {};
	this._uniquenessDict = {};
}

function StudentDataItem(studentNickname, isLoggedIn) {
	this._super = DataItem;
	this._super("student", studentNickname, null, "student_data_item");
	this.studentNickname = studentNickname;
	this.isLoggedIn = isLoggedIn;

	this.getKey = function() {
		return this.studentNickname.replace('"','&quot;');
	}
	
	this.getAnnotationsItemLists = function() {
		var queryAccumulator = new QueryAccumulator();
		var wordAccumulator = new WordAccumulator();
		var answerAccumulator = new AnswerAccumulator();
		var linkAccumulator = new LinkAccumulator();

		var studentInfo = g_students[this.studentNickname];
		var taskInfo = studentInfo.tasks[selectedTaskIdx()];
		var answerInfo = taskInfo.answer;
		var studentNickname = this.studentNickname;
		var searches = taskInfo.searches;
		if( answerInfo.text ) {
			answerAccumulator.add(answerInfo.text, studentNickname);
		}

		$.each(searches, function (i,searchInfo) {
			var query = searchInfo.query;
			var isHelpful = searchIsHelpful(searchInfo);
			$.each(searchInfo.links_followed, function (j,linkInfo) {
				linkAccumulator.add(linkInfo.url, linkInfo.title, linkInfo.is_helpful, query, studentNickname);
			});
			queryAccumulator.add(query, studentNickname, isHelpful);
			var words = getWordsForQuery(query);
			$.each(words, function (j,word) {
				wordAccumulator.add(word, query, studentNickname, isHelpful);
			});
		});

		return [queryAccumulator.getItems(),
				wordAccumulator.getItems(),
				linkAccumulator.getItems(),
				answerAccumulator.getItems()];
	}
	
	this.asHTML = function() {
		var className = (this.isLoggedIn===false ? "studentLoggedOut" : "studentLoggedIn");
		return '<span class="nickname ' + className + '" style="font-size:1em;">' + escapeForHtml(this.studentNickname) + '</span>';
	}
	
	this.asExpandedHTML = function() {
		return this.asHTML();
	}
}

function getWordsForQuery(query) {
	query = normalizeSpacing(query);
	query = query.replace(/"/g, "");
	var words = query.split(" ");
	var wordsForQuery = [];
	for (var i in words) {
		if (!isStopWord(words[i])) {
			wordsForQuery.push(words[i]);
		}
	}
	return wordsForQuery;
}

function normalizeSpacing(s) {
	return s.replace(/\s+/g, " ").trim();
}

//=================================================================================
//Language and Stemming
//=================================================================================

function isStopWord(word) {
	var stopWordsSet = isStopWord._stopWordsSet;
	if(stopWordsSet==undefined) {
		var stopWordsArray = [
			"a",
			"the",
			"by",
			"am",
			"an",
			"in",
			"and",
			"or",
			"is",
			"was",
			"been",
			"were"
		];
		var stopWordsSet = {};
		var numStopWords = stopWordsArray.length;
		for(var i=0; i<numStopWords; i++) {
			stopWordsSet[stopWordsArray[i]] = true;
		}
		isStopWord._stopWordsSet = stopWordsSet;
	}
	return (stopWordsSet[word]!=undefined); // if it's undefined, then it's not a stop word.
}

function getWordStem(word) {
	var stemCache = getWordStem._stemCache;
	if( getWordStem.stemCache == undefined ) {
		stemCache = getWordStem._stemCache = {};
	}

	var stem = stemCache[word];

	if( stem==undefined ) {

		var snowballStemmer = getWordStem._snowballStemmer;
		if( snowballStemmer == undefined ) {
			snowballStemmer = getWordStem._snowballStemmer = new Snowball("english");
		}

		snowballStemmer.setCurrent(word);
		snowballStemmer.stem();
		stem = snowballStemmer.getCurrent();
		stemCache[word] = stem;
	}

	return stem;
}

function normalizeSpacing(s) {
	return s.replace(/\s+/g, " ").trim();
}

//=================================================================================
//Helpers
//=================================================================================

function copyOfArray(arr) {
	var newArray = [];
	var numItems = arr.length;
	for(var i=0; i<numItems; i++) {
		newArray.push( arr[i] );
	}
	return newArray;
}

function keysOfObjectSortedByValueDescending(o) {
	// TODO / FIX: Returning duplicate keys (2x number expected); not sure why
	//var keys = keysOfObject(o);
	var keys = Object.keys(o);
	keys.sort(function (a,b) {
		var aValue = o[a];
		var bValue = o[b];
		return (aValue > bValue ? -1 : (aValue < bValue ? 1 : 0));
	});
	return keys;
}

function keysOfObject(o) {
	var keys = [];
	$.each(o, function (k,v) {
		for(var k in o) {
			keys.push(k);
		}
	});
	return keys;
}

function sortInPlaceAlphabetically(items, propertyName) {
	items.sort(function(a,b) {
		var aValue = a[propertyName];
		var bValue = b[propertyName];
		
		// check if property is an array
		// if so, convert to comma-separated sorted string of values
		if ($.isArray(aValue)) {
			aValue = aValue.sort().join(', ');
			bValue = bValue.sort().join(', ');
		}
			
		// case insensitive sort
		var aValue = aValue.toLowerCase();
		var bValue = bValue.toLowerCase();
		return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
	});
}

function sortInPlaceByCountDescending(items, propertyName) {
	items.sort(function(a,b) {
		var aCount = a.count;
		var bCount = b.count;
		var result = (aCount > bCount ? -1 : (aCount < bCount ? 1 : 0));
		if( result===0 && propertyName ) {
			var aValue = a[propertyName];
			var bValue = b[propertyName];
			
			// check if property is an array
			// if so, convert to comma-separated sorted string of values
			if ($.isArray(aValue)) {
				aValue = aValue.sort().join(', ');
				bValue = bValue.sort().join(', ');
			}

			aValue = (((typeof aValue)=="string") ? aValue.toLowerCase() : aValue);
			bValue = (((typeof bValue)=="string") ? bValue.toLowerCase() : bValue);
			result = (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
		}
		return result;
	});
}

function valuesOfObject(o) {
	var values = [];
	for(var k in o) {
		values.push(o[k]);
	};
	return values;
}

function getWordsForQuery(query) {
	query = normalizeSpacing(query);
	query = query.replace(/"/g, "");
	var words = query.split(" ");
	var wordsForQuery = [];
	for (var i in words) {
		if (!isStopWord(words[i])) {
			wordsForQuery.push(words[i]);
		}
	}
	return wordsForQuery;
}

function assert(condition, msg) {
	if (!condition) {
		var s = JSON.stringify(condition);
		if( msg !== undefined ) {
			s = msg + "\n\n" + s;
		}
		alert(msg);
	}
}

function calculateNumStudents() {
	var numStudents = 0;
	for( var student_nickname in g_students ) {
		if( g_students[student_nickname].logged_in ) {
			numStudents++;
		}
	}
	return numStudents;
}

function searchIsHelpful(searchInfo) {	
	// searches with only unrated links return null;
	// searches with only helpful or unrated links return true;
	// searches with only unhelpful or unrated links return false
	var linksFollowed = searchInfo.links_followed;
	var numLinksFollowed = linksFollowed.length;
	var helpfulLinkCount = 0;
	var unhelpfulLinkCount = 0;
	for (var i=0; i<numLinksFollowed; i++) {
		if (linksFollowed[i].is_helpful != null) {
		    if (linksFollowed[i].is_helpful) {
			    helpfulLinkCount++;
		    }
		    else {
			    unhelpfulLinkCount++;
		    }
		}
	}

	var isHelpful = null;
	if (helpfulLinkCount>0) isHelpful = true;
	else if (unhelpfulLinkCount>0) isHelpful = false
	return isHelpful;
}

function countUnique(list) {
	var uniqueValues = [];
	for (var i in list) {
		if ($.inArray(list[i], uniqueValues) == -1) {
			uniqueValues.push(list[i]);
		}
	}		
	return uniqueValues.length;
}

//=================================================================================
// Word Clouds
//=================================================================================

function drawHistoryCloud(itemList, option) {
	g_cloudShowOption = (option == undefined) ? g_cloudShowOption : option;
	var options = [];
	options.push(getCloudOption('Helpful', 'link_helpful', 'drawHistoryCloud'));
	options.push(getCloudOption('Unhelpful', 'link_unhelpful', 'drawHistoryCloud'));
	options.push(getCloudOption('Unrated', 'link', 'drawHistoryCloud'));
	var showOptions = { label:'Show: ', options:options };
	
	drawCloud("tag_cloud", itemList, function(i, item) {
		var link = item.query;
		var url = '#';
		var weight = g_cloudShowOption == 'link_helpful' ? item.ratings.helpful : (g_cloudShowOption == 'link_unhelpful' ? item.ratings.unhelpful : item.count-item.ratings.helpful-item.ratings.unhelpful);
		return {link:link, url:url, weight:weight};
	}, 
	{ show:showOptions, color:{start:g_actionColors[g_cloudShowOption], end:g_actionColors[g_cloudShowOption]}, className:'noLink' });
}

function drawQueryCloud(itemList, option) {		
	g_cloudShowOption = (option == undefined) ? g_cloudShowOption : option;
	var options = [];
	options.push(getCloudOption('Helpful', 'link_helpful', 'drawQueryCloud'));
	options.push(getCloudOption('Unhelpful', 'link_unhelpful', 'drawQueryCloud'));
	options.push(getCloudOption('Unrated', 'link', 'drawQueryCloud'));
	var showOptions = { label:'Show: ', options:options };
	
	drawCloud("tag_cloud", itemList, function(i, item) {
		var link = item.query;
		var url = "javascript:openAccordion("+i+");";
		var weight = g_cloudShowOption == 'link_helpful' ? item.ratings.helpful : (g_cloudShowOption == 'link_unhelpful' ? item.ratings.unhelpful : item.count-item.ratings.helpful-item.ratings.unhelpful);
		return {link:link, url:url, weight:weight};
	}, { show:showOptions, color:{start:g_actionColors[g_cloudShowOption], end:g_actionColors[g_cloudShowOption]} });
}

function drawWordCloud(itemList, option) {	
	g_cloudShowOption = (option == undefined) ? g_cloudShowOption : option;
	var options = [];
	options.push(getCloudOption('Helpful', 'link_helpful', 'drawWordCloud'));
	options.push(getCloudOption('Unhelpful', 'link_unhelpful', 'drawWordCloud'));
	options.push(getCloudOption('Unrated', 'link', 'drawWordCloud'));
	var showOptions = { label:'Show: ', options:options };

	drawCloud("tag_cloud", itemList, function(i, item) {
		var link = item.wordsStr;
		var url = "javascript:openAccordion("+i+");";
		var weight = g_cloudShowOption == 'link_helpful' ? item.ratings.helpful : (g_cloudShowOption == 'link_unhelpful' ? item.ratings.unhelpful : item.count-item.ratings.helpful-item.ratings.unhelpful);
		return {link:link, url:url, weight:weight};
	}, { show:showOptions, color:{start:g_actionColors[g_cloudShowOption], end:g_actionColors[g_cloudShowOption]} });
}

function drawLinkCloud(itemList, option) {
	g_cloudShowOption = (option == undefined) ? g_cloudShowOption : option;
	var options = [];
	options.push(getCloudOption('Helpful', 'link_helpful', 'drawLinkCloud'));
	options.push(getCloudOption('Unhelpful', 'link_unhelpful', 'drawLinkCloud'));
	options.push(getCloudOption('Unrated', 'link', 'drawLinkCloud'));
	var showOptions = { label:'Show: ', options:options };

	drawCloud("tag_cloud", itemList, function(i, item) {
		var link = item.title;
		var url = "javascript:openAccordion("+i+");";
		var weight = g_cloudShowOption == 'link_helpful' ? item.ratings.helpful : (g_cloudShowOption == 'link_unhelpful' ? item.ratings.unhelpful : item.count-item.ratings.helpful-item.ratings.unhelpful);
		return {link:link, url:url, weight:weight};
	}, { show:showOptions, color:{start:g_actionColors[g_cloudShowOption], end:g_actionColors[g_cloudShowOption]} });
}

function drawAnswerCloud(itemList) {	
	drawCloud("tag_cloud", itemList, function(i, item) {
		var link = item.answerText;
		var url = "javascript:openAccordion("+i+");";
		var weight = item.count;
		return {link:link, url:url, weight:weight};
	});
}

function drawCloud(divName, itemList, getCloudDataFunc, options) {
//	alert("drawCloud() called");
	var cloudHtml = '';
	var maxWeight = 1;
	
	// Variables for calculating size of query cloud
	var cloudTextPixelWidthTotal    = 0;
	var cloudTextPixelWidthCounter  = 0;
	var cloudTextPixelHeightTotal   = 0;
	var maxCloudElementHeightOnLine = 0;
	var cloudContainerWidth  = $('#searchPartyTopFrame').contents().find("#" + divName).width();
	var cloudContainerHeight = $('#searchPartyTopFrame').contents().find("#" + divName).height();
	
	$.each(itemList.items, function(i, item) {
		var data = getCloudDataFunc(i, item);
		if (data.weight > 0) {
			var link = data.link.length <= MAX_TAG_LENGTH ? data.link : data.link.substring(0, MAX_TAG_LENGTH) + "&hellip;";
			link = link.replace("<", "&lt;").replace(">", "&gt;");
			var cloudItemSpanHtml =  '<span id="cloud_' + i + '"><a' + ((options != undefined && options.className != undefined) ?' class="' + options.className + '"' : '') + ' href="' + data.url + '" rel="' + data.weight + '" title="' + data.link + '">' + link + '</a></span>\n';
			$('#searchPartyTopFrame').contents().find("#" + divName).html(cloudItemSpanHtml);
			
			var cloudElementWidth = $('#searchPartyTopFrame').contents().find("#cloud_" + i).width(); // Get width of span containing text
			var cloudElementHeight = $('#searchPartyTopFrame').contents().find("#cloud_" + i).height(); // Get height of span containing text
			if (cloudElementHeight > maxCloudElementHeightOnLine) { // Check if element height is new greatest height encountered in line so far...
				maxCloudElementHeightOnLine = cloudElementHeight; // ...if so, update the current max to its height.
			}
			cloudTextPixelWidthCounter += cloudElementWidth;
			cloudTextPixelWidthTotal += cloudElementWidth;
//			alert(cloudTextPixelWidthCounter + " > " + cloudContainerWidth);
			if (cloudTextPixelWidthCounter > cloudContainerWidth) {
				cloudTextPixelHeightTotal += maxCloudElementHeightOnLine;
				maxCloudElementHeightOnLine = 0; // Reset max cloud element height for next line of cloud
//				alert("cloudTextPixelHeightTotal = " + cloudTextPixelHeightTotal);
				
				if (cloudTextPixelHeightTotal > cloudContainerHeight) {
					return false; // break; // Stop adding to the cloud
				}
			}
			
			cloudHtml += cloudItemSpanHtml; // Append HTML for cloud element to cloud HTML
			if (data.weight > maxWeight) {
				maxWeight = data.weight;
			}
		}
	});
	if (cloudHtml == '') {
		cloudHtml = '<span class="small">(none)</span>';
	}
	
	// if items, show cloud options + html
	if (itemList.items.length > 0) {
		var html = '';
		if (options != undefined && options.show != undefined && options.show.options.length > 0) {
			html += '<div class="cloud_options display_options">' + options.show.label + options.show.options.join(' ') + '</div>';
		}
//		html += '<div class="cloud"><p>'+cloudHtml+'</p></div>';
		html += '<div class="cloud"><p><strong>Queries:</strong> ' + cloudHtml + '</p></div>';
		
		var minFont = 10;
		var maxFont = 26;
		if (maxWeight<=2) {
			maxFont = 16;
		}
		
		var startColor = options!=undefined && options.color!=undefined && options.color.start!=undefined ? options.color.start : g_actionColors['link'];
		var endColor = options!=undefined && options.color!=undefined && options.color.end!=undefined ? options.color.end : g_actionColors['link'];
		
		$('#searchPartyTopFrame').contents().find("#"+divName).html(html);
		$('#searchPartyTopFrame').contents().find("#"+divName+" a").tagcloud({
			size: {
				start: minFont,
				end: maxFont,
				unit: 'pt'
			},
			color: {
				start: startColor,
				end: endColor
			}
		});
	}
}

function getCloudOption(label, value, funcName, className) {
	var isSelected = value == g_cloudShowOption;
	if (isSelected) {
		return '<strong>'+label+'</strong>';
	} else {
		//$('#searchPartyTopFrame').contents().find('#response').val();
		//var $f = $('#searchPartyTopFrame').contentWindow.;
		//return '<a href="javascript:$(\'#searchPartyTopFrame\').contentWindow.' + funcName + '(g_itemList, \''+value+'\');">' + label + '</a>';
		//return '<a href="javascript:parent.' + funcName + '(g_itemList, \''+value+'\');">' + label + '</a>';
		//return '<a href="javascript:alert(\'' + parent.location.href + '\');">' + label + '</a>';
		//return '<a href="javascript:parent.tester();">' + label + '</a>';
		var anchorId = value + '_link';
		var anchorHtml = 
			'<a id="' + anchorId + '" href="javascript:void(0);">' + label + '</a> \
			<script> \
				document.getElementById(\'searchPartyTopFrame\').contentDocument.getElementById("' + anchorId + '").addEventListener("click", function() { \
				    window.postMessage({ \
						type: "query_cloud_filter", \
						value: "' + value + '", \
						funcName: "' + funcName + '" \
					}, "*"); \
				}, false); \
			</script>'; // Anchor HTML and initialization JavaScript
		return anchorHtml;
	}
}






//var port = chrome.extension.connect();
window.addEventListener("message", function(event) {
	// We only accept messages from ourselves
	if (event.source != window) {
		return;
	}
	if (event.data.type && (event.data.type == "query_cloud_filter")) {
		// getCloudOption('Helpful', 'link_helpful', 'drawHistoryCloud')
		//function drawQueryCloud(itemList, option)
		
		// Description of eval():
		// http://viralpatel.net/blogs/calling-javascript-function-from-string/
//		var functionCall = event.data.funcName + "(g_itemList, '" + event.data.value + "')";
//		alert(functionCall);
//		var functionReturnValue = eval(functionCall);
		drawQueryCloud(g_itemList, event.data.value);
		
//		console.log("Content script received filter request: " + event.data.filter);
//		port.postMessage(event.data.filter);
	}
}, false);





function openAccordion(index) {
	$('#task_activity').accordion({active:index});
}

//=========

function AnswerDataItem(answerText, studentNicknames, count) {
	this._super = DataItem;
	this._super("answer", answerText, count, "answer_data_item");
	this.answerText = answerText;
	this.studentNicknames = studentNicknames;
	
	this.getKey = function() {
		return this.answerText.replace('"','&quot;');
	}
	
	this.asHTML = function() {		
		return escapeForHtml(this.answerText) + ' <span style="white-space:nowrap">('+this.count+')</span>';
	}
	
    this.asExpandedHTML = function() {
    	return this.asHTML();
    }
    
	this.getAnnotationsItemLists = function() {
		var studentAccumulator = new StudentAccumulator();
		var queryAccumulator = new QueryAccumulator();
		var wordAccumulator = new WordAccumulator();
//		var answerAccumulator = new AnswerAccumulator();
		var linkAccumulator = new LinkAccumulator();

		var answerText = this.answerText;
		$.each(g_students, function (studentNickname,studentInfo) {
			var taskInfo = studentInfo.tasks[selectedTaskIdx()];
			if( taskInfo.answer.text == answerText ) {
				studentAccumulator.add(studentNickname, studentInfo.is_logged_in);
				$.each(taskInfo.searches, function (i,searchInfo) {
					var query = searchInfo.query;
					var isHelpful = searchIsHelpful(searchInfo);
					
					$.each(searchInfo.links_followed, function (j,linkInfo) {
						linkAccumulator.add(linkInfo.url, linkInfo.title, linkInfo.is_helpful, query, studentNickname);
					});
					queryAccumulator.add(query, studentNickname, isHelpful);
					$.each(getWordsForQuery(query), function (j,word) {
						wordAccumulator.add(word, query, studentNickname, isHelpful);
					});
				});
			}
		});

		return [studentAccumulator.getItems(),
				queryAccumulator.getItems(),
				wordAccumulator.getItems(),
				linkAccumulator.getItems()];
	}
}