var g_top_ui_visible = false;

var searchBoxElementId = 'lst-ib'; // Google search box
var googleBarElementId = 'mngb'; // Google top bar (including dark Google and profile bars)
//var googleBarElementId = 'gbx3'; // Google bar

// Set search term
function setQuery(query) {
	var searchBox = document.getElementById(searchBoxElementId);
	searchBox.value = query;
}

function hideGoogleBar() {
	var googleBar = document.getElementById(googleBarElementId);
	googleBar.style.visibility = 'hidden';
}

//function createSearchPartyInterface() {
//	var googleBar = document.getElementById(googleBarElementId);
//
//	var element = document.createElement('div');
//	//element.id = '';
//	//element.className = '';
//	element.style.width = '100%';
//	element.style.height = '200px';
//	element.style.background = '#444444';
//	//element.style.border-bottom = '1px solid #DEDEDE';
//	element.innerHTML = '<img src="http://search-party.appspot.com/imgs/sp_logo.png" />';
//
//
//	if(googleBar.nextSibling) {
//		googleBar.parentNode.insertBefore(element, googleBar.nextSibling);
//	} else {
//		googleBar.parentNode.appendChild(element);
//	}
//}

//function createUniversalInterface() {
//	var bodyTags = document.getElementsByTagName("body");
//	var bodyTag = bodyTags[0];
//	
//	var element = document.createElement('div');
//	//element.id = '';
//	element.className = 'universalUI';
//	element.innerHTML = '<img src="http://search-party.appspot.com/imgs/sp_logo.png" />';
//
//	if(bodyTag) {
//		bodyTag.insertBefore(element, bodyTag.firstChild);	
//		bodyTag.style.margin = '200px 0px 0px 0px';
//	}
//}

// Initialize extension
//createSearchPartyInterface();
//createUniversalInterface();



function createSearchPartyInterface() {
	
	//height of top bar, or width in your case
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
			background-color: #eeeeee; \
			border-bottom: 1px solid #DEDEDE; \
			font-family: arial,sans-serif; \
			font-size: 13px; \
		} \
		</style> \
		\
		<div style="background: url(http://search-party.appspot.com/imgs/sp_logo.png) no-repeat left center; width: 100%; height: ' + height + '; padding-left: 200px;"> \
		<div> \
		<div id="sptask" style="font-weight: bold; padding-bottom: 20px; font-size: 16px;"></div> \
		\
		<div> \
		Response<br /> \
		<input type="text" id="response" name="response" value="" style="width:300px"><br/> \
		Queries<br /> \
		<div id="tag_cloud"></div> \
		Note<br/> \
		<textarea rows="2" name="explanation" id="explanation" style="width:300px"></textarea><br/> \
		<button id="submit_response" name="submit_response">Save</button> \
		<span id="response_saved" class="note"></span> \
		</div> \
		</div>';
}

function hideSearchPartyTopUi() {

	// Hide the SP top UI
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

	// Hide the SP top UI
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
	
	var spTopUiHeightWhileVisible = '200px';
	
	// Move HTML page back up to the top of the page since the SP top UI has been hidden
	html.css(
		'top',     //make sure we're -adding- to any existing values
		spTopUiHeightWhileVisible
	);
	
	// Update state variable
	g_top_ui_visible = true;
}



createSearchPartyInterface();
hideSearchPartyTopUi();
//showSearchPartyTopUi();

//clouds
var DEFAULT_CLOUD_SHOW_OPTION = 'link_helpful';
var g_cloudShowOption = DEFAULT_CLOUD_SHOW_OPTION;
var g_actionColors = { search:'#888888', link:'#454C45', link_helpful:'#739c95', link_unhelpful:'#5C091F', answer:'blue' };

var itemList = [ 'hey', 'hello', 'what', 'why' ];
drawQueryCloud(itemList);





// Set up message handler that listens for events from the extension page 
/*
chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		alert('receiving msg');
		alert(request.greeting);
		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");
		if (request.greeting == "hello") {
			sendResponse({farewell: "goodbye"});
		}
});
*/

/**
 * "onConnect event is fired when a connection is made from an extension process or content script"
 */
chrome.extension.onConnect.addListener(function(port) {
	console.assert(port.name == "spTopUi");
	port.onMessage.addListener(function(message) {

		if (message.message_type == 'show_top_ui') {
			
			showSearchPartyTopUi();
			
			// Update task description
			if (message['task_description'] !== undefined) {
				$('#searchPartyTopFrame').contents().find('#sptask').html(message.task_description);
			}
			
			port.postMessage({
				message_type: 'acknowledgment',
				message: 'show_top_ui'
			});
			
		} else if (message.message_type == 'update_top_ui') {
			// Update Seach Party UI
			
			// Update task description
			if (message['task_description'] !== undefined) {
				$('#searchPartyTopFrame').contents().find('#sptask').html(message.task_description);
			}
			
		} else if (message.message_type == 'hide_top_ui') {
			
			hideSearchPartyTopUi();
			
		}

	});
});






//=================================================================================
//Word Clouds
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