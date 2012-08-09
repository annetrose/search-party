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

function onResponseChanged() {
	//alert("onResponseChanged");
	
	var response = $('#searchPartyTopFrame').contents().find('#response').val();
	if (response != '') {
		var explanation = $('#searchPartyTopFrame').contents().find('#explanation').val();
		//chrome.extension.sendRequest({'type':'response', 'response':response, 'explanation':explanation});
		
		// Open port to send message (background.js receives and handles this message)
		var port = chrome.extension.connect({ name: "spTopUi" });
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
	var rating = $('input:radio[name=rating]:checked').val();
	//chrome.extension.sendRequest({'type':'rating', 'rating':rating});
	// Open port to send message (background.js receives and handles this message)
	var port = chrome.extension.connect({ name: "spTopUi" });
	port.postMessage({
		type: 'request',
		request: { 'type': 'rating', 'rating': rating }
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
		<div style="background: url(http://search-party.appspot.com/imgs/sp_logo.png) no-repeat left center; background-size: 114px 49px; width: 100%; height: ' + height + '; padding-left: 140px; margin-left: 13px;"> \
		<div> \
		<div id="sptask" style="font-weight: normal; padding-bottom: 15px; font-size: 20px; color: #DD4B39;"></div> \
		\
		<div> \
		Response<br /> \
		<input type="text" id="response" name="response" value="" style="float:left; width:300px; height:27px; line-height:27px; text-indent:10px; font-family:arial, sans-serif; font-size:16px; color:#333; background: #fff; border:solid 1px #d9d9d9; border-top:solid 1px #c0c0c0; border-right:none;"> \
		<br/><br /> \
		\
		Note<br/> \
		<textarea rows="2" name="explanation" id="explanation" style="width:300px"></textarea><br/> \
		<button id="submit_response" name="submit_response" style="cursor:pointer; width:70px; height: 31px; font-size:13px; color: #ffffff; background: #4d90fe center; border: 1px solid #3079ED; -moz-border-radius: 2px; -webkit-border-radius: 2px;">Save</button> \
		<span id="response_saved" class="note"></span> \
		</div> \
		</div>';
	
//		<div id="searchContainer"> \
//		    <form> \
//		        <input id="field" name="field" type="text" /> \
//		        <div id="delete"><span id="x">x</span></div> \
//		    </form> \
//		</div> \

	// Set up UI event listeners
	$('#searchPartyTopFrame').contents().find('#submit_response').click(function() { 
		onResponseChanged();
	});
	
	$('#searchPartyTopFrame').contents().find('input[name=rating]').change(onRatingChanged);
	
	
	/**
	 * Insert query cloud
	 */
	// Style the SearchParty Top Frame
	//document.getElementById("knop").contentDocument.body.innerHTML =
	
	// Add query cloud above knowledge panel
	$("#knop").prepend('<div class="kno-mcl rhsvw" style="margin-bottom: 26px;"><div style="display:inline-block;margin-bottom:3px;position:relative;height:9px;left:-5px;top:-9px"><span style="background:#fff;font-size:medium;padding:0 5px">SP Query Cloud</span></div><a href="/search?hl=en&amp;q=birds+of+prey+tv+series&amp;stick=H4sIAAAAAAAAAONgUeLUz9U3MMnKLaoCAIjXUbINAAAA&amp;sa=X&amp;ei=7X4hUK3QO6O-2gX-94AY&amp;ved=0CKkBEOkTMBA" style="text-decoration:none;color:#000"><div class="kno-mec rhsvw kno-mecec kno-fb-ctx"><div class="kno-mecth"><div style="height:72px;overflow:hidden;width:72px"><img src="data:image/jpg;base64,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" alt="Birds of Prey" border="0" height="107" id="kpthumb16" style="margin-top:-12px" width="72"></div></div><div class="kno-mect"><div class="kno-mecti ellip"><span class="fl" style="color:#12c">CLOUD TEST</span></div><div class="ellip kno-mecm">TV series&nbsp;</div><div class="kno-mecd" style="overflow:hidden;padding:1px 0"><div class="krable" data-ved="0CKkBEOkTMBA" style="float:right;margin-left:5px"></div><div><span>Birds of Prey is a television drama series</span><span class="rhsg3"> produced in 2002. The series</span><span class="rhsg4"> was developed by Laeta Kalogridis</span><span> ...</span></div></div></div></div></a></div>');
	
	// Add "Others' searchers" to top of results
	$("#topstuff").prepend('<div style="margin:7px 0 1em" id="trev" class="std"><div style="padding-right:.6em;vertical-align:top">Others\' searches:&nbsp;&nbsp; <a class="nobr" style="margin-right:10px" href="/search?hl=en&amp;q=bird+of+prey+6+letters&amp;revid=-1&amp;sa=X&amp;ei=SowhUPTSBMOO2wWnhICwCQ&amp;ved=0CG4Q4QIoAA">bird of prey <b>6 letters</b></a> <a class="nobr" style="margin-right:10px" href="/search?hl=en&amp;q=bird+of+prey+list&amp;revid=-1&amp;sa=X&amp;ei=SowhUPTSBMOO2wWnhICwCQ&amp;ved=0CG8Q4QIoAQ">bird of prey <b>list</b></a></div></div>');
	
	/**
	 * Request population of UI data
	 */
	
	// Open port to send message (background.js receives and handles this message)
	syncTopUi();
}

function syncTopUi() {
	// Open port to send message (background.js receives and handles this message)
	var port = chrome.extension.connect({ name: "spTopUi" });
	port.postMessage({
		type: 'request',
		request: { 'type': 'sync' }
	});
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
//hideSearchPartyTopUi();
//showSearchPartyTopUi();

//clouds
//var DEFAULT_CLOUD_SHOW_OPTION = 'link_helpful';
//var g_cloudShowOption = DEFAULT_CLOUD_SHOW_OPTION;
//var g_actionColors = { search:'#888888', link:'#454C45', link_helpful:'#739c95', link_unhelpful:'#5C091F', answer:'blue' };
//
//var itemList = [ 'hey', 'hello', 'what', 'why' ];
//drawQueryCloud(itemList);

/**
 * "onConnect event is fired when a connection is made from an extension process or content script"
 */
chrome.extension.onConnect.addListener(function(port) {
	console.assert(port.name == "spTopUi");
	port.onMessage.addListener(function(message) {

		if (message.type == 'show_top_ui') {
			
			showSearchPartyTopUi();
			
			// Update task description
			if (message['task_description'] !== undefined) {
				$('#searchPartyTopFrame').contents().find('#sptask').html(message.task_description);
			}
			
			// Update response
			if (message['response'] !== undefined) {
				$('#searchPartyTopFrame').contents().find('#response').val(message.response.response);
			}
			
			// Update note
			if (message['response'] !== undefined) {
				$('#searchPartyTopFrame').contents().find('#explanation').val(message.response.explanation);
			}
			
			// Update timestamp
			if (message['response'] !== undefined) {
				$('#searchPartyTopFrame').contents().find('#response_saved').html(message.response.timestamp);
			}
			
			port.postMessage({
				type: 'acknowledgment',
				message: 'show_top_ui'
			});
			
		} else if (message.type == 'update_top_ui') {
			// Update Seach Party UI
			
			// Update task description
			if (message['task_description'] !== undefined) {
				$('#searchPartyTopFrame').contents().find('#sptask').html(message.task_description);
			}
			
			// Update response
			if (message['response'] !== undefined) {
				$('#searchPartyTopFrame').contents().find('#response').val(message.response.response);
			}
			
			// Update note
			if (message['response'] !== undefined) {
				$('#searchPartyTopFrame').contents().find('#explanation').val(message.response.explanation);
			}
			
			// Update timestamp
			if (message['response'] !== undefined) {
				$('#searchPartyTopFrame').contents().find('#response_saved').html(message.response.timestamp);
			}
			
		} else if (message.type == 'hide_top_ui') {
			
			hideSearchPartyTopUi();
			
		} else if (message.type == 'request') {
			
			if (message.request.type == 'answer') {
				if (message.request.timestamp != '') {
					var timestamp = getFormattedTimestamp(getLocalTime(new Date(message.request.timestamp)));
					$('#searchPartyTopFrame').contents().find('#response_saved').html('Saved ' + timestamp);
				}
			}
			
		}

	});
});

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






//=================================================================================
//Word Clouds
//=================================================================================

//function drawHistoryCloud(itemList, option) {		
//	g_cloudShowOption = (option == undefined) ? g_cloudShowOption : option;
//	var options = [];
//	options.push(getCloudOption('Helpful', 'link_helpful', 'drawHistoryCloud'));
//	options.push(getCloudOption('Unhelpful', 'link_unhelpful', 'drawHistoryCloud'));
//	options.push(getCloudOption('Unrated', 'link', 'drawHistoryCloud'));
//	var showOptions = { label:'Queries: ', options:options };
//	
//	drawCloud("tag_cloud", itemList, function(i, item) {
//		var link = item.query;
//		var url = '#';
//		var weight = g_cloudShowOption == 'link_helpful' ? item.ratings.helpful : (g_cloudShowOption == 'link_unhelpful' ? item.ratings.unhelpful : item.count-item.ratings.helpful-item.ratings.unhelpful);
//		return {link:link, url:url, weight:weight};
//	}, { show:showOptions, color:{start:g_actionColors[g_cloudShowOption], end:g_actionColors[g_cloudShowOption]}, className:'noLink' });
//}
//
//function drawQueryCloud(itemList, option) {		
//	g_cloudShowOption = (option == undefined) ? g_cloudShowOption : option;
//	var options = [];
//	options.push(getCloudOption('Helpful', 'link_helpful', 'drawQueryCloud'));
//	options.push(getCloudOption('Unhelpful', 'link_unhelpful', 'drawQueryCloud'));
//	options.push(getCloudOption('Unrated', 'link', 'drawQueryCloud'));
//	var showOptions = { label:'Show: ', options:options };
//	
//	drawCloud("tag_cloud", itemList, function(i, item) {
//		var link = item.query;
//		var url = "javascript:openAccordion("+i+");";
//		var weight = g_cloudShowOption == 'link_helpful' ? item.ratings.helpful : (g_cloudShowOption == 'link_unhelpful' ? item.ratings.unhelpful : item.count-item.ratings.helpful-item.ratings.unhelpful);
//		return {link:link, url:url, weight:weight};
//	}, { show:showOptions, color:{start:g_actionColors[g_cloudShowOption], end:g_actionColors[g_cloudShowOption]} });
//}
//
//function drawWordCloud(itemList, option) {	
//	g_cloudShowOption = (option == undefined) ? g_cloudShowOption : option;
//	var options = [];
//	options.push(getCloudOption('Helpful', 'link_helpful', 'drawWordCloud'));
//	options.push(getCloudOption('Unhelpful', 'link_unhelpful', 'drawWordCloud'));
//	options.push(getCloudOption('Unrated', 'link', 'drawWordCloud'));
//	var showOptions = { label:'Show: ', options:options };
//
//	drawCloud("tag_cloud", itemList, function(i, item) {
//		var link = item.wordsStr;
//		var url = "javascript:openAccordion("+i+");";
//		var weight = g_cloudShowOption == 'link_helpful' ? item.ratings.helpful : (g_cloudShowOption == 'link_unhelpful' ? item.ratings.unhelpful : item.count-item.ratings.helpful-item.ratings.unhelpful);
//		return {link:link, url:url, weight:weight};
//	}, { show:showOptions, color:{start:g_actionColors[g_cloudShowOption], end:g_actionColors[g_cloudShowOption]} });
//}
//
//function drawLinkCloud(itemList, option) {
//	g_cloudShowOption = (option == undefined) ? g_cloudShowOption : option;
//	var options = [];
//	options.push(getCloudOption('Helpful', 'link_helpful', 'drawLinkCloud'));
//	options.push(getCloudOption('Unhelpful', 'link_unhelpful', 'drawLinkCloud'));
//	options.push(getCloudOption('Unrated', 'link', 'drawLinkCloud'));
//	var showOptions = { label:'Show: ', options:options };
//
//	drawCloud("tag_cloud", itemList, function(i, item) {
//		var link = item.title;
//		var url = "javascript:openAccordion("+i+");";
//		var weight = g_cloudShowOption == 'link_helpful' ? item.ratings.helpful : (g_cloudShowOption == 'link_unhelpful' ? item.ratings.unhelpful : item.count-item.ratings.helpful-item.ratings.unhelpful);
//		return {link:link, url:url, weight:weight};
//	}, { show:showOptions, color:{start:g_actionColors[g_cloudShowOption], end:g_actionColors[g_cloudShowOption]} });
//}
//
//function drawAnswerCloud(itemList) {	
//	drawCloud("tag_cloud", itemList, function(i, item) {
//		var link = item.answerText;
//		var url = "javascript:openAccordion("+i+");";
//		var weight = item.count;
//		return {link:link, url:url, weight:weight};
//	});
//}
//
//function drawCloud(divName, itemList, getCloudDataFunc, options) {
//	var cloudHtml = '';
//	var maxWeight = 1;
//	$.each(itemList.items, function(i, item) {
//		var data = getCloudDataFunc(i, item);
//		if (data.weight>0) {
//			var link = data.link.length<=MAX_TAG_LENGTH ? data.link : data.link.substring(0,MAX_TAG_LENGTH)+"&hellip;";
//			link = link.replace("<", "&lt;").replace(">", "&gt;");
//			cloudHtml += '<a'+((options!=undefined && options.className!=undefined)?' class="'+options.className+'"':'')+' href="'+data.url+'" rel="'+data.weight+'" title="'+data.link+'">'+link+'</a>\n';
//			if (data.weight>maxWeight) maxWeight = data.weight;
//		}
//	});
//	if (cloudHtml == '') {
//		cloudHtml = '<span class="small">(none)</span>';
//	}
//	
//	// if items, show cloud options + html
//	if (itemList.items.length>0) {
//		var html = '';
//		if (options!=undefined && options.show!=undefined && options.show.options.length>0) {
//			html += '<div class="cloud_options display_options">'+options.show.label+options.show.options.join(' ')+'</div>';
//		}
//		html += '<div class="cloud"><p>'+cloudHtml+'</p></div>';
//		
//		var minFont = 10;
//		var maxFont = 26;
//		if (maxWeight<=2) {
//			maxFont = 16;
//		}
//		
//		var startColor = options!=undefined && options.color!=undefined && options.color.start!=undefined ? options.color.start : g_actionColors['link'];
//		var endColor = options!=undefined && options.color!=undefined && options.color.end!=undefined ? options.color.end : g_actionColors['link'];
//		
//		$("#"+divName).html(html);
//		$("#"+divName+" a").tagcloud({
//			size: {
//				start: minFont,
//				end: maxFont,
//				unit: 'pt'
//			},
//			color: {
//				start: startColor,
//				end: endColor
//			}
//		});
//	}
//}
//
//function getCloudOption(label, value, funcName, className) {
//	var isSelected = value==g_cloudShowOption;
//	if (isSelected) {
//		return '<strong>'+label+'</strong>';
//	}
//	else {
//		return '<a href="#" onclick="'+funcName+'(g_itemList,\''+value+'\'); return false;">'+label+'</a>';
//	}
//}
//
//function openAccordion(index) {
//	$('#task_activity').accordion({active:index});
//}