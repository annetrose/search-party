/*
# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

var g_complete_histories = [];

// panes
var g_itemList = null;
var g_accumulator = null;
var g_currentPaneName = null;
var g_currentPaneSort = null;
var g_currentPaneDisplayOption = null;
var g_groupQueriesWithSameWords = false;

var g_activeSectionIndex = false;
var g_activeSectionKey = null;

// charts
var g_chartApiLoaded = false;
var g_chart = null;
var g_chartData = null;
var g_chartOptions = null;
var g_minTaskTime = null;
var g_maxTaskTime = null;

// clouds
var DEFAULT_CLOUD_SHOW_OPTION = 'link_helpful';
var g_cloudShowOption = DEFAULT_CLOUD_SHOW_OPTION;

// student histories
var g_actionDim = 6; // pixels
var g_actionColors = { search:'#888888', link:'#454C45', link_helpful:'#739c95', link_unhelpful:'#5C091F', answer:'blue' };

function initializeTeacher() {
	window.status = "Loading...";
	openChannel();
	initUI();
	initHistoryData();
	window.status = "Loaded";
}

function updateData() {
	initHistoryData();
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

$(window).resize(function() {
	$('.summary_chart').width('100%');
	drawChart();
	if (g_itemList!=null && g_currentPaneName=="students") {
		drawStudentHistories(g_itemList);
	}
});

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
		if (update.lesson_code == g_lessons[0].lesson_code) {
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
}

function onSocketOpen() {
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
// Task and Message Handlers
//=================================================================================

function updateTaskDescription(taskIdx) {
    var html = g_lessons[0].tasks[taskIdx][1];
    if (html == '') html = '(none)';
    $('#task_description').html(html);
}

function onTaskChanged(taskIdx) {
	// onTaskChanged is called from js/task_chooser.js
	g_minTaskTime = null;
	g_maxTaskTime = null;
	updateTaskDescription(taskIdx);
	updateUI();
}

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
	updateUI();
}

function handle_update_log_out(student_nickname) {
	if (g_students[student_nickname]!=undefined) {
		var student_info = g_students[student_nickname];
		student_info.logged_in = false;
		student_info.task_idx = null;
		updateUI();
	}
}

function handle_update_task(student_nickname, task_idx) {
	if (g_students[student_nickname]!=undefined) {
		g_students[student_nickname].task_idx = task_idx;
	}
}

function handle_update_query(student_nickname, task_idx, query, timestamp) {
	if (g_students[student_nickname]!=undefined) {
		var task = {activity_type:"search", search:query, link:null, link_title:null, is_helpful:null, answer_text:null, answer_explanation:null, timestamp:timestamp};
		g_students[student_nickname].task_history[task_idx].push(task);
		g_students[student_nickname].tasks[task_idx].searches.push({"query":query, "links_followed":[]});
		task.student_nickname = student_nickname;
		g_complete_histories[task_idx].push(task);
		
		if (task_idx == selectedTaskIdx()) {
		    updateMinMaxTaskTimes(timestamp);
			updateUIWithStudentActivity(student_nickname);
		}
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
		if (task_idx == selectedTaskIdx()) {
		    updateMinMaxTaskTimes(timestamp);
			updateUIWithStudentActivity(student_nickname);
		}
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
		if (task_idx == selectedTaskIdx()) {
		    updateMinMaxTaskTimes(timestamp);
			updateUIWithStudentActivity(student_nickname);
		}
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
		if (task_idx == selectedTaskIdx()) {
		    updateMinMaxTaskTimes(timestamp);
			updateUIWithStudentActivity(student_nickname);
		}
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

//=================================================================================
// Update UI
//=================================================================================

function initUI() {    
    var lesson = g_lessons[0];
    var lesson_code = lesson.lesson_code;
    $('#lesson_title').html(lesson.title);
    $('#lesson_code').html(lesson_code);
    $('#task_chooser').selectbox();
    updateTaskDescription(0);  
    
    var utc_offset_minutes = (new Date()).getTimezoneOffset();
	var html = '';
    html += '<button class="cssbtn" id="edit_lesson_btn_'+lesson_code+'" onclick="goToLessonForm(\''+lesson_code+'\');">Edit activity<span class="edit"></span></button><br/>';
	html += '<button class="cssbtn" id="stop_lesson_btn_'+lesson_code+'" style="display:none" onclick="stopLesson(\''+lesson_code+'\')">Stop activity<span class="stop"></span></button>';
	html += '<button class="cssbtn" id="start_lesson_btn_'+lesson_code+'" style="display:none" onclick="startLesson(\''+lesson_code+'\')">Start activity<span class="start"></span></button>';
	html += '<br/>';
	html += '<button class="cssbtn" id="clone_lesson_btn_'+lesson_code+'" onclick="cloneLesson(\''+lesson_code+'\', false)">Clone activity</button><br/>';
    html += '<button class="cssbtn" id="download_data_btn_'+lesson_code+'" onclick="window.location=\'/data_dump?lesson_code='+lesson_code+'&utc_offset_minutes=' + utc_offset_minutes + '\'; return false;">Download data<span class="dl"></span></button><br/>' 
    html += '<button class="cssbtn" id="clear_lesson_btn_'+lesson_code+'" onclick="clearLesson(\''+lesson_code+'\', false)">Clear data<span class="clr"></span></button><br/>';
    html += '<button class="cssbtn" id="delete_lesson_btn_'+lesson_code+'" onclick="deleteLesson(\''+lesson_code+'\')">Delete activity<span class="del"></span></button>';
    $('#side_button_bar2').html(html);
}

function loadUIData() {
	g_chartApiLoaded = true;
	updateUI();
	loadPane(START_PANE);
}

function updateUI() {
	// check if activity was deleted and if so, redirect to dashboard
	if (g_lessons.length==0) {
		window.location = '/teacher_dashboard';
		return;
	}
	
	updateSideBarInfo();
	updateButtons();
	$("#data_display_content").html("");
	$("#cloud").html("");
	switch( g_currentPaneName ) {
		case "complete":
			updateCompleteHistory();
			break;
		case "students":
			updateStudents();
			break;
		case "queries":
			updateQueries();
			break;
		case "words":
			updateWords();
			break;
		case "links":
			updateLinks();
			break;
		case "answers":
			updateAnswers();
			break;
		default:
			break;
	}
				
	$('#inactive').toggle(!g_lessons[0].is_active);

	if (g_activeSectionKey!=null && g_itemList!=null) {
		$.each(g_itemList.items, function(idx,item) {
			var itemKey = item.getKey();
			if (itemKey == g_activeSectionKey) {
				g_activeSectionIndex = idx;
				return;
			}
		});
	}
	
	$('#task_activity').accordion({
	   	collapsible: true, 
	   	active: g_activeSectionIndex,
	    change: function(event, control) {
	    	g_activeSectionIndex = control.options.active;
	    	var activeSection = $(".accordion_section:eq("+g_activeSectionIndex+")");
	    	g_activeSectionKey = $('.text_key', activeSection).html();
	    }
	});
}

function updateUIWithStudentActivity(studentNickname) {
	switch(g_currentPaneName) {
		case "students":
			updateSideBarInfo();
			updateButtons();
			if (g_itemList!=null) {
				
				// update student summary chart (for all students)
			    drawStudentChartArea(g_itemList);
			    
			    // update student history (both visual and list representations)
			    drawStudentHistory(null, studentNickname);
			    listStudentHistory(null, studentNickname);
		    
			    // update expanded html for student groups
			    var html = '';
			    var studentData = new StudentDataItem(studentNickname, g_students[studentNickname].logged_in);
		 		var studentIndex = getStudentSection(studentNickname);
			    if (studentData.getHeaderHTML) {
					html += studentData.getHeaderHTML();
				}
				
				var itemLists = studentData.getAnnotationsItemLists();
				$.each(itemLists, function(i,itemList) {
					html += itemList.asExpandedHTML();
				});
			    
		 		div = $('#item'+(studentIndex+1)+'_groups');
		 		div.html(html);
			}
			break;
		default:
			updateUI();
			break;
	}
}

function initPaneAndUpdateUI() {
	g_activeSectionIndex = false;
	g_activeSessionKey = null;
	g_cloudShowOption = DEFAULT_CLOUD_SHOW_OPTION;
	updateUI();
}

function updateSideBarInfo() {
	var numStudents = calculateNumStudents();
	$("#num_students").html(numStudents);
}

function updateCompleteHistory() {			
	var accumulator = new QueryAccumulator();
	$.each(g_students, function (studentNickname,studentInfo) {
		$.each(studentInfo.tasks[selectedTaskIdx()].searches, function (i,searchInfo) {
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
		listCompleteStudentHistories();
		g_groupQueriesWithSameWords = saveState2;
	}
}

function updateStudents() {
	g_accumulator = new StudentAccumulator();
	// TODO / FIX: Returning duplicate student names (2x number expected); not sure why
	//var studentNames = keysOfObject(g_students);
	var studentNames = Object.keys(g_students);
	$.each(studentNames, function(i, studentNickname) {
		var isLoggedIn = g_students[studentNickname].logged_in;
		g_accumulator.add(studentNickname, isLoggedIn);
	});
		
	g_accumulator.setSort(g_currentPaneSort);
	g_accumulator.setDisplayOption(g_currentPaneDisplayOption);
	var itemList = g_accumulator.getItems();
	updateAnyWithItems(itemList);
	if (itemList.hasItems()) {
		drawStudentChartArea(itemList);
		updateOptions("student", g_accumulator);
		drawStudentHistories(itemList);
		if (g_accumulator.getDisplayOption() == "Ordered by Time") {
			$(".item_groups").hide();
			$(".student_history_list").show();
		}
		else {
			$(".item_groups").show();
			$(".student_history_list").hide();
		}
	}
}

function updateQueries() {			
	var accumulator = new QueryAccumulator();
	$.each(g_students, function (studentNickname,studentInfo) {
		$.each(studentInfo.tasks[selectedTaskIdx()].searches, function (i,searchInfo) {
			var isHelpful = searchIsHelpful(searchInfo);
			accumulator.add(searchInfo.query, studentNickname, isHelpful);
		});
	});
	
	accumulator.setSort(g_currentPaneSort);
	var itemList = accumulator.getItems();
	updateAnyWithItems(itemList);
	if (itemList.hasItems()) {
		updateOptions("query", accumulator);
		drawQueryCloud(itemList);
		//drawQueryChartArea(itemList);
	}
}

function updateWords() {
	var accumulator = new WordAccumulator();
	$.each(g_students, function (studentNickname,studentInfo) {
		$.each(studentInfo.tasks[selectedTaskIdx()].searches, function (i,searchInfo) {
			var query = searchInfo.query;
			var isHelpful = searchIsHelpful(searchInfo);
			var words = getWordsForQuery(query);
			$.each(words, function(j, word) {
				accumulator.add(word, query, studentNickname, isHelpful);
			});
		});
	});
	
	accumulator.setSort(g_currentPaneSort);
	var itemList = accumulator.getItems();
	updateAnyWithItems(itemList);
	if (itemList.hasItems()) {
		updateOptions("word", accumulator);
		drawWordCloud(itemList);
		//drawWordChartArea(itemList);
	}
}

function updateLinks() {
	var accumulator = new LinkAccumulator();
	$.each(g_students, function (studentNickname,studentInfo) {
		$.each(studentInfo.tasks[selectedTaskIdx()].searches, function (i,searchInfo) {
			var linksFollowed = searchInfo.links_followed;
			$.each(linksFollowed, function(j, linkInfo) {
				accumulator.add(linkInfo.url, linkInfo.title, linkInfo.is_helpful, searchInfo.query, studentNickname);
			});
		});
	});
	
	accumulator.setSort(g_currentPaneSort);
	var itemList = accumulator.getItems();
	updateAnyWithItems(itemList);
	if (itemList.hasItems()) {
		updateOptions("link", accumulator);
		drawLinkCloud(itemList);
		//drawLinkChartArea(itemList);
	}
}

function updateAnswers() {
	var accumulator = new AnswerAccumulator();
	$.each(g_students, function(studentNickname,studentInfo) {
		var answerText = studentInfo.tasks[selectedTaskIdx()].answer.text;
		accumulator.add(answerText, studentNickname)
	});
	
	accumulator.setSort(g_currentPaneSort);
	var itemList = accumulator.getItems();
	updateAnyWithItems(itemList);
	if (itemList.hasItems()) {
		updateOptions("answer", accumulator);
		drawAnswerCloud(itemList);
		//drawAnswerChartArea(itemList);
	}
}

function updateAnyWithItems(itemList) {
	g_itemList = itemList;
	$("#data_display_content").html(itemList.asHTML());
	
	$(".logout_btn").click(function(event) {
		event.stopPropagation();
	    var lesson = g_lessons[0];
	    var lessonCode = lesson.lesson_code;
		logoutStudent($(this).val(), lessonCode);
	});
}

function updateOptions(type, accumulator) {
	var html = '';

	// sort options
	var options = accumulator.sortOptions;
	if (options) {
		html += '<span style="margin-right:10px;">';
		html += 'Sort by: ';
		for (i in options) {
			if (options[i] == accumulator.getSort()) {
				html += '<strong>'+options[i] + '</strong> ';
			}
			else {
				html += '<a href="#" onclick="g_currentPaneSort=\''+options[i]+'\'; updateUI(); return false;">'+options[i]+'</a> ';
			}
		}
		html += '</span>';
	}
	
	// display options (if any)
	options = accumulator.displayOptions;
	if (options) {
		html += '<span style="white-space:nowrap;">';
		html += 'Display actions: ';
		for (i in options) {
			if (options[i] == accumulator.getDisplayOption()) {
				html += '<strong>' + options[i] + '</strong> ';
			}
			else {
				html += '<a href="#" onclick="g_currentPaneDisplayOption=\''+options[i]+'\'; updateUI(); return false;">'+options[i]+'</a> ';
			}
		}
		html += '</span>';
	}
	
	// custom options (if any)
	if (accumulator.getCustomOptions) {
		options = accumulator.getCustomOptions();
		if (options) {
			html += '<span style="white-space:nowrap;">';
			for (i in options) {
				html += options[i];
			}
			html += '</span>';
		}
	}
	
	$('#display_options').html(html);
}

//=================================================================================
// UI Pane
//=================================================================================

function loadPane(paneName) {
	if(g_currentPaneName !== null) {
		$("#"+getPaneId(g_currentPaneName)).removeClass("selected");
		$("#"+loadButtonId(g_currentPaneName)).removeClass("selected");
	}
	g_currentPaneName = paneName;
	g_currentPaneSort = null;
	$("#"+getPaneId(g_currentPaneName)).addClass("selected");
	$("#"+loadButtonId(g_currentPaneName)).addClass("selected");
	initPaneAndUpdateUI();
	window.location.hash = g_currentPaneName;
}

function getPaneId(paneName) {
	return "pane_" + paneName;
}

function loadButtonId(paneName) {
	return "load_" + paneName + "_btn";
}

function updateButtons() {
	var taskIdx = selectedTaskIdx();
	var numStudents=0, numQueries=0, numWords=0, numLinks=0, numAnswers=0;
	var queries=[], words=[], links=[], answers=[];
	for (var studentNickname in g_students) {
		numStudents += 1;
		var taskInfo = g_students[studentNickname].tasks[taskIdx];
		var searches = taskInfo.searches;
		for (var searchIdx in searches) {
			var search = searches[searchIdx];
			var query = normalizeQuery(search.query);
			queries.push(query);
			words = words.concat(getWordsForQuery(query));
			var linksFollowed = search.links_followed;
			for (var linkIdx in linksFollowed) {
				links.push(linksFollowed[linkIdx].url);
			}
		}
		var answerTrimmed = taskInfo.answer.text.trim();
		if (answerTrimmed.length > 0) {
			answers.push(answerTrimmed);
		}
	}
	
	// numWords - case differences not included in count, but different stems are (e.g., peanut vs. peanuts)
	
	numQueries = countUnique(queries);
	numWords = countUnique(words); 
	numLinks = countUnique(links);
	numAnswers = countUnique(answers);

	document.getElementById(loadButtonId("students")).innerHTML = "Students (" + numStudents + ")";
	document.getElementById(loadButtonId("queries" )).innerHTML = "Queries ("  + numQueries + ")";
	document.getElementById(loadButtonId("words"   )).innerHTML = "Words ("    + numWords + ")";
	document.getElementById(loadButtonId("links"   )).innerHTML = "Links ("    + numLinks + ")";
	document.getElementById(loadButtonId("answers" )).innerHTML = "Responses ("  + numAnswers + ")";

	var lesson_code = g_lessons[0].lesson_code;
    $('#stop_lesson_btn_'+lesson_code).toggle(g_lessons[0].is_active);
    $('#start_lesson_btn_'+lesson_code).toggle(!g_lessons[0].is_active);
}

//=================================================================================
// Aggregation
//=================================================================================

function DataItem(type, displayText, count, className) {
//For info on JavaScript OOP, see:
//http://www.javascriptkit.com/javatutors/oopjs.shtml   (new and this)
//http://www.javascriptkit.com/javatutors/oopjs2.shtml  (constructors)
//http://www.javascriptkit.com/javatutors/oopjs3.shtml  (inheritance)

	this.type = type;
	this.displayText = displayText;
	this.count = count;
	this.className = className;
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

function WordDataItem(wordsStr, wordsDict, stem, queries, studentNicknames, count, ratings) {
	this._super = DataItem;
	this._super("word", wordsStr, count, "word_data_item");

	this.wordsStr = wordsStr;
	this.wordsDict = wordsDict;
	this.stem = stem;
	this.queries = queries;
	this.studentNicknames = studentNicknames;
	this.ratings = ratings;
	
	this.getKey = function() {
		return this.wordsStr.replace('"','&quot;');
	}
	
	this.asHTML = function() {
		return escapeForHtml(this.wordsStr) + ' '+ this.ratings.asHTML();
	}
	
	this.asExpandedHTML = function() {
		return this.asHTML();
	}
	
	this.getAnnotationsItemLists = function() {
		var studentAccumulator = new StudentAccumulator();
		var queryAccumulator = new QueryAccumulator();
		var answerAccumulator = new AnswerAccumulator();
		var linkAccumulator = new LinkAccumulator();
		var wordsDict = this.wordsDict;

		$.each(g_students, function (studentNickname,studentInfo) {
			var taskInfo = studentInfo.tasks[selectedTaskIdx()];
			$.each(taskInfo.searches, function (i,searchInfo) {
				var query = searchInfo.query;
				var words = getWordsForQuery(query);
				var numWords = words.length;
				var queryMatches = false;
				for( var j=0; j<numWords; j++ ) {
					if( wordsDict[words[j]] !== undefined ) {
						queryMatches = true;
						break;
					}
				}
				if (queryMatches) {
					studentAccumulator.add(studentNickname, studentInfo.is_logged_in);
					var isHelpful = searchIsHelpful(searchInfo);
					$.each(searchInfo.links_followed, function (j,linkInfo) {
						linkAccumulator.add(linkInfo.url, linkInfo.title, linkInfo.is_helpful, query, studentNickname);
					});
					queryAccumulator.add(query, studentNickname, isHelpful);
					answerAccumulator.add(taskInfo.answer.text, studentNickname);
				}
			});
		});

		return [studentAccumulator.getItems(),
				queryAccumulator.getItems(),
				linkAccumulator.getItems(),
				answerAccumulator.getItems()];
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

function LinkDataItem(url, title, count, ratings) {
	this._super = DataItem;
	this._super("link", url, count, "link_data_item");
	this.url = url;
	this.title = title;
	this.ratings = ratings;
	
	this.getKey = function() {
		return this.url.replace('"','&quot;');
	}
	
	this.asHTML = function() {
		return this.title + " " + this.ratings.asHTML();
	};
	
	this.asExpandedHTML = function() {
		return makeLinkHTML({url:this.url, title:this.title}, 30) + " " + this.ratings.asHTML();
	}
	
	this.getHeaderHTML = function() {
		return '<p style="margin-top:0px; padding-top:0px;">' + makeLinkHTML({url:this.url, title:'View Link'}) + '</p>';
	}
	
	this.getAnnotationsItemLists = function() {
		var studentAccumulator = new StudentAccumulator();
		var queryAccumulator = new QueryAccumulator();
		var wordAccumulator = new WordAccumulator();
		var answerAccumulator = new AnswerAccumulator();
		//var linkAccumulator = new LinkAccumulator();
		var url = this.url;
				
		$.each(g_students, function (studentNickname,studentInfo) {
			var taskInfo = studentInfo.tasks[selectedTaskIdx()];
			$.each(taskInfo.searches, function (i,searchInfo) {
				var query = searchInfo.query;
				var matchesThisLink = false;
				var linksFollowed = searchInfo.links_followed;
				var numLinksFollowed = linksFollowed.length;
				var isHelpful = searchIsHelpful(searchInfo);
				for (var j=0; j<numLinksFollowed; j++) {
					var linkInfo = linksFollowed[j];
					if( linkInfo.url == url ) {
						matchesThisLink = true;
					}
				}

				if (matchesThisLink) {
					studentAccumulator.add(studentNickname, studentInfo.is_logged_in);
					queryAccumulator.add(query, studentNickname, isHelpful);
					$.each(getWordsForQuery(query), function(j,word) {
						wordAccumulator.add(word, query, studentNickname, isHelpful);
					});
					answerAccumulator.add(taskInfo.answer.text, studentNickname);
				}
			});
		});

		return [studentAccumulator.getItems(),
				queryAccumulator.getItems(),
				wordAccumulator.getItems(),
				answerAccumulator.getItems()];
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
    
//=================================================================================
// Charts
//=================================================================================

function createChart(chart_div, data, customOptions, defaultSelectAction) {
	if (g_chartApiLoaded) {
		// Need to recreate chart unless div has not been deleted/re-created
        g_chart = new google.visualization.ColumnChart(document.getElementById(chart_div));
        g_chartData = data;
        g_chartOptions = {
            'width' : '100%',
            'height': 200,
            'backgroundColor': '#dfddd5',
        };
        for (var attr in customOptions) {
        	g_chartOptions[attr] = customOptions[attr];
        }
        drawChart();
	
        if (defaultSelectAction) {
        	google.visualization.events.addListener(g_chart, 'select', function() {
            	var selection = g_chart.getSelection();
            	var item = selection[0];
            	if (item != undefined) {
           			var active = $('#task_activity').accordion("option", "active");
           			if (active===false || active != item.row) {
            			$('#task_activity').accordion("option", "active", item.row);
            		}
            	}
            	else {
           			$('#task_activity').accordion("option", "active", false);
            	}
        	});
        }
	}
	
	return g_chart;
}

function drawChart() {
	if (g_chart != null) {
		g_chart.draw(g_chartData, g_chartOptions);
	}
}

// TODO: Display multi-line custom tooltip; data.addColumn({type:'string', role:'tooltip}) did not work
// TODO: Reduce space between columns
function drawStudentChartArea(itemList) {		
	var data = new google.visualization.DataTable();
    data.addColumn('string', 'Bin');
    data.addColumn('number', 'Query');
    data.addColumn('number', 'Helpful Link');
    data.addColumn('number', 'Unhelpful Link');
    data.addColumn('number', 'Unrated Link');
    data.addColumn('number', 'Response');
    
    var maxCount = 0;
    var binnedData = binStudentChartData();		
    
    if (binnedData.length > 0) {
    	for (var i=0; i<binnedData.length; i++) {
			var count = binnedData[i].queryCount + binnedData[i].unratedCount + binnedData[i].helpfulCount + binnedData[i].unhelpfulCount + binnedData[i].answerCount;
			if (count > maxCount) maxCount = count;
			var binStart = ((binnedData[i].start.getTime()-g_minTaskTime.getTime())/1000)/60;
			var binTimeSpan = ((binnedData[i].end.getTime()-binnedData[i].start.getTime())/1000)/60;
			data.addRow(['Interval '+(i+1), binnedData[i].queryCount, binnedData[i].helpfulCount, binnedData[i].unhelpfulCount, binnedData[i].unratedCount, binnedData[i].answerCount]);
		}
		if (maxCount<10) maxCount = 10;
	
		var hAxisTitle = parseFloat(binTimeSpan.toFixed(1)) + ' min intervals';
		if (binTimeSpan >= 60*24) {
			var daySpan = binTimeSpan/(60*24);
			hAxisTitle = parseFloat(daySpan.toFixed(1)) + ' day intervals';
		}
		else if (binTimeSpan >= 60) {
			var hourSpan = binTimeSpan/60;
			hAxisTitle = parseFloat(hourSpan.toFixed(1)) + ' hour intervals';
		}
	
		var options = {
			'vAxis' : { title: '# actions', baseline: 0, maxValue: maxCount },
			'hAxis' : { title: hAxisTitle, textPosition: 'none' },
			'legend' : { position: 'top' },
			'colors' : [ g_actionColors['search'], g_actionColors['link_helpful'], g_actionColors['link_unhelpful'], g_actionColors['link'], g_actionColors['answer'] ],
			'isStacked' : true,
			'backgroundColor': { fill: 'transparent' }
		};
	    
		var chart = createChart('summary_chart', data, options, false);
    }
}

function binStudentChartData() {
	var minBinCount = 25;
	var maxBinCount = 50;
	var minBinInterval = 1*1000*60; // ms

	var studentNames = Object.keys(g_students);
	var taskNum = selectedTaskIdx()+1;

    // first time, find min/max timestamps for selected task by looping through data
	// other times, min/max timestamps updated via functions that handle incoming socket messages
	if (g_minTaskTime==null) {
		$.each(studentNames, function(i, studentNickname) {
			var student = g_students[studentNickname];
			var taskHistory = student.task_history[taskNum-1];
		    for (var j=0; j<taskHistory.length; j++) {
		        var task = taskHistory[j];
		        var taskTime = getLocalTime(new Date(task.timestamp));
		        if (!g_minTaskTime) {
		            g_minTaskTime = taskTime;
		            g_maxTaskTime = taskTime;
		        }
		        else {
		            if (taskTime < g_minTaskTime) g_minTaskTime = taskTime;
		            if (taskTime > g_maxTaskTime) g_maxTaskTime = taskTime;
		        }
		    }
		});
	}	
		
	var binnedData = [];
	if (g_minTaskTime!=null) {
		var minTaskTime = g_minTaskTime;
		var maxTaskTime = g_maxTaskTime;

		var timeSpan = maxTaskTime.getTime()-minTaskTime.getTime();
		var binCount = Math.ceil(timeSpan/minBinInterval);
		if (binCount < minBinCount) {
			binCount = minBinCount;
			maxTaskTime = new Date(minTaskTime.getTime()+(minBinCount*minBinInterval));
		}
		else if (binCount > maxBinCount) {
			binCount = maxBinCount;
		}
		var binTimeSpan = (maxTaskTime.getTime()-minTaskTime.getTime())/binCount;
	
		// initialize bin data
		for (var i=1; i<=binCount; i++) {
			var binStart = new Date(minTaskTime.getTime()+((i-1)*binTimeSpan));
			var binEnd = new Date(binStart.getTime()+binTimeSpan);
			binnedData.push({ start:binStart, end:binEnd, queryCount:0, helpfulCount:0, unhelpfulCount:0, unratedCount:0, answerCount:0 })
		}
	
		$.each(studentNames, function(i, studentNickname) {
			var student = g_students[studentNickname];
			var taskHistory = student.task_history[taskNum-1];
			for (var j=0; j<taskHistory.length; j++) {
				var task = taskHistory[j];
				var taskType = task.activity_type;
				var skip = (j<taskHistory.length-1) && (taskType=='link') && (taskHistory[j+1].activity_type=='link_rating');
				if (skip) continue;
    		
				var taskTime = getLocalTime(new Date(task.timestamp)).getTime();
				var binIndex = Math.ceil((taskTime-minTaskTime.getTime())/binTimeSpan);
				if (binIndex<1) binIndex = 1;
				if (binIndex>binCount) binIndex = binCount;
			
				if (taskType=='search') {
					binnedData[binIndex-1].queryCount++;
				}
				else if (taskType=='link') {
					binnedData[binIndex-1].unratedCount++;
				}
				else if (taskType=='link_rating') {             
					if (task.is_helpful) binnedData[binIndex-1].helpfulCount++;
					else binnedData[binIndex-1].unhelpfulCount++;    
				}
				else if (taskType=='answer') {
					binnedData[binIndex-1].answerCount++;
				}
			}
		});
	}
	
	return binnedData;
}

function getStudentChartData(itemList) {
	var data = new google.visualization.DataTable();
    data.addColumn('string', 'Student');
    data.addColumn('number', 'Queries');   
    data.addColumn('number', 'Queries');
	$.each(itemList.items, function(i, item) {
		var queryItemList = item.getAnnotationsItemLists()[0];
		var count1 = item.isLoggedIn ? queryItemList.items.length : 0;
		var count2 = item.isLoggedIn ? 0 : queryItemList.items.length;
		data.addRow([item.studentNickname, count1, count2]);
	});
    return data;
}

function drawQueryChartArea(itemList) {
	var data = getQueryChartData(itemList);
	var options = {
			'vAxis' : { title: '# students', baseline: 0 },
			'legend' : { position: 'top' },
			'colors' : [ g_actionColors['link_helpful'], g_actionColors['link_unhelpful'], g_actionColors['link'] ],
			'isStacked' : true
	};
	var chart = createChart('summary_chart', data, options, true);
}

function getQueryChartData(itemList) {
	var data = new google.visualization.DataTable();
    data.addColumn('string', 'Query');
    data.addColumn('number', 'Helpful Link');
    data.addColumn('number', 'Unhelpful Link');    
    data.addColumn('number', 'Unrated Link');
    $.each(itemList.items, function(i, item) {
		data.addRow([item.query, item.ratings.helpful, item.ratings.unhelpful, item.count-item.ratings.helpful-item.ratings.unhelpful]);
	});
    return data;
}

function drawWordChartArea(itemList) {
	var data = getWordChartData(itemList);
	var options = {
			'vAxis' : { title: '# students', baseline: 0 },
			'legend' : { position: 'top' },
			'colors' : [ g_actionColors['link_helpful'], g_actionColors['link_unhelpful'], g_actionColors['link'] ],
			'isStacked' : true
	};
	var chart = createChart('summary_chart', data, options, true);
}

function getWordChartData(itemList) {
	var data = new google.visualization.DataTable();
    data.addColumn('string', 'Words');
    data.addColumn('number', 'Helpful Link');
    data.addColumn('number', 'Unhelpful Link');    
    data.addColumn('number', 'Unrated Link');
    $.each(itemList.items, function(i, item) {
		data.addRow([item.wordsStr, item.ratings.helpful, item.ratings.unhelpful, item.count-item.ratings.helpful-item.ratings.unhelpful]);
	});
    return data;
}

function drawLinkChartArea(itemList) {
	var data = getLinkChartData(itemList);
	var options = {
			'vAxis' : { title: '# students', baseline: 0 },
			'legend' : { position: 'top' },
			'colors' : [ g_actionColors['link_helpful'], g_actionColors['link_unhelpful'], g_actionColors['link'] ],
			'isStacked' : true
	};
	var chart = createChart('summary_chart', data, options, true);
}

function getLinkChartData(itemList) {
	var data = new google.visualization.DataTable();
    data.addColumn('string', 'Link');
    data.addColumn('number', 'Helpful Link');
    data.addColumn('number', 'Unhelpful Link');    
    data.addColumn('number', 'Unrated Link'); 
	$.each(itemList.items, function(i, item) {
		data.addRow([item.title, item.ratings.helpful, item.ratings.unhelpful, item.count-item.ratings.helpful-item.ratings.unhelpful]);
	});
    return data;
}

function drawAnswerChartArea(itemList) {
	var data = getAnswerChartData(itemList);
	var options = {
			'vAxis' : { title: '# students', baseline: 0 },
			'legend' : { position: 'none' },
			'colors' : [ g_actionColors['link'] ],
	};
	var chart = createChart('summary_chart', data, options, true);
}

function getAnswerChartData(itemList) {
	var data = new google.visualization.DataTable();
    data.addColumn('string', 'Response');
    data.addColumn('number', 'Total'); 
	$.each(itemList.items, function(i, item) {
		data.addRow([item.answerText, item.count]);
	});
    return data;
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
	var showOptions = { label:'Queries: ', options:options };
	
	drawCloud("tag_cloud", itemList, function(i, item) {
		var link = item.query;
		var url = '#';
		var weight = g_cloudShowOption == 'link_helpful' ? item.ratings.helpful : (g_cloudShowOption == 'link_unhelpful' ? item.ratings.unhelpful : item.count-item.ratings.helpful-item.ratings.unhelpful);
		return {link:link, url:url, weight:weight};
	}, { show:showOptions, color:{start:g_actionColors[g_cloudShowOption], end:g_actionColors[g_cloudShowOption]}, className:'noLink' });
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
	var cloudHtml = '';
	var maxWeight = 1;
	$.each(itemList.items, function(i, item) {
		var data = getCloudDataFunc(i, item);
		if (data.weight>0) {
			var link = data.link.length<=MAX_TAG_LENGTH ? data.link : data.link.substring(0,MAX_TAG_LENGTH)+"&hellip;";
			link = link.replace("<", "&lt;").replace(">", "&gt;");
			cloudHtml += '<a'+((options!=undefined && options.className!=undefined)?' class="'+options.className+'"':'')+' href="'+data.url+'" rel="'+data.weight+'" title="'+data.link+'">'+link+'</a>\n';
			if (data.weight>maxWeight) maxWeight = data.weight;
		}
	});
	if (cloudHtml == '') {
		cloudHtml = '<span class="small">(none)</span>';
	}
	
	// if items, show cloud options + html
	if (itemList.items.length>0) {
		var html = '';
		if (options!=undefined && options.show!=undefined && options.show.options.length>0) {
			html += '<div class="cloud_options display_options">'+options.show.label+options.show.options.join(' ')+'</div>';
		}
		html += '<div class="cloud"><p>'+cloudHtml+'</p></div>';
		
		var minFont = 10;
		var maxFont = 26;
		if (maxWeight<=2) {
			maxFont = 16;
		}
		
		var startColor = options!=undefined && options.color!=undefined && options.color.start!=undefined ? options.color.start : g_actionColors['link'];
		var endColor = options!=undefined && options.color!=undefined && options.color.end!=undefined ? options.color.end : g_actionColors['link'];
		
		$("#"+divName).html(html);
		$("#"+divName+" a").tagcloud({
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
	var isSelected = value==g_cloudShowOption;
	if (isSelected) {
		return '<strong>'+label+'</strong>';
	}
	else {
		return '<a href="#" onclick="'+funcName+'(g_itemList,\''+value+'\'); return false;">'+label+'</a>';
	}
}

function openAccordion(index) {
	$('#task_activity').accordion({active:index});
}

//=================================================================================
// Student Histories
//=================================================================================

function drawStudentHistories(itemList) {
    $.each(itemList.items, function(idx, item) {
    	drawStudentHistory($('#student'+(idx+1)+'_history'), item.studentNickname); 
    	listStudentHistory($('#student'+(idx+1)+'_history_list'), item.studentNickname);
    });
}

function drawStudentHistory(div, studentNickname) {
	var actionMargin = 1; // pixels
	var historyHeight = 20; // pixels
	var historyWidth = Math.ceil($('#task_activity').width() * 0.35); // pixels
	var ellipsesWidth = 15; // pixels
	var largeGap = 15 * 60 * 1000; // 15 min (in ms)
	var topMargin = Math.floor((historyHeight/2)-(g_actionDim/2));
    var maxNumActionsToDraw = Math.floor((historyWidth-ellipsesWidth)/(g_actionDim+actionMargin))-2;

    $('.student_history').width(historyWidth);
    
    var task = selectedTaskIdx()+1;
 	var searchHistoryHtml = [];
    var student = g_students[studentNickname];
	var taskHistory = student.task_history[task-1];
	var numTasksDrawn = 0;
 	for (var i=0; i<taskHistory.length; i++) {
 		var actionHtml = '';
 		var action = taskHistory[i];
 		var type = action.activity_type;

		// if rating, change color of previous visit to link
	 	// do not draw separate task box for ratings
 		if (type=='link_rating') {
 			var linkIndex = getIndexOfLink(taskHistory, action.link, i);
 			if (linkIndex != -1) {
 				var newColor = g_actionColors[action.is_helpful?'link_helpful':'link_unhelpful'];
 				var newTitle = action.is_helpful ? 'Helpful Link' : 'Unhelpful Link';
 				newTitle += ': '+(action.link_title!=null ? action.link_title+' ('+action.link+')' : action.link);
 			
				var linkHtml = '';
				if (searchHistoryHtml[linkIndex].indexOf('"largegap"') != -1) {
					linkHtml += '<div class="largegap" style="width:1px;height:20px !important;background:grey;float:left;margin-right:'+actionMargin+'px;"></div>';;
				}
				linkHtml += '<div id="event_"'+(linkIndex+1)+' title="'+newTitle+'" style="width:'+g_actionDim+'px;height:'+g_actionDim+'px !important;background:'+newColor+';float:left;margin-right:'+actionMargin+'px;margin-top:'+topMargin+'px;">&nbsp;</div>';

 				searchHistoryHtml.push(''); // empty place holder for link rating event so array indices are correct
				searchHistoryHtml[linkIndex] = linkHtml;
				continue;
 			}
 		}
 		
     	if (i>0) {
 			var taskTime = getLocalTime(new Date(action.timestamp));
 			var prevTaskTime = getLocalTime(new Date(taskHistory[i-1].timestamp));
 			var isLargeGap = (taskTime.getTime()-prevTaskTime.getTime())>=largeGap;
     		if (isLargeGap) {
 				actionHtml += '<div class="largegap" style="width:1px;height:20px !important;background:grey;float:left;margin-right:'+actionMargin+'px;"></div>';
 			}
 		}
 		
 		var title = '';
 		if (type=='search') {
 			title = 'Query: '+action.search;
 		}
 		else if (type=='link') {
 			title = "Unrated Link: "+action.link_title+' ('+action.link+')';
 		}
 		else if (type=='link_rating') {
 			// only gets here if previous visit to link not found (i.e., link rated w/o link visit getting recorded)
 			type = action.is_helpful ? 'link_helpful' : 'link_unhelpful';
			title = action.is_helpful ? 'Helpful Link' : 'Unhelpful Link';
			title += ': '+(action.link_title!=null ? action.link_title+' ('+action.link+')' : action.link);
 		}
 		else if (type=='answer') {
 		    title = "Response: "+action.answer_text;
 		    if (action.answer_explanation) title += ' ('+action.answer_explanation+')';
	    }
 		
 		actionHtml += '<div id="event_"'+(i+1)+' title="'+title+'" style="width:'+g_actionDim+'px;height:'+g_actionDim+'px !important;background:'+g_actionColors[type]+';float:left;margin-right:'+actionMargin+'px;margin-top:'+topMargin+'px;">&nbsp;</div>';
 		searchHistoryHtml.push(actionHtml);
 	}
 	
 	// show up to maxNumActionsToDraw of most recent tasks
    // and show ellipses (...) at beginning if more than maxNumActionsToDraw
    var numActionsToRemove = 0;
 	if (searchHistoryHtml.length > maxNumActionsToDraw) {
 		numActionsToRemove = searchHistoryHtml.length - maxNumActionsToDraw;
 	}

 	for (var i=0; i<numActionsToRemove; i++) {
 		searchHistoryHtml.shift();
 	}
 	
 	var html = searchHistoryHtml.join('');
 	if (numActionsToRemove > 0) {
 		html = '<div style="width:'+ellipsesWidth+'px;height:'+g_actionDim+'px !important;float:left;">...</div>' + html;
 	}
 	else {
 		html = '<div style="width:'+ellipsesWidth+'px;height:'+g_actionDim+'px !important;float:left">&nbsp;</div>' + html;
 	}
 	
 	if (div==null) {
 		var sectionIndex = getStudentSection(studentNickname);
 		div = $('#student'+(sectionIndex+1)+'_history');
 	}
 	div.html(html);
}

function getIndexOfLink(items, url, pos) {
 	var index = -1;
	for (var i=pos; i>=0; i--) {
 		var item = items[i];
 		if (item.activity_type=='link' && item.link==url) {
 			index = i;
 			break;
 		}
 	}
	return index;
}

function listStudentHistory(div, studentNickname) { 
    var task = selectedTaskIdx()+1;
    var student = g_students[studentNickname];
	var taskHistory = student.task_history[task-1];
	var html = '';
	// old on top
 	//for (var i=0; i<taskHistory.length; i++) {
	// new on top
 	for (var i=taskHistory.length-1; i>=0; i--) {
 		var taskItem = taskHistory[i];
 		var taskTime = getLocalTime(new Date(taskItem.timestamp));
 		var taskType = taskItem.activity_type;
		if (taskType=='link_rating') {
			if (taskItem.is_helpful) taskType='link_helpful';
			else taskType='link_unhelpful';
		}
 		
// 		var skip = (i<taskHistory.length-1) && (taskType=='link') && (taskHistory[i+1].activity_type=='link_rating') && (taskItem.link==taskHistory[i+1].link);
//     	if (skip) continue;
 		
 		var type = '';
 		var details = '';
 		if (taskType=='search') {
 			type = 'Query';
 			details = taskItem.search;
 		}
 		else if (taskType=='link') {
 			type = "Link";
 			details = taskItem.link_title+'<br/>';
 		    details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
 		}
 		else if (taskType=='link_helpful') {
 		    type = "Rated Helpful";
 			details = '';
 			if (taskItem.link_title!=null) {
 				details = taskItem.link_title+'<br/>';
 			}
 			else if (taskHistory[i-1]!=undefined && taskHistory[i-1].link!=null && taskHistory[i-1].link==taskItem.link) {
 				details = taskHistory[i-1].link_title+'<br/>';
 			}
 			details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
 	    }
 		else if (taskType=='link_unhelpful') {
 		    type = "Rated Unhelpful";
 			details = '';
 			if (taskItem.link_title!=null) {
 				details = taskItem.link_title+'<br/>';
 			}
 			else if (taskHistory[i-1]!=undefined && taskHistory[i-1].link!=null && taskHistory[i-1].link==taskItem.link) {
 				details = taskHistory[i-1].link_title+'<br/>';
 			}
 			details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
 	    }
 		else if (taskType=='answer') {
 		    type = "Response";
 		    details = taskItem.answer_text;
 		    if (taskItem.answer_explanation) details += '<br/><em>'+taskItem.answer_explanation+'</em>';
	    }
 		
 		html += '<tr>';
 		html += '<td style="width:17ex">' + '<div style="width:'+g_actionDim+'px;height:'+g_actionDim+'px !important;background:'+g_actionColors[taskType]+'; float:left; margin-right:4px; margin-top:7px;">&nbsp;</div> ' + type.replace(" ", "&nbsp;") + '</td>';
 		html += '<td>' + details + '</td>';
 		html += '<td style="width:15ex">' + getFormattedTimestamp(taskTime) + '</td>';
 		html += '</tr>';
 	}

 	if (html != '') {
		html = '<table class="search_history">'+html+'</table>';
 	}
 	else {
 		html = '(none)';
 	}
 	
 	if (div==null) {
 		var sectionIndex = getStudentSection(studentNickname);
 		div = $('#student'+(sectionIndex+1)+'_history_list');
 	}
 	
 	html = '<h5>Search History</h5>\n' + html;
 	div.html(html);
}

function listCompleteStudentHistories() { 
	var html = '';
	var task = selectedTaskIdx()+1;
	var taskHistory = g_complete_histories[task-1];
	// old on top
 	//for (var i=0; i<taskHistory.length; i++) {
	// new on top
 	for (var i=taskHistory.length-1; i>=0; i--) {
 		var taskItem = taskHistory[i];
 		var taskTime = getLocalTime(new Date(taskItem.timestamp));
 		var taskType = taskItem.activity_type;
		if (taskType=='link_rating') {
			if (taskItem.is_helpful) taskType='link_helpful';
			else taskType='link_unhelpful';
		}
 		
 		var type = '';
 		var details = '';
 		if (taskType=='search') {
 			type = 'Query';
 			details = taskItem.search;
 		}
 		else if (taskType=='link') {
 			type = "Link";
 			details = taskItem.link_title+'<br/>';
 		    details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
 		}
 		else if (taskType=='link_helpful') {
 		    type = "Rated Helpful";
 			details = '';
 			if (taskItem.link_title!=null) {
 				details = taskItem.link_title+'<br/>';
 			}
 			else if (taskHistory[i-1]!=undefined && taskHistory[i-1].link!=null && taskHistory[i-1].link==taskItem.link) {
 				details = taskHistory[i-1].link_title+'<br/>';
 			}
 			details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
 	    }
 		else if (taskType=='link_unhelpful') {
 		    type = "Rated Unhelpful";
 			details = '';
 			if (taskItem.link_title!=null) {
 				details = taskItem.link_title+'<br/>';
 			}
 			else if (taskHistory[i-1]!=undefined && taskHistory[i-1].link!=null && taskHistory[i-1].link==taskItem.link) {
 				details = taskHistory[i-1].link_title+'<br/>';
 			}
 			details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
 	    }
 		else if (taskType=='answer') {
 		    type = "Response";
 		    details = taskItem.answer_text;
 		    if (taskItem.answer_explanation) details += '<br/><em>'+taskItem.answer_explanation+'</em>';
	    }
 		
 		html += '<tr>';
 		html += '<td style="width:17ex">' + '<div style="width:'+g_actionDim+'px;height:'+g_actionDim+'px !important;background:'+g_actionColors[taskType]+'; float:left; margin-right:4px; margin-top:7px;">&nbsp;</div> ' + type.replace(" ", "&nbsp;") + '</td>';
 		html += '<td>' + details + '</td>';
 		html += '<td style="width:13ex">'+taskItem.student_nickname+'</td>';
 		html += '<td style="width:15ex">' + getFormattedTimestamp(taskTime) + '</td>';
 		html += '</tr>';
 	}

    if (html != '') {
    	var rowHtml = html;
		html = '<table class="search_history">';
 		html += '<tr>';
 		html += '<td style="width:17ex"><h6>Task</h6></td>';
 		html += '<td>&nbsp;</td>';
 		html += '<td style="width:13ex"><h6>Student</h6></td>';
 		html += '<td style="width:15ex"><h6>Time</h6></td>';
 		html += '</tr>';
		html += rowHtml;
		html += '</table>';
 	}
 	else {
 		html = '(none)';
 	}
    
 	$('#complete_history').html(html);
}

function getStudentSection(studentNickname) {
	var section = -1;
	$.each($('.nickname'), function(i,child) {
		var span = $(child);
		if (span.html() == studentNickname) {
			section = i;
			return false;
		}
	});
	return section;
}

// bin data into bins of x minutes, where x = binInterval
function binData(data, binInterval) {
	var binnedData = [];
	var binCounts = [];
	var minTime = null;
	var maxTime = null;	
		
	for (var i=0; i<data.length; i++) {
		var dataType = data[i].activity_type;
		var skip = (i<data.length-1) && (dataType=='link') && (data[i+1].activity_type=='link_rating');
		if (skip) continue;
		
		if (dataType=='link_rating') {
			if (data[i].is_helpful) dataType='link_helpful';
			else dataType='link_unhelpful';
		}
		var dataTime = getLocalTime(new Date(data[i].timestamp));
		if (minTime==null) {
			minTime = dataTime;
			maxTime = new Date(minTime.getTime()+(binInterval*60*1000));	
		}

		if (dataTime >= maxTime) {
			// save previous bin
			if (Object.keys(binCounts).length>0) {
				for (var binType in binCounts) {
					binnedData.push({activity_type:binType, timestamp:minTime, count:binCounts[binType]});
				}
			}

			// initialize bin
			binCounts = [];
			var minTime = dataTime;
			var maxTime = new Date(minTime.getTime()+(binInterval*60*1000));	
		}
	
		// increment bin counts
		if (binCounts[dataType] == undefined) binCounts[dataType] = 1;
		else binCounts[dataType]++;
	}
	
	// save last bin
	if (Object.keys(binCounts).length>0) {
		for (var binType in binCounts) {
			binnedData.push({activity_type:binType, timestamp:minTime, count:binCounts[binType]});
		}
	}
	
	return binnedData;
}

//=================================================================================
// Language and Stemming
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
// Helpers
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
