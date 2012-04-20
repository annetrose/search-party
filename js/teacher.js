/*
# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

function initializeTeacher() {
	window.status = "Loading...";
	openChannel();
	initUI();
	window.status = "Loaded";
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
	updateTaskDescription(taskIdx);
	updateUI();
}

function handle_update_log_in(student_nickname, task_idx) {
	var student_info = g_students[student_nickname];
	if( student_info==undefined ) {
		student_info = {};
		student_info.logged_in = true;
		student_info.task_idx = task_idx;		
		var task_history = [];
		student_info.task_history = task_history;
		var tasks_list = [];
		student_info.tasks = tasks_list;
		var numTasks = numberOfTasks();
		for(var i=0; i<numTasks; i++) {
			task_history.push([]);
			tasks_list.push({"searches":[], answer:{text:"", explanation:""}});
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
	var student_info = g_students[student_nickname];
	student_info.logged_in = false;
	student_info.task_idx = null;
	updateUI();
}

function handle_update_task(student_nickname, task_idx) {
	g_students[student_nickname].task_idx = task_idx;
	updateUI();
}

function handle_update_query(student_nickname, task_idx, query, timestamp) {
	g_students[student_nickname].task_history[task_idx].push({activity_type:"search", search:query, link:null, link_title:null, is_helpful:null, answer_text:null, answer_explanation:null, timestamp:timestamp});
	g_students[student_nickname].tasks[task_idx].searches.push({"query":query, "links_followed":[]});
	updateUI();
}

function handle_update_link_followed(student_nickname, task_idx, query, url, title, timestamp) {
	g_students[student_nickname].task_history[task_idx].push({activity_type:"link", search:query, link:url, link_title:title, is_helpful:null, answer_text:null, answer_explanation:null, timestamp:timestamp});
	var searches = g_students[student_nickname].tasks[task_idx].searches;
	var num_searches = searches.length;
	var search_info = null;
	for(var i=(num_searches-1); i>=0; i--) {
		var _search_info = searches[i];
		if(_search_info.query==query) {
			search_info = _search_info;
			break;
		}
	}
	if( search_info==null ) {
		search_info = {"query":query, "links_followed":[]};
		searches.push(search_info);
	}
	search_info.links_followed.push({"url":url, "title":title});
	updateUI();
}

function handle_update_link_rated(student_nickname, task_idx, url, is_helpful, timestamp) {	
	g_students[student_nickname].task_history[task_idx].push({activity_type:"link_rating", search:null, link:url, link_title:null, is_helpful:is_helpful, answer_text:null, answer_explanation:null, timestamp:timestamp});
	var searches = g_students[student_nickname].tasks[task_idx].searches;
	var num_searches = searches.length;
	for(var i=0; i<num_searches; i++) {
		var search_info = searches[i];
		var links_followed = search_info.links_followed;
		var num_links = links_followed.length;
		for(var j=0; j<num_links; j++) {
			var link_info = links_followed[j];
			var link_url = link_info.url;
			if(link_url==url) {
				link_info.is_helpful = is_helpful;
			}
		}
	}
	updateUI();
}

function handle_update_answer(student_nickname, task_idx, text, explanation, timestamp) {
	g_students[student_nickname].task_history[task_idx].push({activity_type:"answer", search:null, link:null, link_title:null, is_helpful:null, answer_text:answer, answer_explanation:null, timestamp:timestamp});
	var answer_info = g_students[student_nickname].tasks[task_idx].answer;
	answer_info.text = text;
	answer_info.explanation = explanation;
	updateUI();
}

//=================================================================================
// Update UI
//=================================================================================

var g_activeSessionIndex = false;
var g_activeSessionName = null;
var g_chartApiLoaded = false;

function initUI() {    
    var lesson = g_lessons[0];
    var lesson_code = lesson.lesson_code;
    $('#lesson_title').html(lesson.title);
    $('#lesson_code').html(lesson_code);
    $('#task_chooser').selectbox();
    updateTaskDescription(0);  
    
    var utc_offset_minutes = (new Date()).getTimezoneOffset();
	var html = '';
	html += '<button class="cssbtn" id="stop_lesson_btn_'+lesson_code+'" style="display:none" onclick="stopLesson(\''+lesson_code+'\')">Stop activity</button>';
	html += '<button class="cssbtn" id="start_lesson_btn_'+lesson_code+'" style="display:none" onclick="startLesson(\''+lesson_code+'\')">Start activity</button>';
	html += '<br/>';
    //html += '<button class="cssbtn" id="edit_lesson_btn_'+lesson_code+'" onclick="editLesson(\''+lesson_code+'\')">Edit lesson</button><br/>';
    html += '<button class="cssbtn" id="download_data_btn_'+lesson_code+'" onclick="window.location=\'/data_dump?lesson_code='+lesson_code+'&utc_offset_minutes=' + utc_offset_minutes + '\'; return false;">Download data</button><br/>' 
    html += '<button class="cssbtn" id="clear_lesson_btn_'+lesson_code+'" onclick="clearLesson(\''+lesson_code+'\', false)">Clear data</button><br/>';
    html += '<button class="cssbtn" id="delete_lesson_btn_'+lesson_code+'" onclick="deleteLesson(\''+lesson_code+'\')">Delete activity</button>';
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
	if ($(".data_display_item.selected").size() == 0) {
		$("#data_display_content").html("");
		switch( g_currentPaneName ) {
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
		
		if (g_activeSessionName) {
			g_activeSessionIndex = $(".accordion_section").index($('#'+g_activeSessionName));
		}
		
	    $('#task_activity').accordion({
	    	collapsible: true, 
	    	active: g_activeSessionIndex,
	    	change: function(event, control) {
	    		g_activeSessionIndex = control.options.active;
	    		var activeSection = $(".accordion_section:eq("+g_activeSessionIndex+")");
	    		g_activeSessionName = activeSection.attr("id");
	    	}
	    });
		g_updatesAreWaiting = false;
	}
	else {
		g_updatesAreWaiting = true;
	}
}

function initPaneAndUpdateUI() {
	g_activeSessionIndex = false;
	g_activeSessionName = null;
	updateUI();
}

function updateSideBarInfo() {
	var numStudents = calculateNumStudents();
	$("#num_students").html(numStudents);
}

function updateStudents() {
	var accumulator = new StudentAccumulator();
	// TODO / FIX: Returning duplicate student names (2x number expected); not sure why
	//var studentNames = keysOfObject(g_students);
	var studentNames = Object.keys(g_students);
	$.each(studentNames, function(i, studentNickname) {
		var isLoggedIn = g_students[studentNickname].logged_in;
		accumulator.add(studentNickname, isLoggedIn);
	});
		
	accumulator.setSort(g_currentPaneSort);
	var itemList = accumulator.getItems();
	updateAnyWithItems(itemList);
	if (itemList.hasItems()) {
		updateSort("student", accumulator);
		drawStudentChartArea(itemList);
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
		updateSort("query", accumulator);
		drawQueryChartArea(itemList);
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
		updateSort("word", accumulator);
		drawWordChartArea(itemList);
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
		updateSort("link", accumulator);
		drawLinkChartArea(itemList);
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
		updateSort("answer", accumulator);
		drawAnswerChartArea(itemList);
	}
}

function updateAnyWithItems(itemList) {
	var dataItems = itemList.items;
	$("#data_display_content").html(itemList.asHTML());
	$("#data_display_content .data_display_item").each( function(idx,displayItem) {
		var data = {
			item: dataItems[idx],
			idx: idx,
			displayItem: displayItem
		};
	});
}

function updateSort(type, accumulator) {
	var options = accumulator.sortOptions;
	var html = '';
	for (i in options) {
		if (html == '') html += 'Sort by: ';
		if (options[i] == accumulator.getSort()) {
			html += options[i] + ' ';
		}
		else {
			html += '<a href="#" onclick="g_currentPaneSort=\''+options[i]+'\'; updateUI(); return false;">'+options[i]+'</a> ';
		}
	}
	$('#'+type+'_sort').html(html);
}

//=================================================================================
// UI Pane
//=================================================================================

var g_currentPaneName = null;
var g_currentPaneSort = null;

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
		for(var searchIdx in searches) {
			var search = searches[searchIdx];
			var query = search.query;
			queries.push(query);
			var wordsInQuery = query.trim().split(/\s+/);
			for(var wordIdx in wordsInQuery) {
				var word = wordsInQuery[wordIdx];
				if(!isStopWord(word)) {
					words.push(word);
				}
			}
			var linksFollowed = search.links_followed;
			for(var linkIdx in linksFollowed) {
				links.push(linksFollowed[linkIdx].url);
			}
		}
		var answerTrimmed = taskInfo.answer.text.trim();
		if(answerTrimmed.length > 0) {
			answers.push(answerTrimmed);
		}
	}
	numQueries = countUnique(queries);
	numWords = countUnique(words);
	numLinks = countUnique(links);
	numAnswers = countUnique(answers);

	document.getElementById(loadButtonId("students")).innerHTML = "Students (" + numStudents + ")";
	document.getElementById(loadButtonId("queries" )).innerHTML = "Queries ("  + numQueries + ")";
	document.getElementById(loadButtonId("words"   )).innerHTML = "Words ("    + numWords + ")";
	document.getElementById(loadButtonId("links"   )).innerHTML = "Links ("    + numLinks + ")";
	document.getElementById(loadButtonId("answers" )).innerHTML = "Answers ("  + numAnswers + ")";

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
			$.each(items, function(idx,dataItem) {
				if (dataItem.getKey) {
					html += '<div id="'+dataItem.getKey()+'" class="accordion_section"><a href="#">' + dataItem.asHTML() + '</a></div>';						
				}
				else {
					html += '<div><a href="#">' + dataItem.asHTML() + '</a></div>';
				}
				html += '<div>';
				if (dataItem.getHeaderHTML) {
					html += dataItem.getHeaderHTML();
				}
				$.each(this.getAnnotationsItemLists(), function(i,itemList) {
					html += itemList.asExpandedHTML();
				});
				html += '</div>';
			});
			html += '</div>';
		}
		return html;
	};
	
	this.asHTML = function() {
		var html = '<h3 style="margin-bottom:10px">' + escapeForHtml(this.title) + '</h3>';
		html += '<div id="'+this.type+'_chart"></div>';
		html += '<div id="'+this.type+'_sort" style="margin-top:5px; font-size:9pt; width:100%;"></div>';
		html += this.itemsAsHTML();
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

	this.sortOptions = ["Login Status", "ABC"];
	this._sortBy = "Login Status";
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
		return '<span class="' + className + '">' + escapeForHtml(this.studentNickname) + '</span>';
	}
	
	this.asExpandedHTML = function() {
		return this.asHTML();
	}
}

function QueryAccumulator() {
	this.add = function(query, studentNickname, isHelpful) {
		var uniquenessKey = studentNickname + "::" + query;
		var uniquenessDict = this._uniquenessDict;
		if(this._uniquenessDict[uniquenessKey]===undefined) {
			this._uniquenessDict[uniquenessKey] = true;
			var occurrenceDict = this._occurrenceDict;
			var occurrenceKey = query.toLowerCase();
			var counterItem = occurrenceDict[occurrenceKey];
			if (counterItem===undefined) {
				var ratings = new RatingCounter();
				ratings.increment(isHelpful);
				counterItem = new QueryDataItem(query, [studentNickname], 1, ratings);
				occurrenceDict[occurrenceKey] = counterItem;
			}
			else {
				counterItem.count += 1;
				counterItem.studentNicknames.push(studentNickname);
				counterItem.ratings.increment(isHelpful);
			}
		}
	};

	this.getItems = function() {
		var items = valuesOfObject(this._occurrenceDict);
		// Sorts by DESCENDING FREQUENCY
		if (this._sortBy == "Frequency") {
			sortInPlaceByCountDescending(items, "query");
		}
		// Sort alphabetically
		else {
			sortInPlaceAlphabetically(items, 'query');
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
	this._occurrenceDict = {};
	this._uniquenessDict = {};
}

function QueryDataItem(query, studentNicknames, count, ratings) {
	this._super = DataItem;
	this._super("query", query, count, "query_data_item");

	this.query = query;
	this.studentNicknames = studentNicknames;
	this.ratings = ratings;
	
	this.getKey = function() {
		return this.query.replace('"','&quot;');
	}
	
	this.asHTML = function() {
		return escapeForHtml(this.query) + ' '+ this.ratings.asHTML();
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
		$.each(g_students, function (studentNickname,studentInfo) {
			var taskInfo = studentInfo.tasks[selectedTaskIdx()];
			$.each(taskInfo.searches, function (i,searchInfo) {
				if( searchInfo.query==query ) {
					studentAccumulator.add(studentNickname, studentInfo.is_logged_in);
					var isHelpful = searchIsHelpful(searchInfo);
					$.each(searchInfo.links_followed, function (j,linkInfo) {
						linkAccumulator.add(linkInfo.url, linkInfo.title, linkInfo.is_helpful, query, studentNickname);
					});
					$.each(getWordsForQuery(query), function (j,word) {
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

function WordAccumulator() {
	this.add = function(word, query, studentNickname, isHelpful) {
		var stem = getWordStem(word).toLowerCase();
		var uniquenessKey = stem + "::" + query.toLowerCase() + "::" + studentNickname;
		var uniquenessDict = this._uniquenessDict;
		if(this._uniquenessDict[uniquenessKey]===undefined) {
			this._uniquenessDict[uniquenessKey] = true;
			var occurrenceKey = stem;
			var counterItem = this._occurrenceDict[occurrenceKey];
			if (counterItem===undefined) {
				var wordsDict = {};
				wordsDict[word] = 1;
				var ratings = new RatingCounter();
				ratings.increment(isHelpful);
				this._occurrenceDict[occurrenceKey] = counterItem = {
					wordsDict : wordsDict,
					stem  : stem,
					queries : [query],
					studentNicknames : [studentNickname],
					ratings : ratings,
					count : 1
				};
			}
			else {
				counterItem.count += 1;
				counterItem.wordsDict[word] = (counterItem.wordsDict[word] || 0) + 1;
				counterItem.studentNicknames.push(studentNickname);
				counterItem.queries.push(query);
				counterItem.ratings.increment(isHelpful);
			}
		}
	};

	this.getItems = function() {
		var items = valuesOfObject(this._occurrenceDict);
		// Sorts by DESCENDING FREQUENCY
		if (this._sortBy == "Frequency") {
			sortInPlaceByCountDescending(items, "stem");
		}
		// Sort alphabetically
		else {
			sortInPlaceAlphabetically(items, 'stem');
		}
		
		items = $.map(items, function (item, i) {
			var wordsDict = item.wordsDict;
			var allWordsSortedByFrequency = keysOfObjectSortedByValueDescending(wordsDict)
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
	this.asHTML = function() {
		return this.title + " " + this.ratings.asHTML();
	};
	
	this.getKey = function() {
		return this.url.replace('"','&quot;');
	}
	
	this.asExpandedHTML = function() {
		return makeLinkHTML({url:this.url, title:this.title}, 30) + " " + this.ratings.asHTML();
	}
	
	this.getHeaderHTML = function() {
		return '<p style="margin-top:0px">' + makeLinkHTML({url:this.url, title:'View Link'}) + '</p>';
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
	this.increment = function(isHelpful) {
		// POLICY:  if isHelpful is null or undefined or otherwise unspecified, don't count it at all.
		if( isHelpful === true ) {
			this.helpful += 1;
		}
		else if ( isHelpful === false ) {
			this.unhelpful += 1;
		}
		else {
			this.neutral += 1;
		}
		this.total += 1;
	}
	this.helpful = 0;
	this.unhelpful = 0;
	this.neutral = 0;
	this.total = 0;
	
	this.asHTML = function() {
		var html = "";
		if (this.total > 0) {
			//html += this.total + ': ';
			if (this.helpful > 0) {
				html += '<img src="' + THUMBS_UP_18X18_DATA_URL + '" alt="helpful" width="18" height="18" />' + this.helpful;
				if (this.unhelpful + this.neutral > 0) {
					html += ", ";
				}
			}
			if (this.unhelpful > 0) {
			    html += '<img src="' + THUMBS_DOWN_18X18_DATA_URL + '" alt="unhelpful" width="18" height="18" />' + this.unhelpful;
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
			sortInPlaceByCountDescending(items, "answer");
		}
		// Sort alphabetically
		else {
			sortInPlaceAlphabetically(items, 'answerText');
		}
		return new ItemList(items, "answer", "Answers");
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
		return escapeForHtml(this.answerText) + ' ('+this.count+')';
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

function getLocalTime(gmt)  {
   var min = gmt.getTime() / 1000 / 60; // convert gmt date to minutes
   var localNow = new Date().getTimezoneOffset(); // get the timezone offset in minutes            
   var localTime = min - localNow; // get the local time
   return new Date(localTime * 1000 * 60); // convert it into a date
}

var g_months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]
function getFormattedTimestamp(ts) {
    var month = ''+(ts.getMonth()+1);
    if (month.length==1) month = '0' + month;
    var day = ''+ts.getDate();
    if (day.length == 1) day = '0' + day;
    var date =  month + '/' + day + '/'+ ts.getFullYear();
    var hours = ''+ts.getHours();
    var mins = ''+ts.getMinutes();
    if (mins.length == 1) mins = '0' + mins;
    var time = hours + ':' + mins;
    return date + '&nbsp;' + time;
}

function getTimestamp() {
	var ts = new Date();
    var month = g_months[ts.getMonth()];
    var date =  g_months[ts.getMonth()] + ' ' + ts.getDate() + ', '+ ts.getFullYear();
    var hours = ''+ts.getHours();
    var mins = ''+ts.getMinutes();
    if (mins.length == 1) mins = '0' + mins;
    var secs = ''+ts.getSeconds();
    if (secs.length == 1) mins = '0' + mins;
    var time = hours + ':' + mins + ':' + secs;
    return date + ' ' + time;
}

//=================================================================================
// Charts
//=================================================================================

function drawChart(chart_div, data, customOptions) {
	var chart = null;
	if (g_chartApiLoaded) {
		// Need to recreate chart unless div has not been deleted/re-created
        chart = new google.visualization.ColumnChart(document.getElementById(chart_div));
        var options = {
            'width' : '100%',
            'height': 200,
            'backgroundColor': '#dfddd5',
        };
        for (var attr in customOptions) {
        	options[attr] = customOptions[attr];
        }
        chart.draw(data, options);
	
        google.visualization.events.addListener(chart, 'select', function() {
            var selection = chart.getSelection();
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
	
	return chart;
}

function drawStudentChartArea(itemList) {
	var data = getStudentChartData(itemList);	
	var options = {
			'vAxis' : { title: '# queries', baseline: 0 },
			'legend' : { position: 'none' },
			'colors' : [ '#454C45', '#888888' ],
			'isStacked' : true
	};
	var chart = drawChart('student_chart', data, options);
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
			'colors' : [ '#739C95', '#F54B27', '#454C45' ],
			'isStacked' : true
	};
	var chart = drawChart('query_chart', data, options);
}

function getQueryChartData(itemList) {
	var data = new google.visualization.DataTable();
    data.addColumn('string', 'Query');
    data.addColumn('number', 'Helpful');
    data.addColumn('number', 'Unhelpful');    
    data.addColumn('number', 'Unrated');
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
			'colors' : [ '#739C95', '#F54B27', '#454C45' ],
			'isStacked' : true
	};
	var chart = drawChart('word_chart', data, options);
}

function getWordChartData(itemList) {
	var data = new google.visualization.DataTable();
    data.addColumn('string', 'Words');
    data.addColumn('number', 'Helpful');
    data.addColumn('number', 'Unhelpful');    
    data.addColumn('number', 'Unrated');
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
			'colors' : [ '#739C95', '#F54B27', '#454C45' ],
			'isStacked' : true
	};
	var chart = drawChart('link_chart', data, options);
}

function getLinkChartData(itemList) {
	var data = new google.visualization.DataTable();
    data.addColumn('string', 'Link');
    data.addColumn('number', 'Helpful');
    data.addColumn('number', 'Unhelpful');    
    data.addColumn('number', 'Unrated'); 
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
			'colors' : [ '#454C45' ],
	};
	var chart = drawChart('answer_chart', data, options);
}

function getAnswerChartData(itemList) {
	var data = new google.visualization.DataTable();
    data.addColumn('string', 'Answer');
    data.addColumn('number', 'Total'); 
	$.each(itemList.items, function(i, item) {
		data.addRow([item.answerText, item.count]);
	});
    return data;
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
	var keys = keysOfObject(o);
	keys.sort(function (a,b) {
		var aValue = o[a];
		var bValue = o[b];
		return (a > b ? -1 : (a < b ? 1 : 0));
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
		// case insensitive sort
		var aValue = a[propertyName].toLowerCase();
		var bValue = b[propertyName].toLowerCase();
		return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
	});
}

function sortInPlaceByCountDescending(occurrences, secondarySortKey) {
	occurrences.sort(function(a,b) {
		var aCount = a.count;
		var bCount = b.count;
		var result = (aCount > bCount ? -1 : (aCount < bCount ? 1 : 0));
		if( result===0 && secondarySortKey ) {
			var aKey = a[secondarySortKey];
			aKey = (((typeof aKey)=="string") ? aKey.toLowerCase() : aKey);
			var bKey = b[secondarySortKey];
			bKey = (((typeof bKey)=="string") ? bKey.toLowerCase() : bKey);
			result = (aKey > bKey ? 1 : (aKey < bKey ? -1 : 0));
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
	words = query.split(" ");
	return words;
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
	// searches with any helpful links return true;
	// searches with any unhelpful links (and no helpful links) return false
	// (atr)
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
	var set={};
	var listLength=list.length;
	for(var i=0; i < listLength; i++) {
		set[list[i]] = true;
	}
	var numUnique = 0;
	for(var item in set) {
		numUnique += 1;
	}
	return numUnique;
}
