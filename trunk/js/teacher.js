/*
# SearchParty - Learning to Search in a Web-Based Classroom
# Author: Ben Bederson - www.cs.umd.edu/~bederson
#         University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/


///////////////////////////////////////////////////////////
// UPDATING UI
//

function updateUI() {
	updateSideBarInfo();
	updateButtonTitles();
	if($(".data_display_item.selected").size() == 0) {
		$("#data_display_content").html("");
		$("#data_display_annotation").html("");
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
	//		case "common":
	//			break;
			default:
				break;
		}
		g_updatesAreWaiting = false;
	}
	else {
		g_updatesAreWaiting = true;
	}
}

function onTaskChanged(taskIdx) {
	updateUI();
}

function updateSideBarInfo() {
	// Number of students
	var numStudents = calculateNumStudents();
	$("#num_students").html(numStudents);
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

function renderDataList(targetId, itemList) {
	var dataItems = itemList.items;
	var parts = [];
	parts.push('<ol>');
	$.each(itemList.items, function(idx,dataItem) {
		parts.push('<li>');
		parts.push(dataItem.asHTML());
		parts.push('</li>');
	});
	parts.push('</ol>');
	var html = parts.join("");
	var selector = "#" + targetId;
	$(selector).html(html)
	$(selector).each( function(idx,displayItem) {
		// CLOSURE:  Will this work right?  Will we have the right value of idx?
		var data = {
			item:dataItems[idx],
			idx: idx,
			displayItem: displayItem
		};
		$(this).click(data, onDataListItemClicked);
	});
}

function onDataListItemClicked(eventObject) {
	var target = eventObject.target;
	var data = eventObject.data;
	var type = data.type;
	var $target = $(target);
	var isSelected = $target.hasClass("selected");
	deselectAnnotation();
	if( isSelected ) {
		hideAnnotations();
		if( g_updatesAreWaiting ) {
			updateUI();
		}
	}
	else {
		$target.addClass("selected");
		showAnnotations(data.displayItem, data.item);
	}
}

function deselectAnnotation() {
	$(".data_display_item.selected").removeClass("selected");
}

function hideAnnotations(displayItem, item) {
	deselectAnnotation();
	var $data_display_annotation = $("#data_display_annotation");
	$data_display_annotation.hide();
	$data_display_annotation.html("");
}
function showAnnotations(displayItem, item) {
	var $data_display_annotation = $("#data_display_annotation");
	var $displayItem = $(displayItem);
	var offset = $displayItem.offset();
	var parts = [];
	$.each(item.getAnnotationsItemLists(), function (i,itemList) {
		parts.push(itemList.asHTML());
	});
	var html = parts.join("");
	$data_display_annotation.html(html);
	var minimumAnnotationDivHeight = 241;  // discovered experimentally in Opera
	var top = (offset.top - minimumAnnotationDivHeight);
	var scrollPosition = $("html").scrollTop();
	var containerTop = $("#data_display_container").offset().top;
	var minTop = Math.max(scrollPosition, containerTop);
	top = Math.max(top, minTop);
	$data_display_annotation.css({
//		top: (offset.top - 260) + "px",
		top: top + "px",
		left: (offset.left + $displayItem.parent().width() - 10) + "px",
	});
	$data_display_annotation.show();
}

function updateButtonTitles() {
	var taskIdx = selectedTaskIdx();
	var numStudents=0, numQueries=0, numWords=0, numLinks=0, numAnswers=0;
	var queries=[], words=[], links=[], answers=[];
	for(var studentNickname in g_students) {
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
}


function DataItem(type, displayText, count, className) {
// For info on JavaScript OOP, see:
//   http://www.javascriptkit.com/javatutors/oopjs.shtml   (new and this)
//   http://www.javascriptkit.com/javatutors/oopjs2.shtml  (constructors)
//   http://www.javascriptkit.com/javatutors/oopjs3.shtml  (inheritance)

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
		if( items.length==0 ) {
			html = '<div style="margin-bottom:18px;">(none)</div>'
		}
		else {
			var parts = [];
			parts.push('<ol>');
			$.each(items, function(idx,dataItem) {
				parts.push('<li class="data_display_item">');
				parts.push(dataItem.asHTML());
				parts.push('</li>');
			});
			parts.push('</ol>');
	//		if(DEBUG_MODE) {
	//			parts.push('<div><tt><pre>' + JSON.stringify(this) + '</pre></tt></div>');
	//		}
			html = parts.join("");
		}
		return html;
	};
	this.asHTML = function() {
		return '<h3>' + escapeForHtml(this.title) + '</h3>' + this.itemsAsHTML();
	}
}

function AnswerAccumulator() {
	this.add = function(answerText, studentNickname) {
		// POLICY:  Quietly ignore blank answers.
		if( answerText.trim()!=="" ) {
			var item = new AnswerDataItem(answerText, studentNickname);
			this._answersByStudent[studentNickname] = item;
		}
	};

	this.getItems = function() {
		// Sorts ALPHABETICALLY by answer text, case insensitive, ascending
		var items = valuesOfObject(this._answersByStudent);
		items.sort(function (a,b) {
			var aAnswerText = a.answerText.toLowerCase();
			var bAnswerText = b.answerText.toLowerCase();
			return (aAnswerText > bAnswerText ? 1 : (aAnswerText < bAnswerText ? -1 : 0));
		});
		return new ItemList(items, "answer", "Answers");
	}

	this._answersByStudent = {};
}


function AnswerDataItem(answerText, studentNickname) {
	this._super = DataItem;
	this._super("answer", answerText, null, "answer_data_item");
	this.answerText = answerText;
	this.studentNickname = studentNickname;
	this.asHTML = function() {
		return escapeForHtml(this.answerText);
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
					queryAccumulator.add(query, studentNickname);
					$.each(searchInfo.links_followed, function (j,linkInfo) {
						linkAccumulator.add(linkInfo.url, linkInfo.title, linkInfo.is_helpful, query, studentNickname);
					});
					$.each(getWordsForQuery(query), function (j,word) {
						wordAccumulator.add(word, query, studentNickname);
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

function RatingCounter() {
	this.increment = function(isHelpful) {
		// POLICY:  if isHelpful is null or undefined or otherwise unspecified, treat as helpful.
		if( isHelpful !== false ) {
			this.helpful += 1;
		}
		else {
			this.unhelpful += 1;
		}
	}
	this.helpful = 0;
	this.unhelpful = 0;
	this.asHTML = function() {
		var html = "";
		html += "(";
		if( this.helpful > 0 ) {
//			html += '<img src="/imgs/thumbs-up-18x18.png" alt="helpful" width="18" height="18" />' + this.helpful;
			html += '<img src="' + THUMBS_UP_18X18_DATA_URL + '" alt="helpful" width="18" height="18" />' + this.helpful;
			if( this.unhelpful > 0 ) {
				html += ", ";
			}
		}
		if( this.unhelpful > 0 ) {
//			html += '<img src="/imgs/thumbs-down-18x18.png" alt="unhelpful" width="18" height="18" />' + this.unhelpful;
			html += '<img src="' + THUMBS_DOWN_18X18_DATA_URL + '" alt="unhelpful" width="18" height="18" />' + this.unhelpful;
		}
		html += ")";
		return html;
	}
}

function LinkAccumulator() {
	this.add = function(url, title, isHelpful, query, studentNickname) {
		var uniquenessKey = url + "::" + query + "::" + studentNickname;
		var uniquenessDict = this._uniquenessDict;
		if(this._uniquenessDict[uniquenessKey]===undefined) {
			this._uniquenessDict[uniquenessKey] = true;
			var occurrenceDict = this._occurrenceDict;
			var occurrenceKey = url;
			var counterItem = occurrenceDict[occurrenceKey];
			var linkContext = {
				studentNickname: studentNickname,
				query: query,
				isHelpful: isHelpful
			};
			if(counterItem===undefined) {
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
		// Sorts by DESCENDING FREQUENCY
		var items = valuesOfObject(this._occurrenceDict);
		sortInPlaceByCountDescending(items, "title");
		items = $.map(items, function (item, i) {
			return new LinkDataItem(item.url, item.title, item.count, item.ratings);
		});
		return new ItemList(items, "link", "Links Followed");
	}

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
//		return makeLinkHTML({url:this.url, title:this.title}, 30) + ' &times; ' + this.count;
		var html = makeLinkHTML({url:this.url, title:this.title}, 30) + " " + this.ratings.asHTML();
		return html;
	};
	this.getAnnotationsItemLists = function() {
		var studentAccumulator = new StudentAccumulator();
		var queryAccumulator = new QueryAccumulator();
		var wordAccumulator = new WordAccumulator();
		var answerAccumulator = new AnswerAccumulator();
//		var linkAccumulator = new LinkAccumulator();

		var url = this.url;
		$.each(g_students, function (studentNickname,studentInfo) {
			var taskInfo = studentInfo.tasks[selectedTaskIdx()];
			$.each(taskInfo.searches, function (i,searchInfo) {
				var query = searchInfo.query;

				var matchesThisLink = false;
				var linksFollowed = searchInfo.links_followed;
				var numLinksFollowed = linksFollowed.length;
				for( var j=0; j<numLinksFollowed; j++ ) {
					if( linksFollowed[j].url == url ) {
						matchesThisLink = true;
						break;
					}
				}

				if( matchesThisLink ) {
					studentAccumulator.add(studentNickname, studentInfo.is_logged_in);
					queryAccumulator.add(query, studentNickname);
					$.each(getWordsForQuery(query), function (j,word) {
						wordAccumulator.add(word, query, studentNickname);
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


function QueryAccumulator() {
	this.add = function(query, studentNickname) {
		var uniquenessKey = studentNickname + "::" + query;
		var uniquenessDict = this._uniquenessDict;
		if(this._uniquenessDict[uniquenessKey]===undefined) {
			this._uniquenessDict[uniquenessKey] = true;
			var occurrenceDict = this._occurrenceDict;
			var occurrenceKey = query.toLowerCase();
			var counterItem = occurrenceDict[occurrenceKey];
			if(counterItem===undefined) {
				counterItem = new QueryDataItem(query, [studentNickname], 1);
				occurrenceDict[occurrenceKey] = counterItem;
			}
			else {
				counterItem.count += 1;
				counterItem.studentNicknames.push(studentNickname);
			}
		}
	};

	this.getItems = function() {
		// Sorts by DESCENDING FREQUENCY
		var items = valuesOfObject(this._occurrenceDict);
		sortInPlaceByCountDescending(items, "query");
		return new ItemList(items, "query", "Queries");
	}

	this._occurrenceDict = {};
	this._uniquenessDict = {};
}

function QueryDataItem(query, studentNicknames, count) {
	this._super = DataItem;
	this._super("query", query, count, "query_data_item");

	this.query = query;
	this.studentNicknames = studentNicknames;
	this.asHTML = function() {
		return escapeForHtml(this.query) + ' &times; ' + this.count;
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
	//				var anyLinksHelpful = false;
					$.each(searchInfo.links_followed, function (j,linkInfo) {
						linkAccumulator.add(linkInfo.url, linkInfo.title, linkInfo.is_helpful,
											query, studentNickname);
	//					anyLinksHelpful = anyLinksHelpful || linkInfo.is_helpful;
					});
					$.each(getWordsForQuery(query), function (j,word) {
						wordAccumulator.add(word, query, studentNickname);
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


function StudentAccumulator() {
	this.add = function(studentNickname, isLoggedIn) {
		var occurrenceDict = this._occurrenceDict;
		var occurrenceKey = studentNickname;
		var counterItem = occurrenceDict[occurrenceKey];
		if(counterItem===undefined) {
			counterItem = new StudentDataItem(studentNickname, isLoggedIn);
			occurrenceDict[occurrenceKey] = counterItem;
		}
	};

	this.getItems = function() {
		// Sorts by DESCENDING FREQUENCY
		var items = valuesOfObject(this._occurrenceDict);
		items.sort( function (a,b) {
			var aIsLoggedIn = a.isLoggedIn;
			var bIsLoggedIn = b.isLoggedIn;
			if( aIsLoggedIn==true && b.isLoggedIn==false ) {
				return 1;
			}
			else if( aIsLoggedIn==true && b.isLoggedIn==false ) {
				return -1;
			}
			else {
				var aName = a.studentNickname.toLowerCase();
				var bName = b.studentNickname.toLowerCase();
				return (aName > bName ? 1 : (aName < bName ? -1 : 0));
			}
		});
		return new ItemList(items, "student", "Students");
	}

	this._occurrenceDict = {};
}

function StudentDataItem(studentNickname, isLoggedIn) {
	this._super = DataItem;
	this._super("student", studentNickname, null, "student_data_item");
	this.studentNickname = studentNickname;
	this.isLoggedIn = isLoggedIn;

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
			queryAccumulator.add(query, studentNickname);
			$.each(searchInfo.links_followed, function (j,linkInfo) {
				linkAccumulator.add(linkInfo.url, linkInfo.title, linkInfo.is_helpful,
									query, studentNickname);
			});
			var words = getWordsForQuery(query);
			$.each(words, function (j,word) {
				wordAccumulator.add(word, query, studentNickname);
			});
		});

		return [queryAccumulator.getItems(),
				wordAccumulator.getItems(),
				linkAccumulator.getItems(),
				answerAccumulator.getItems()];
	}
	this.asHTML = function() {
		var className = (this.isLoggedIn===false ? "studentLoggedOut" : "studentLoggedIn");
		var html = '<span class="' + className + '">' + escapeForHtml(this.studentNickname) + '</span>';
		return html;
	}
}


function WordAccumulator() {
	this.add = function(word, query, studentNickname) {
		var stem = getWordStem(word).toLowerCase();
		var uniquenessKey = stem + "::" + query.toLowerCase() + "::" + studentNickname;
		var uniquenessDict = this._uniquenessDict;
		if(this._uniquenessDict[uniquenessKey]===undefined) {
			this._uniquenessDict[uniquenessKey] = true;
			var occurrenceKey = stem;
			var counterItem = this._occurrenceDict[occurrenceKey];
			if(counterItem===undefined) {
				var wordsDict = {};
				wordsDict[word] = 1;
				this._occurrenceDict[occurrenceKey] = counterItem = {
					wordsDict : wordsDict,
					stem  : stem,
					queries : [query],
					studentNicknames : [studentNickname],
					count : 1
				};
			}
			else {
				counterItem.count += 1;
				counterItem.wordsDict[word] = (counterItem.wordsDict[word] || 0) + 1;
				counterItem.studentNicknames.push(studentNickname);
				counterItem.queries.push(query);
			}
		}
	};

	this.getItems = function() {
		// Sorts by DESCENDING FREQUENCY
		var items = valuesOfObject(this._occurrenceDict);
		sortInPlaceByCountDescending(items, "stem");
		items = $.map(items, function (item, i) {
			var wordsDict = item.wordsDict;
			var allWordsSortedByFrequency = keysOfObjectSortedByValueDescending(wordsDict)
			var wordsStr = allWordsSortedByFrequency.join(", ");
			return new WordDataItem(wordsStr, wordsDict, item.stem,
									item.queries, item.studentNicknames, item.count)
		});
		return new ItemList(items, "word", "Words");
	}

	this._occurrenceDict = {};
	this._uniquenessDict = {};
}

function WordDataItem(wordsStr, wordsDict, stem, queries, studentNicknames, count) {
	this._super = DataItem;
	this._super("word", wordsStr, count, "word_data_item");

	this.wordsStr = wordsStr;
	this.wordsDict = wordsDict;
	this.stem = stem;
	this.queries = queries;
	this.studentNicknames = studentNicknames;
	this.asHTML = function() {
		return escapeForHtml(this.wordsStr) + ' &times; ' + this.count;
	}
	this.getAnnotationsItemLists = function() {
		var studentAccumulator = new StudentAccumulator();
		var queryAccumulator = new QueryAccumulator();
		var answerAccumulator = new AnswerAccumulator();
		var linkAccumulator = new LinkAccumulator();

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
				if( queryMatches ) {
					queryAccumulator.add(query, studentNickname);
					studentAccumulator.add(studentNickname, studentInfo.is_logged_in);
					$.each(searchInfo.links_followed, function (j,linkInfo) {
						linkAccumulator.add(linkInfo.url, linkInfo.title, linkInfo.is_helpful, query, studentNickname);
					});
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


function assembleSupplementalInfo(studentItems, queryItems, wordItems, linkItems, answerItems) {
	var info = [];
	if( studentItems !== null )
		info.push({items:studentItems, title:"Students"});
	if( queryItems !== null )
		info.push({items:queryItems, title:"Queries"});
	if( wordItems !== null )
		info.push({items:wordItems, title:"Words"});
	if( linkItems !== null )
		info.push({items:linkItems, title:"Links"});
	if( answerItems !== null ) {
		info.push({items:answerItems, title:"Answers"});
	}
}

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

function sortInPlaceByCountDescending(occurrences, secondarySortKey) {
	occurrences.sort(function (a,b) {
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
	if(!condition) {
		var s = JSON.stringify(condition);
		if( msg !== undefined ) {
			s = msg + "\n\n" + s;
		}
		alert(msg);
	}
}

function updateStudents() {
	var accumulator = new StudentAccumulator();
	var studentNames = keysOfObject(g_students);
	$.each(studentNames, function(i, studentNickname) {
		var isLoggedIn = g_students[studentNickname].logged_in;
		accumulator.add(studentNickname, isLoggedIn);
	});
	updateAnyWithItems(accumulator.getItems());
}

function updateAnyWithItems(itemList) {
	var dataItems = itemList.items;
	$("#data_display_content").html(itemList.asHTML());
//	renderDataList("data_display_content", accumulator.getItems());
	$("#data_display_content .data_display_item").each( function(idx,displayItem) {
		// CLOSURE:  Will this work right?  Will we have the right value of idx?
		var data = {
			item:dataItems[idx],
			idx: idx,
			displayItem: displayItem
		};
		$(this).click(data, onDataListItemClicked);
	});
}

function updateQueries() {
	// Include only queries for the currently selected task.
	
	var accumulator = new QueryAccumulator();
	var taskIdx = selectedTaskIdx();
	$.each(g_students, function (studentNickname,studentInfo) {
		$.each(studentInfo.tasks[selectedTaskIdx()].searches, function (i,searchInfo) {
			accumulator.add(searchInfo.query, studentNickname);
		});
	});
	updateAnyWithItems(accumulator.getItems());
}


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

function aggregateWords(words) {
	var numWords = words.length;

	// Make a copy of the list of words, sorted case-insensitive
	var wordsSorted = [];
	for(var i=0; i<numWords; i++) {
		wordsSorted.push(words[i]);
	}
	wordsSorted.sort(function (a,b) {
		var aLower = a.toLowerCase();
		var bLower = b.toLowerCase();
		return (aLower < bLower ? -1 : (aLower > bLower ? 1 : 0)); // ASCENDING
	});

	var wordsByStem = {};
	var stemInfos = [];
	for(var i=0; i<numWords; i++) {
		var word = wordsSorted[i];
		var stem = getWordStem(word).toLowerCase();
		var stemInfo = wordsByStem[stem];
		if( stemInfo==undefined ) {
			stemInfo = {
				stem : stem,
				totalWords : 0,
				wordCounts : {},
				words : []
			};
			wordsByStem[stem] = stemInfo;
			stemInfos.push(stemInfo);
		}
		stemInfo.totalWords += 1;
		var wordCount = stemInfo.wordCounts[word];
		if( wordCount==undefined ) {
			wordCount = 0;
			stemInfo.words.push(word);
		}
		wordCount += 1;
		stemInfo.wordCounts[word] = wordCount;
	}
	
	stemInfos.sort( function (a,b) {
		var aTotalWords = a.totalWords;
		var bTotalWords = b.totalWords;
		return (aTotalWords < bTotalWords ? 1 : (aTotalWords > bTotalWords ? -1 : 0)); // DESCENDING
	});

	var numStemInfos = stemInfos.length;
	for(var i=0; i<numStemInfos; i++) {
		var stemInfo = stemInfos[i];
		var words = stemInfo.words;
		var wordCounts = stemInfo.wordCounts;
		words.sort( function (a,b) {
			var aWordCount = wordCounts[a];
			var bWordCount = wordCounts[b];
			return (aWordCount < bWordCount ? 1 : (aWordCount > bWordCount ? -1 : 0));  // DESCENDING
		});
		stemInfo.mostFrequentWord = words[0];
	}

	return stemInfos;
}

function updateWords() {
	var accumulator = new WordAccumulator();
	var taskIdx = selectedTaskIdx();
	$.each(g_students, function (studentNickname,studentInfo) {
		$.each(studentInfo.tasks[selectedTaskIdx()].searches, function (i,searchInfo) {
			var query = searchInfo.query;
			var words = getWordsForQuery(query);
			$.each(words, function(j, word) {
				accumulator.add(word, query, studentNickname);
			});
		});
	});
	updateAnyWithItems(accumulator.getItems());
}

function updateLinks() {
	var accumulator = new LinkAccumulator();
	var taskIdx = selectedTaskIdx();
	$.each(g_students, function (studentNickname,studentInfo) {
		$.each(studentInfo.tasks[selectedTaskIdx()].searches, function (i,searchInfo) {
			var linksFollowed = searchInfo.links_followed;
			$.each(linksFollowed, function(j, linkInfo) {
				accumulator.add(linkInfo.url, linkInfo.title, linkInfo.is_helpful, searchInfo.query, studentNickname);
			});
		});
	});
	updateAnyWithItems(accumulator.getItems());
}

function updateAnswers() {
	var accumulator = new AnswerAccumulator();
	var taskIdx = selectedTaskIdx();
	$.each(g_students, function (studentNickname,studentInfo) {
		var answerText = studentInfo.tasks[selectedTaskIdx()].answer.text;
		accumulator.add(answerText, studentNickname)
	});
	updateAnyWithItems(accumulator.getItems());
}

function getQueriesSpaceNormalized(taskIdx) {
	var queries = [];
	for(var studentNickname in g_students) {
		var searches = g_students[studentNickname].tasks[taskIdx].searches;
		for(var searchIdx in searches) {
			var query = searches[searchIdx].query;
			query = normalizeSpacing(query);
			queries.push(query);
		}
	}
	return queries;
}

function sortAndDeDupeAsCopy(list) {
	return _sortAndDeDupe(list, false);
}
function sortAndDeDupeInPlace(list) {
	_sortAndDeDupe(list, true);
}
function _sortAndDeDupe(list, inPlace) {
	var sortedList = [];
	var numItems = list.length;

	// Copy
	for(var i=0; i<numItems; i++) {
		sortedList.push(list[i]);
	}

	// Sort
	sortedList.sort();

	// Decide where to put the results
	var sortedAndDeDupedList;
	if(inPlace==true) {
		list.length = 0;  // This will clear the array.  See section 15:4 in ECMAScript 5 standard.
		                  // Thanks Matthew Crumley, http://stackoverflow.com/questions/1232040/how-to-empty-an-array-in-javascript
		sortedAndDeDupedList = list;
	}
	else {
		sortedAndDeDupedList = [];
	}

	// Dedupe
	var lastItem = null;
	for(var i=0; i<numItems; i++) {
		var item = sortedList[i];
		if(i==0 || item!=lastItem) {
			sortedAndDeDupedList.push(item);
		}
		lastItem = item;
	}

	return sortedAndDeDupedList;
}

function normalizeSpacing(s) {
	return s.replace(/\s+/g, " ").trim();
}

function sortCaseInsensitiveInPlace(list) {
	function sortFn(a,b) {
		var aLower = a.toLowerCase();
		var bLower = b.toLowerCase();
		if(a > b) {
			return 1;
		}
		else if(a < b) {
			return -1;
		}
		else {
			return 0;
		}
	}
	list.sort(sortFn);
}

///////////////////////////////////////////////////////////
// RECEIVING UPDATES
//

function onSocketMessage(msg) {
	// Note:  Messages are limited to 32K.  This is not an issue now, but it
	// might come up in the future.
	//
	// http://code.google.com/appengine/docs/python/channel/overview.html

	log( "msg", msg );
	window.status = msg.data;
	updates = JSON.parse(msg.data);
	var num_updates = updates.length;
	for(var i=0; i<num_updates; i++) {
		var update = updates[i];
		switch(update.type) {
			case "query":
				handle_update_query(update.student_nickname, update.task_idx, update.query);
				break;
			case "link_followed":
				handle_update_link_followed(update.student_nickname, update.task_idx, update.query, update.url, update.title);
				break;
			case "link_rated":
				handle_update_link_rated(update.student_nickname, update.task_idx, update.url, update.is_helpful);
				break;
			case "log_in":
				handle_update_log_in(update.student_nickname, update.task_idx);
				break;
			case "log_out":
				handle_update_log_out(update.student_nickname);
				break;
			case "task":
				handle_update_task(update.student_nickname, update.task_idx);
				break;
			case "answer":
				handle_update_answer(update.student_nickname, update.task_idx, update.text, update.explanation);
				break;
			default:
				break;
		}
	}
}

function onSocketOpen() {
	alert("Socket opened");
}
function onSocketError() {
	alert("Socket error");
}
function onSocketClose() {
	alert("Socket closed");
}

function handle_update_query(student_nickname, task_idx, query) {
	g_students[student_nickname].tasks[task_idx].searches.push({"query":query, "links_followed":[]});
	updateUI();
}
function handle_update_link_rated(student_nickname, task_idx, url, is_helpful) {
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
				log( url + " matches with " + student_nickname );
				link_info.is_helpful = is_helpful;
			}
		}
	}
	updateUI();
}

function handle_update_link_followed(student_nickname, task_idx, query, url, title) {
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

function handle_update_log_in(student_nickname, task_idx) {
	var student_info = g_students[student_nickname];
	if( student_info==undefined ) {
		student_info = {};
		student_info.logged_in = true;
		student_info.task_idx = task_idx;
		var tasks_list = [];
		student_info.tasks = tasks_list;
		var numTasks = numberOfTasks();
		for(var i=0; i<numTasks; i++) {
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

function handle_update_answer(student_nickname, task_idx, text, explanation) {
	var answer_info = g_students[student_nickname].tasks[task_idx].answer;
	answer_info.text = text;
	answer_info.explanation = explanation;
	updateUI();
}

///////////////////////////////////////////////////////////
// BUTTON PANEL
//

var g_currentPaneName = null;
// g_currentPaneName should be one of "students", "queries", "words", "links", "common", "answers"

function loadPane(paneName) {
	if(g_currentPaneName !== null) {
		$("#"+getPaneId(g_currentPaneName)).removeClass("selected");
		$("#"+loadButtonId(g_currentPaneName)).removeClass("selected");
	}
	g_currentPaneName = paneName;
	$("#"+getPaneId(g_currentPaneName)).addClass("selected");
	$("#"+loadButtonId(g_currentPaneName)).addClass("selected");
	onPaneChanged(g_currentPaneName);
	window.location.hash = g_currentPaneName;
}
function getPaneId(paneName) {
	return "pane_" + paneName;
}
function loadButtonId(paneName) {
	return "load_" + paneName + "_btn";
}

function onPaneChanged(newPane) {
	hideAnnotations();
	updateUI();
}

///////////////////////////////////////////////////////////
// INITIALIZATION
//

function initialize() {
	window.status = "Loading...";
	// Open Channel
	var channel = new goog.appengine.Channel(TOKEN);
	var socket = channel.open();
	socket.onmessage = onSocketMessage;
//	socket.onopen = onSocketOpen;
//	socket.onerror = onSocketError;
//	socket.onclose = onSocketClose;

	updateUI();
	//initializeGraph();

	loadPane(START_PANE);
	window.status = "Loaded";
}


///////////////////////////////////////////////////////////
// HELPERS
//

function calculateNumStudents() {
	var numStudents = 0;
	for( var student_nickname in g_students ) {
		if( g_students[student_nickname].logged_in ) {
			numStudents++;
		}
	}
	return numStudents;
}

function getStudentNames() {
	var studentNames = [];
	for( var student_nickname in g_students ) {
		studentNames.push(student_nickname);
	}
	studentNames.sort();
	return studentNames;
}

function asList(items, listType, shouldEscapeAsHTML) {
	// listType should be either "ul" or "ol"
	lines = [];
	lines.push("<" + listType + ">");
	var numItems = items.length;
	for( var i=0; i<numItems; i++ ) {
		var item = items[i];
		if(shouldEscapeAsHTML) {
			item = escapeForHtml(item);
		}
		lines.push("<li>" + item + "</li>");
	}
	lines.push("</" + listType + ">");
	return lines.join("");
}
