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
//	$(".data_display_item.selected").removeClass("selected");
	if( isSelected ) {
		$target.removeClass("selected");
		hideAnnotations();
	}
	else {
		$target.addClass("selected");
		showAnnotations(data.displayItem, data.item);
	}
}

function hideAnnotations(displayItem, item) {
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
	$data_display_annotation.css({
		top: offset.top + "px",
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
			html = "<div>(none)</div>"
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
					count : 0
				};
			}
			counterItem.count += 1;
			counterItem.linkContexts.push(linkContext);
		}
	};

	this.getItems = function() {
		// Sorts by DESCENDING FREQUENCY
		var items = valuesOfObject(this._occurrenceDict);
		sortInPlaceByCountDescending(items);
		items = $.map(items, function (item, i) {
			return new LinkDataItem(item.url, item.title, item.count);
		});
		return new ItemList(items, "link", "Links Followed");
	}

	this._occurrenceDict = {};
	this._uniquenessDict = {};
}

function LinkDataItem(url, title, count) {
	this._super = DataItem;
	this._super("link", url, count, "link_data_item");
	this.url = url;
	this.title = title;
	this.asHTML = function() {
		return makeLinkHTML({url:this.url, title:this.title}, 30) + ' &times; ' + this.count;
	};
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
		sortInPlaceByCountDescending(items);
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

		$.each(g_students, function (studentNickname,studentInfo) {
			var taskInfo = studentInfo.tasks[selectedTaskIdx()];
			$.each(taskInfo.searches, function (i,searchInfo) {
				var query = searchInfo.query;
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
				var aName = a.toLowerCase();
				var bName = b.toLowerCase();
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
			answerAccumulator.add(answerInfo.answerText, studentNickname);
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
		return escapeForHtml(this.studentNickname);
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
		sortInPlaceByCountDescending(items);
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

function sortInPlaceByCountDescending(occurrences) {
	occurrences.sort(function (a,b) {
		var aCount = a.count;
		var bCount = b.count;
		return (aCount > bCount ? -1 : (aCount < bCount ? 1 : 0));
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
	var taskIdx = selectedTaskIdx();
	var words = []
	var queries = getQueriesSpaceNormalized(taskIdx);
	var numQueries = queries.length;
	for(var queryIdx=0; queryIdx<numQueries; queryIdx++) {
		var query = queries[queryIdx];
		var wordsInQuery = query.split(" ");
		var numWordsInQuery = wordsInQuery.length;
		for(var wordInQueryIdx=0; wordInQueryIdx<numWordsInQuery; wordInQueryIdx++) {
			var wordInQuery = wordsInQuery[wordInQueryIdx];
			if(!isStopWord(wordInQuery)) {
				words.push(wordInQuery);
			}
		}
	}

	var stemInfos = aggregateWords(words);
	var numStemInfos = stemInfos.length;

	var lines = [];
	lines.push('<table class="occurrences_table">');
	for(var i=0; i<numStemInfos; i++) {
		var stemInfo = stemInfos[i];
		var occurrences = stemInfo.totalWords;
		var wordsStr = stemInfo.words.join(", ");
		row_html = '<tr><td class="occurences_num">' + occurrences + '</td><td class="occurrences_times_symbol">&times;</td><td class="occurrences_item">' + escapeForHtml(wordsStr) + '</td></tr>';
		lines.push(row_html);
	}
	lines.push('</table>');

	var html = lines.join("");
	$("#words").html(html);
}

function updateLinks() {
	var taskIdx = selectedTaskIdx();
	var linksOccurrenceDict = {};
	var titlesByUrl = {};
	var maxLinkTitleLength = 80;
	for(var studentNickname in g_students) {
		var searches = g_students[studentNickname].tasks[taskIdx].searches;
		for(var searchIdx in searches) {
			var searchInfo = searches[searchIdx];
			var linksFollowed = searchInfo.links_followed;
			for(var linkIdx in linksFollowed) {
				var linkInfo = linksFollowed[linkIdx];
				var url = linkInfo.url;
				var title = linkInfo.title;
				var occurrences = linksOccurrenceDict[url];
				occurrences = (occurrences==undefined ? 0 : occurrences);
				linksOccurrenceDict[url] = occurrences + 1;
				titlesByUrl[url] = title;
			}
		}
	}

	var urlsOrderedByOccurrences = [];
	for(var url in linksOccurrenceDict) {
		urlsOrderedByOccurrences.push(url);
	}
	urlsOrderedByOccurrences.sort(function (a,b) {
		// Sort in DESCENDING order of occurrences.
		aOccurrences = linksOccurrenceDict[a];
		bOccurrences = linksOccurrenceDict[b];
		return (aOccurrences > bOccurrences ? -1 : (aOccurrences < bOccurrences ? 1 : 0));
	});

	var lines = [];
	lines.push('<table id="link_occurrences_table" class="occurrences_table">');
	for(var urlIdx in urlsOrderedByOccurrences) {
		var url = urlsOrderedByOccurrences[urlIdx];
		var occurrences = linksOccurrenceDict[url];
		var linkInfo = {
			url : url,
			title : titlesByUrl[url]
		};
		var linkHTML = makeLinkHTML(linkInfo, null);
		lines.push('<tr>');
		lines.push('<td class="occurences_num">' + occurrences + '</td>');
		lines.push('<td class="occurrences_times_symbol"> &times;</td>');
		lines.push('<td class="occurrences_item">'+linkHTML+'</td>');
		lines.push('</tr>');
	}
	lines.push('</table>');

	var html = lines.join("");
	$("#links").html(html);

	return queries;
}

function updateAnswers() {
	var taskIdx = selectedTaskIdx();
	var answers = [];
	var lines = [];
	for(var studentNickname in g_students) {
		var answer = g_students[studentNickname].tasks[taskIdx].answer.text.trim();
		if(answer.length > 0) {
			answers.push(answer);
		}
	}
	if(answers.length==0) {
		lines.push('<div class="nothing_done">No answers have been submitted.</div>');
	}
	else {
		var answerOccurrenceDict = {};
		var numAnswers = answers.length;
		for(var answerIdx=0; answerIdx<numAnswers; answerIdx++) {
			var answer = answers[answerIdx];
			var currentOccurrenceCount = answerOccurrenceDict[answer];
			if(currentOccurrenceCount==undefined) {
				currentOccurrenceCount = 0;
			}
			answerOccurrenceDict[answer] = currentOccurrenceCount + 1;
		}

		var answerList = [];
		for(var answer in answerOccurrenceDict) {
			answerList.push(answer);
		}
		answerList.sort(function (a,b) {
			// Sort in DESCENDING order of occurrences.
			var aOccurrences = answerOccurrenceDict[a];
			var bOccurrences = answerOccurrenceDict[b];
			return (aOccurrences > bOccurrences ? -1 : (aOccurrences < bOccurrences ? 1 : 0));
		});

		lines.push('<table class="occurrences_table">');
		for(var answerIdx in answerList) {
			var answer = answerList[answerIdx];
			var occurrences = answerOccurrenceDict[answer];
			var answerRepresentation = (answer.length==0 ? "&empty;" : escapeForHtml(answer));
			var row_html = '<tr><td class="occurences_num">' + occurrences + '</td><td class="occurrences_times_symbol">&times;</td><td class="occurrences_item">' + answerRepresentation + '</td></tr>';
			lines.push(row_html);
		}
		lines.push('</table>');
	}

	var html = lines.join("");
	$("#answers").html(html);
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
				link_url.is_helpful = is_helpful;
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



//function updateNumStudents_Request() {
//	// LESSON_CODE is global, defined in the HTML file
//	// $.getJSON("/query", "qt=num_students", updateNumStudents_Callback);
//	//$.getJSON("/query", "qt=num_students&lesson_code="+LESSON_CODE, updateNumStudents_Callback);
//}
//
//function updateNumStudents_Callback(data) {
//    //var numStudents = data['num_students'];
//    //if (numStudents === 0) {
//    //    var html = "No students logged in";
//    //} else {
//    //    // var html = "# <a href='/student_list'>students</a>: " + numStudents;
//    //    var html = "# students: " + numStudents;
//    //}
//    $("#num_students").html(data["num_students"]);
//}
//
//
//
//function displaySearchers_Request(searchTerms) {
//	//$.getJSON("/query", "qt=search&terms=" + searchTerms, displaySearchers_Callback);
//}
//
//function displaySearchers_Callback(terms) {
//    var html = terms.join(", ");
//    var searchers = $("#searchers");
//    searchers.show();
//    searchers.html(html);  // TODO:  Escape html.
//    searchers.css("left", $(this).position().left + searchers.width());
//    searchers.css("top", $(this).position().top);
//}
//
//
//
//function updateStudentActivities_Request(data) {
//	//$.getJSON("/query", "qt=student_activity&lesson_code=" + LESSON_CODE, updateStudentActivities_Callback);
//}
//
//function updateStudentActivities_Callback(data) {
//    // Search terms
//	var searchTerms = data['terms'];
//	var html = "";
//	var count = searchTerms.length;
//	if (count > 0) {
//	    html += "<ul>";
//	    for (i in searchTerms) {
//		    var j = count - 1 - i;
//		    var term = searchTerms[j][0];
//		    var termCount = searchTerms[j][1];
//		    html += "<li><a class='term'>" + term + "</a> (" + termCount + ")</li>";
//	    }
//	    html += "</ul>";
//    } else {
//        html = "&lt;none&gt;";
//    }
//	$("#searchTerms").html(html);
//
//    // Followed links
//	var links = data['links'];
//	var html = "";
//	var count = links.length;
//	if (count > 0) {
//	    html += "<ul>";
//	    for (i in links) {
//	        var j = count - 1 - i;
//		    var link = links[j][0];
//		    var linkCount = links[j][1];
//		    html += "<li><a href='" + link + "' target='_blank'>" + link + "</a> (" + linkCount + ")</li>";
//	    }
//	    html += "</ul>";
//    } else {
//        html = "&lt;none&gt;";
//    }
//	$("#links").html(html);
//	
//	$(".term").mouseenter(function() {
//	    var searchTerms = $(this).html();
//		displaySearchers_Request(searchTerms);
//        var searchers = $("#searchers");
//        searchers.css("height", "20px");
//        searchers.css("left", $(this).position().left + $(this).width() + 30);
//        searchers.css("top", $(this).position().top - (searchers.height() - $(this).height()));
//	});
//	$(".term").mouseleave(function() {
//	    $("#searchers").hide();
//    });
//}
//
//
//function updateStudents_Request() {
//	//$.getJSON("/query", "qt=students&lesson_code"+LESSON_CODE, updateStudents_Callback);  // for students list
//}
//
//function updateStudents_Callback(data) {
//	var students = data;
//	var html;
//	if (students.length == 0) {
//	    html = "No students logged in";
//	} else {
//	    html = "Currently logged in students:";
//	    html += "<ul>";
//	    for (var i in students) {
//	        var student = students[i];
//	        var name = student[0];
//	        var activities = student[1];
//		    html += "<li>" + name + ": ";
//		    for (var j in activities) {
//		        if (j > 0) {
//		            html += " => ";
//		        }
//		        var activity = activities[j];
//		        var activityType = activity[0];
//		        var action = activity[1];
//		        if (activityType == 'search') {
//		            html += action;
//	            } else if (activityType == 'link') {
//	                html += "<a href = '" + action + "'>" + action + "</a>";
//		        }
//		    }
//	    }
//	    html += "</ul>";
//    }
//	$("#students").html(html);
//}

//function onSocketMessage(msg) {
//	// Note:  Messages are limited to 32K.  This is not an issue now, but it
//	// might come up in the future.
//	//
//	// http://code.google.com/appengine/docs/python/channel/overview.html
//
//	alert(msg.data)
//    var state = JSON.parse(msg.data);
//	var sinceStr;
//	var shouldUpdateNumStudents=false;
//	var shouldUpdateTermsAndLinks=false;
//    if (state.change == "student_login") {
//		updateNumStudents_Request();
//    }
//	else if (state.change == "student_logout") {
//		updateNumStudents_Request();
//		updateStudents_Request();
//    }
//	else if (state.change == "student_search") {
//		updateStudentActivities_Request();
//		updateStudents_Request();
//    }
//	else if (state.change == "student_link_followed") {
//		updateStudentActivities_Request();
//		updateStudents_Request();
//    }
//	else if ('log' in state) {
//        $("#log").append(state.log + "<br>");
//    } 
//}
//
//function updateWords() {
//	var taskIdx = selectedTaskIdx();
//	var wordOccurrenceDict = {};
//	var queries = getQueriesSpaceNormalized(taskIdx);
//	var numQueries = queries.length;
//	for(var queryIdx=0; queryIdx<numQueries; queryIdx++) {
//		var query = queries[queryIdx];
//		var wordsInQuery = query.split(" ");
//		var numWordsInQuery = wordsInQuery.length;
//		for(var wordInQueryIdx=0; wordInQueryIdx<numWordsInQuery; wordInQueryIdx++) {
//			var wordInQuery = wordsInQuery[wordInQueryIdx];
//			if(!isStopWord(wordInQuery)) {
//				var currentOccurrenceCount = wordOccurrenceDict[wordInQuery];
//				if(currentOccurrenceCount==undefined) {
//					currentOccurrenceCount = 0;
//				}
//				wordOccurrenceDict[wordInQuery] = currentOccurrenceCount + 1;
//			}
//		}
//	}
//
//	var wordList = [];
//	for(var word in wordOccurrenceDict) {
//		wordList.push(word);
//	}
//	wordList.sort(function (a,b) {
//		// Sort in DESCENDING order of occurrences.
//		var aOccurrences = wordOccurrenceDict[a];
//		var bOccurrences = wordOccurrenceDict[b];
//		return (aOccurrences > bOccurrences ? -1 : (aOccurrences < bOccurrences ? 1 : 0));
//	});
//
//	var lines = [];
//	lines.push('<table class="occurrences_table">');
//	for(var wordIdx in wordList) {
//		var word = wordList[wordIdx];
//		var occurrences = wordOccurrenceDict[word];
//		row_html = '<tr><td class="occurences_num">' + occurrences + '</td><td class="occurrences_times_symbol">&times;</td><td class="occurrences_item">' + escapeForHtml(word) + '</td></tr>';
//		lines.push(row_html);
//	}
//	lines.push('</table>');
//
//	var html = lines.join("");
//	$("#words").html(html);
//}

//function initializeGraph() {
////    var width = $(document).width() - 20;
////    var height = $(document).height() - 60;
//    var width = 811;
//    var height = 334;
//    g = new Graph();
//    g.addNode("Marty");
//    g.addNode("Allison");
//    g.addNode("Tasha");
//    g.addNode("Ben");
//    g.addNode("Emma");
//	g.addEdge("Marty",   "Allison", {label:"aardvark, pajamas, nighty, slippers"})
//	g.addEdge("Allison", "Emma",    {label:"aardvark, pajamas, blanket"})
//	g.addEdge("Emma", "Ben",    {label:"warm, night, cold"})
//	g.addEdge("Ben", "Tasha",    {label:"animal, nightware, ants, warm"})
//	g.addEdge("Tasha", "Marty",    {label:"aardvark, slippers, nighty, ants, warm, night"})
//	g.addEdge("Ben", "Marty",    {label:"aardvark, warm, night, ants"})
//
//    /* layout the graph using the Spring layout implementation */
//    var layouter = new Graph.Layout.Spring(g);
//    
//    /* draw the graph using the RaphaelJS draw implementation */
//    var renderer = new Graph.Renderer.Raphael('canvas', g, width, height);
//    
//    redraw_graph = function() {
//        layouter.layout();
//        renderer.draw();
//    };
//}

/*
function updateStudents_OLD() {
	var studentNames = getStudentNames();
	var lines = [];
	lines.push("<ol>");
	$.each(g_students, function(studentNickname, studentInfo) {
	});
	var numStudents = studentNames.length;
	for( var i=0; i<numStudents; i++ ) {
		var student_nickname = studentNames[i];
		var attribs = (g_students[student_nickname].logged_in ? '' : ' style="color:gray"');
		var annotation = (g_students[student_nickname].logged_in ? '' : ' (logged out)');
		lines.push("<li" + attribs + ">" + student_nickname + annotation + "</li>");
	}
	lines.push("</ol>");
	var html = lines.join("");
	$("#students").html(html);
}


function updateStudents_MESSY_TABLE() {
	var maxLinkTitleLength = 30;
	var taskIdx = selectedTaskIdx();
	var lines=[];
	var studentNames = getStudentNames();
	var studentsLoggedIn=[], studentsLoggedOut=[];

	// Put logged in students ahead of logged out students, but display both..
	for(var studentIdx in studentNames) {
		var studentNickname = studentNames[studentIdx];
		if(g_students[studentNickname].logged_in) {
			studentsLoggedIn.push(studentNickname);
		}
		else {
			studentsLoggedOut.push(studentNickname);
		}
	}
	studentNames.length = 0;
	for(var studentIdx in studentsLoggedIn) {
		studentNames.push(studentsLoggedIn[studentIdx]);
	}
	for(var studentIdx in studentsLoggedOut) {
		studentNames.push(studentsLoggedOut[studentIdx]);
	}
	lines.push('<table id="student_table" border="1">');
	lines.push('<thead>')
	lines.push('<th>Name</th>')
	lines.push('<th>Query</th>')
	lines.push('<th>Link followed</th>')
	lines.push('</thead>')
	lines.push('<tbody>')
	for(var studentIdx in studentNames) {
		var studentNickname = studentNames[studentIdx];
		var studentInfo = g_students[studentNickname];
		var loggedIn = studentInfo.logged_in;
		var loggedInOrOutClass = (loggedIn ? "" : " logged_out");
		var taskInfo = studentInfo.tasks[taskIdx];
		var searches = taskInfo.searches;
		var answer = taskInfo.answer;

		// Find rowspan for student name cell.
		var rowSpanStudent = 0;
		if(searches.length==0) {
			rowSpanStudent = 1;
		}
		else {
			rowSpanStudent = 0;
			for(var searchIdx in searches) {
				var searchInfo = searches[searchIdx];
				var numLinksFollowed = searchInfo.links_followed.length;
				rowSpanStudent += (numLinksFollowed==0 ? 1 : numLinksFollowed);
			}
		}
		lines.push('<td class="st_student' + loggedInOrOutClass + '" rowspan="' + rowSpanStudent + '">' + studentNickname + "</td>");
		if(searches.length==0) {
			lines.push('<td class="st_query nothing_done" colspan="2">&empty;</td>')
			lines.push("</tr>")
		}
		else {
			for(var searchIdx in searches) {
				var searchInfo = searches[searchIdx];
				var query = searchInfo.query;
				var linksFollowed = searchInfo.links_followed;
				var numLinksFollowed = linksFollowed.length;
				var rowSpanQuery = (numLinksFollowed <= 1 ? 1 : numLinksFollowed);
				if(searchIdx > 0) {
					lines.push("<tr>")
				}
				lines.push('<td class="st_query' + loggedInOrOutClass + '" rowspan="' + rowSpanQuery + '">' + query + "</td>");
				if(linksFollowed.length==0) {
					lines.push('<td class="st_link nothing_done' + loggedInOrOutClass + '">&empty;</td>')
					lines.push('</tr>')
				}
				else {
					for(var linkIdx in linksFollowed) {
						if(linkIdx > 0) {
							lines.push("<tr>")
						}
						var link = linksFollowed[linkIdx];
						lines.push('<td class="st_link' + loggedInOrOutClass + '">' + makeLinkHTML(link, null) + '</td>');
						lines.push("</tr>")
					}
				}
			}
		}
		lines.push('</tr>')
	}
	lines.push('</tbody>')
	lines.push("</table>")
	var html = lines.join("");
	$("#students").html(html);
}
*/
