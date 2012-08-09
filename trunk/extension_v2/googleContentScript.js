var g_top_ui_visible = false;

var g_studentInfo = null;
var g_task_index = 0;

var g_groupQueriesWithSameWords = false;
MAX_TAG_LENGTH = 30;
var g_itemList = null;

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
		<div id="sptask" style="font-weight: normal; padding-bottom: 15px; font-size: 20px; width: 600px; color: #DD4B39;"></div> \
		\
		<div> \
		<div style="width: 300px; border: 1px solid red; float: left;"> \
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
		<div style="width: 600px; border: 1px solid red; float: left;"> \
		<div id="complete_history" class="complete_history"></div> \
		<div id="tag_cloud" class="tag_cloud"></div> \
		</div> \
		\
		<div style="clear: both;"></div> \
		\
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
	$("#knop").prepend('<div class="kno-mcl rhsvw" style="margin-bottom: 26px;"><div style="display:inline-block;margin-bottom:3px;position:relative;height:9px;left:-5px;top:-9px"><span style="background:#fff;font-size:medium;padding:0 5px">SP Query Cloud</span></div><a href="/search?hl=en&amp;q=birds+of+prey+tv+series&amp;stick=H4sIAAAAAAAAAONgUeLUz9U3MMnKLaoCAIjXUbINAAAA&amp;sa=X&amp;ei=7X4hUK3QO6O-2gX-94AY&amp;ved=0CKkBEOkTMBA" style="text-decoration:none;color:#000"><div class="kno-mec rhsvw kno-mecec kno-fb-ctx"><div class="kno-mecth"><div style="height:72px;overflow:hidden;width:72px"><img src="data:image/jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/2wBDAQoKCg0MDRoPDxo3JR8lNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzf/wAARCABuAEoDASIAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABAYDBQcBAggA/8QANxAAAgEDAwIFAQcDAwUBAAAAAQIDBAURABIhBjETIkFRYXEHFDJCgZGhI8HwsdHxM1JicqLh/8QAGQEAAwEBAQAAAAAAAAAAAAAAAgMEAAUB/8QAIhEAAgICAgIDAQEAAAAAAAAAAQIAEQMhEjEEQRMiUTKB/9oADAMBAAIRAxEAPwDJYIQeTomjjEz5U4TOB865VxNBQu4HJIX99T2eFi64zgY+mrCKNSC7UtGq1W0PGpUEDGc6sDRSqp7ADvjS51L1DU0JWjo2MBWMMzgDLE9gMjgfz9MaK6L6pp3jenvVWizE/wBOWTyqy+xPYH9tbkLqLbFk4cxPVZRLUnZMoyOVf1XS7XUBjkZSMFe+tCZ7XU1UcVPWwb5shMMCGI7gHsfpnVNe4fAfhVkwe/Hb/BpwAIk/yFWF6iHOm0YGhckaZnqlQktTo/tnHxn0+NVNXNTyzNI9GNx74kIGffA0hgRL8TgjuVxbXjOukY150ox4j3erHMLRJKi5CYc/QHnRPTNqaSJc55bIzp1pKZDmKXa0Lggq3qD6aHorbJbZ2SMeJD+Rvj2Oq2q7nLRjw4z9UdJWu5SRTzxt95jj2jDEK3OQGHqP99KF76S39XUVCKeOBJ4DO8kY8h8xBAGBn8ufrrS0qqWAo1dUQwE/gEsgUt9ATzpO+0XqqE11rp7PHUSV0RkXekJAdXUDYufxZIU8e3fOpcn7LvHZqo9TO+pWkgv9TD4sgaBvCySRtAGMD2A57f31dRjqW00qz1dI9bbSmTIW8QEEZ3bxllH140t1ElVeKuSqZfFlILyFFwF9ST+/c61/7LOoaO6WintEkqxXKkj2BW7Sxg8MPoCAR8Z1lbdw8y/SquIUQpbokj0j7ZB5mgYjcB7j3HyNUtXTlCcjnWq9bfZ1T1souNok+6znLSiOLyt/5ADGDz+uk3qRLdHBHFTQyJOhwzMScj5zyT86cGLjYkgVcZ03+RLkUg86jxo2ZM8gaFwfbSissVrE3WDG6Mg8k8D++rVAHUqy5U8Ee+kXpm91E2yHbv8A19NPdNvVQW4OO3fGqGnNT8g1d0lb7nF4bLNGSwJeGUocZ5Htgjj9ffQPRlhpuk7bWXzqZKemqjM/9WaYyeBFnCorEknPJ45ORpxpWSRRk47c6wutF/646rqbYs7SyfepXjhnkIipwDtJwOwACjgE/udTONy7CSwomBXq5Wmp6prLjZoZ4aV5vFiEiJjf6kKQwGTyAff00BXV1THWR1savDUbt7Tbz4pfuSSO30HbWjXn7JDRdLVtWLlPXXOmi8SJFTbGFXllVeSTgHHzjjWUB9yKxYlcFCM9sjj9P9tCD6j6m39IfaTR1FpWDqR5EqosbqlY9yyKfwkheQffAx68A6F6nsVHeB9+t0scsbjcHhYMrfQjWR0NU3hopzujGFcEg4//ADj9h7altd/uNirWqbZVNDJnMkeMxyj5Xt/nGNGj8NxGbx/l6NEQ6vpBTytHt5XjVcYxntpia+0nUSeeBKe4nlgv4H/9fX9D/OqpoJAxGw99UaYWJKrNjPF9GG2+segkAU9uNaL09dmqY1WWZS2OFHprJ6eRZOWJz7DTJ0vcY6WvXx2AiHJJGST7awIIi3Uqbmr0UkkbOGwY2YsoxyvuPkZ/11mk0b2D7ZqKSGMCOrrYpF835ZvI/wDLPp1tl5irZCFcADsNLH2pkU1dYrvSbTUwORg8FtjK65Pwd376VkQiO8XMrNVzagfT09tfLHWNrax9UXO3FBHElQxiUdvDY7k/+SNfR1uvUNfaqS5QKwhqollVW7qD6H5HbSF9stgS7WmO+0S7qmhG2cActCfX52k5+hb20gj3LFYXUxeF2iYlfcceh16rmjk2SxAqGByD6HOrC+WG5WOnoZLlCKd62EyJEx86qDjzD0J9v350Z0V0fcerqyanpHjhghAaeeQ5CZ7AAcknB/uRrA6qMr3IbH0tWXOkatEn3eAZ8J2Gd5B9MdgPfRRF1Q7PvtI23jcUOT/GtY6htMFtsIpI50iSlhRFHqQMKD6n/nWWyW+QSMCQDk5B1SmIBdTmv5DFyDVetSstsW9CQcHRkCCVxG2AJPJu9s8Z1YW2ySLGWwWAXJwCT+2h5KR4YY5XjdSjFZIyCpVlPIPGRrDU9b7EkTgv8lvkjWPgjcJPgj+x0NcOoqq5Twyuyyx00glijdMgtkd+eRx2412tt0tXcIqKjpQKurb/AKO4eTjOST2HcknGADnGme29FdJ01lqbleOoa6qhpZFjqJ7VCPAidsYVXcHxO45Ueo7aB8p6MoxePjB5gbldY+uL7aqOChWjpp6KEErGwYMFJLYDZ45PHHbWq9I9W2u9W4zxkwSodssEgw0Z/uD6H/jWbdY9HwWCenqLTV19bQTUkdS7yxYaBZCQhcgDAO09wMEY76onqqe21Mcn3yWKRlxL4abjt+hwDyPj10Fgi4TDehuab9q9jt166eqr3DJI1wooF8P+r5QgfLeX3wxOfgaN6E6tt79JUSinpqF0BR4YF2oGyfMB8jk/XWddXLcbNVSWe43gNTzwJLHIi7RLE/Y49M4II0vQ1fgxpT0tduC8BQv+e+vUUEzMW4V7jndOo3uU4qJXBYBQF28HaS3+pz+mqB5oHdneMuzEksZQCT741X+L4ZAVixxqEyHP4RroArWpAuM3c0TquBYEovB308ZLfgGckAYJHqOe3uRpXs9O9VeJqeSSVYpYy7sw9dwG4jjkZP8Ag1DDVvWTpBFK02WMkuEbG4gAMRgjOBj0/jGirHXUtmvc73ISiP7uY12LuOSykZ7egPOoS6kylUZEKjZlonQsxaTxLg0ashSRhDITIpOcE4HHHb6aurTGE6Om6esMkcl0Fz8apiqKMyFECYV9hjYclUI47cjSPV9RVzSIW8AxSgq6RDaCMcH1IPI5+PTTX0Zcqmr6a6llWpa3UVHRxpRLTtIiQySEqWYoN0kgwCSdxyeMA6BiK1GYla7Yxqv0lkq77VCVJHqql7fDsqKSXJjSUvNtVlyFKEg4GOD86XZaqyND1BFW9P262zRipS11dZbVjWctIxTGY8eRAnfnzHRd46hs89Nbak1NbU1dGi0KvJIomkUU8u6o2nPlLMqkt88ZxrnUlJZ7vXVtrrbhI08CMLczVAjWQyeFs2ngOSfEPl4xtHcHSpQDLbqCrslaLtUQW+2XOps9JBVxvURRvHUUojOUV8HADEngcnAyOSMMkR6aoaoCIpYngLhRn2Ht7abOuax6PqS/220yJSW5ZkgaOEBdyxIoCZ77QwJwMAkknOlaKN6rJM28LzjTEWBkf9OpI0hCjnvoYuc67KWThhjGhDOue+qDkA7ikS5Z02UndY3mV5FMeYyBlGwGByfbXva0t4hWuLyPuXxGkYOW4H5gef39BrtC0NNI1VMGdI0BKgDJJPH8jU012hkr4aqOiQBVDKpbbz25wPjUig8oZJ6EIutGgVY4p0aRdoIcgHIVQT39SD+2ibZXywW+Silr8QbtyU/lVC/HnbH4jxgE5xoeC/11L4sVDIsaTy723xq5U8ZwSM4IA1G/Wl4Bk8N4o/EdmYrHnkgA4DEj0GPUY44JGj6ngUkVckdZJHZmqact+EHaMqPj21J9/rbZULPSSQrVd1n8NWaMj8y7sgHHrjI9MaGHW12jeBwKbMKsqDwiowTnG1SF+nHx21HH1VdGiSLdCFWHwc+EC2zaqkAnleEU+XHKgjBzncr1UwxkG7gssihHaaQSSyEsxL7mYk8kn1OfXU9vtc09C1VBLFGnjGEZ3Fi+0N2A9j/B9te7j1BcK6impqponimlErHZhgRjAHoBwPTQNJdK2kgkhpaho4pSGdABhiO2iAMxFy+6o6Tr7Db6WquNRSSxVDCNRBIS27ZuJxjGPnPr20p/d4v+59WFXdq+so6Wkqql5KamQLFEWO1cZAOPUgcA+wA0Dg++ho+4d1/M/9k=" alt="Birds of Prey" border="0" height="107" id="kpthumb16" style="margin-top:-12px" width="72"></div></div><div class="kno-mect"><div class="kno-mecti ellip"><span class="fl" style="color:#12c">CLOUD TEST</span></div><div class="ellip kno-mecm">TV series&nbsp;</div><div class="kno-mecd" style="overflow:hidden;padding:1px 0"><div class="krable" data-ved="0CKkBEOkTMBA" style="float:right;margin-left:5px"></div><div><span>Birds of Prey is a television drama series</span><span class="rhsg3"> produced in 2002. The series</span><span class="rhsg4"> was developed by Laeta Kalogridis</span><span> ...</span></div></div></div></div></a></div>');
	
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
var DEFAULT_CLOUD_SHOW_OPTION = 'link';
var g_cloudShowOption = DEFAULT_CLOUD_SHOW_OPTION;
var g_actionColors = { search:'#888888', link:'#454C45', link_helpful:'#739c95', link_unhelpful:'#5C091F', answer:'blue' };
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
			
			// Update task index
			if (message['task_index'] !== undefined) {
				//$('#searchPartyTopFrame').contents().find('#sptask').html(message.task_description);
				g_task_index = message.task_index;
			}
			
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
			
			// Update task index
			if (message['task_index'] !== undefined) {
				//$('#searchPartyTopFrame').contents().find('#sptask').html(message.task_description);
				g_task_index = message.task_index;
			}
			
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

var g_students = {
		  "Mike": {
			    "logged_in": true,
			    "task_idx": 0,
			    "task_history": [
			      [
			        {
			          "activity_type": "search",
			          "search": "birdofprey",
			          "link": "https: //www.google.com/search?hl=en&site=&source=hp&q=bird+of+prey&oq=bird+of+prey&gs_l=hp.3..5j0l9.58067.59330.0.59487.12.12.0.0.0.0.156.1219.6j6.12.0...0.0...1c.5OOFirfb8kA",
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201217: 33: 17",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "answer",
			          "search": null,
			          "link": null,
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": "rapere",
			          "answer_explanation": "",
			          "timestamp": "August08, 201217: 33: 51",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "search",
			          "search": "contentscriptdocumentready",
			          "link": "https: //www.google.com/search?q=content+script+document+ready&sugexp=chrome, mod=11&sourceid=chrome&ie=UTF-8",
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201217: 37: 34",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "answer",
			          "search": null,
			          "link": null,
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": "rapere",
			          "answer_explanation": "",
			          "timestamp": "August08, 201217: 48: 31",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "answer",
			          "search": null,
			          "link": null,
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": "rapere",
			          "answer_explanation": "notetest",
			          "timestamp": "August08, 201217: 58: 17",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //c/",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201218: 16: 21",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "search",
			          "search": "define: duo",
			          "link": "https: //www.google.com/search?q=define%3A+duo&sugexp=chrome, mod=11&sourceid=chrome&ie=UTF-8",
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201218: 56: 00",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "search",
			          "search": "umdalerts",
			          "link": "https: //www.google.com/search?q=umd+alerts&aq=f&sugexp=chrome, mod=11&sourceid=chrome&ie=UTF-8",
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201219: 02: 14",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "umdalerts",
			          "link": "https: //alert.umd.edu/index.php?CCheck=1",
			          "link_title": "UMDAlerts",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201219: 02: 19",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/?ui=2&view=btop&ver=d2splbkr2oxk#lhs@google.com",
			          "link_title": "Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201221: 26: 49",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "answer",
			          "search": null,
			          "link": null,
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": "rapere",
			          "answer_explanation": "notetest",
			          "timestamp": "August08, 201222: 27: 45",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "answer",
			          "search": null,
			          "link": null,
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": "rapere",
			          "answer_explanation": "notetest",
			          "timestamp": "August09, 201200: 20: 49",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=new",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 44: 17",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d70780cfd48",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 44: 35",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d738ff3b43f",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 44: 48",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d771b713a21",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 45: 01",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d79c6af4947",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 45: 13",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d7aab7a229f",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 45: 16",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d7d76688b1b",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 45: 28",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d8138b546a4",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 45: 43",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d8237594c5f",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 45: 47",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d833a1bf259",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 45: 51",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d8561d0ac60",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 46: 00",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d8797248112",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 46: 09",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d8c57bba208",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 46: 29",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "search",
			          "search": "define: undue",
			          "link": "https: //www.google.com/search?q=define%3A+undue&sugexp=chrome, mod=11&sourceid=chrome&ie=UTF-8",
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 46: 34",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "define: undue",
			          "link": "https: //www.google.com/search?q=define%3A+undue&sugexp=chrome, mod=11&sourceid=chrome&ie=UTF-8",
			          "link_title": "define: undue-GoogleSearch",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 46: 36",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d921d46a167",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 46: 51",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d94e68c324e",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 47: 04",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d96892bebd7",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 47: 10",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d9b03a196fa",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 47: 29",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d9f0a83b352",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 47: 46",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908da317bdf553",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 48: 02",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908da47dfc64c5",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 48: 07",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908da613baff5b",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 48: 14",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908da83dd36d91",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 48: 23",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dab8f98a44a",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 48: 37",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908daf02305a71",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 48: 51",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908db0b3286fe5",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 48: 57",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908db17483869e",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 49: 01",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908db764a229be",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 49: 25",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908db9b6581513",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 49: 35",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dc2f9574640",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 50: 12",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dc462b489da",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 50: 19",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dc71f78cc2d",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 50: 29",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dc99c03b344",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 50: 40",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dcbcd41e607",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 50: 49",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dcda3651e5c",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 50: 56",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dd06148d888",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 51: 08",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dd28be131a1",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 51: 16",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dd539ac47f0",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 51: 27",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dd7ef570cb6",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 51: 38",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dda9bf1deba",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 51: 49",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ddd4ea4dd02",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 52: 00",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908de02b3cd972",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 52: 12",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908de3deca1ae8",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 52: 27",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908de82a51ee8d",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 52: 45",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908de9cd505575",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 52: 51",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908deca9ab9a0e",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 53: 03",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dedbf1114b9",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 53: 08",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908deff63488b9",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 53: 17",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908df8b73b23bf",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 53: 52",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dfcdef9328e",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 54: 10",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dff1795145b",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 54: 19",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e01f51d33c0",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 54: 30",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e0478ee0e6f",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 54: 40",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e08517768d8",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 54: 56",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e0b3563b597",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 55: 08",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e0e6fbefd29",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 55: 22",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e12a483d615",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 55: 39",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e158642a716",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 55: 51",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e17760c670f",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 55: 58",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e1a9ad85e78",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 56: 11",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e1d66736746",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 56: 23",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e1f6863e8b0",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 56: 31",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e2223b037b4",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 56: 44",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e27a7cda699",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 57: 04",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e2abc0303a4",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 57: 17",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e2d32a972a7",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 57: 27",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e2fbae9cc4e",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 57: 38",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e32856b4dc7",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 57: 49",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e350cebd1d7",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 58: 00",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e388f03daa9",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 58: 14",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e3b75ca45af",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 58: 26",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e3d8e2ad243",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 58: 35",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e40ac27355a",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 58: 48",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e428b70a10e",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 58: 56",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e448c62b361",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 59: 04",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e464f38211f",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 59: 11",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e47c8fb87cf",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 59: 16",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e4af4872054",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 59: 30",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e4d563e5e48",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201200: 59: 40",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e537b9be9c4",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 00: 05",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e548b158e92",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 00: 09",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e58062bc508",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 00: 23",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e5b66d0b4e8",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 00: 37",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e5f87c7c631",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 00: 54",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "define: undue",
			          "link": "chrome: //newtab/",
			          "link_title": "NewTab",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 01: 06",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "search",
			          "search": "define: contension",
			          "link": "https: //www.google.com/search?q=define%3A+contension&sugexp=chrome, mod=11&sourceid=chrome&ie=UTF-8",
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 01: 08",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e6a438fc4f4",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 01: 37",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e6d2c2b41d1",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 01: 50",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e706f385c78",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 02: 03",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e786f495bfb",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 02: 35",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e7cde08a583",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 02: 54",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e7fdce57394",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 03: 06",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e81f7b0278e",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 03: 15",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e8650816700",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 03: 32",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e8b0b287224",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 03: 52",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e8f495e0756",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 04: 10",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e9198845532",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 04: 19",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e94dceeecbb",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 04: 32",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e96bd5964be",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 04: 40",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e98ea7d690f",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 04: 49",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e9c01eafe5a",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 05: 02",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e9ea7b6a752",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 05: 13",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ea1e4aaea46",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 05: 26",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ea567db847f",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 05: 40",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ea823827857",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 05: 51",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eab1f480325",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 06: 03",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eabea68c458",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 06: 07",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eafeb976cb9",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 06: 23",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eb2a0a8e092",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 06: 34",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eb614d75fbc",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 06: 48",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eb70a546a21",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 06: 52",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ebc75a793ae",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 07: 14",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ec08ce63d15",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 07: 31",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ec75085b511",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 07: 59",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ecc9341798a",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 08: 20",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ecf8da286ec",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 08: 33",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ed3365276e1",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 08: 47",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ed6aca53768",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 09: 02",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908edb44b944a8",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 09: 21",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ede4cf81d38",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 09: 33",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ee2ecb1f008",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 09: 52",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ee6ab2c3eb9",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 10: 07",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eeb7a750236",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 10: 27",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eef3a18317e",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 10: 42",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ef1c1d5c693",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 10: 53",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ef42344fac8",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 11: 03",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ef63fa42c47",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 11: 11",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908efaadd90caa",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 11: 29",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908efcdd6c0f86",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 11: 38",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f0030f95e93",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 11: 52",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f032db2e603",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 12: 04",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f05a1aef914",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 12: 14",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f087e4be62e",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 12: 25",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f0f24cd77cb",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 12: 53",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f1507739315",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 13: 17",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f1bd182a040",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 13: 45",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f1dfc631049",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 13: 54",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f22729faf91",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 14: 12",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f25ff0dbc2f",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 14: 26",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f295438e9be",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 14: 40",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f2dba9e56e1",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 14: 58",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f30eabc823b",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 15: 11",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f35d1bed8e2",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 15: 31",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f3ba91ddf57",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 15: 55",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5",
			          "link_title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 15: 58",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox",
			          "link_title": "Inbox(23)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 16: 08",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox",
			          "link_title": "Inbox(22)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 16: 14",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //gmail.com/",
			          "link_title": "Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 16: 49",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox",
			          "link_title": "Inbox(22)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 16: 52",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#sent",
			          "link_title": "SentMail-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 16: 54",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "search",
			          "search": "sidebysidediv",
			          "link": "https: //www.google.com/search?q=side+by+side+div&sugexp=chrome, mod=11&sourceid=chrome&ie=UTF-8",
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 18: 27",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "sidebysidediv",
			          "link": "http: //welovecss.com/showthread.php?t=465",
			          "link_title": "Placing2DIVssidebyside..-WeLoveCSS",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 18: 35",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/138ed95ed6e87f79",
			          "link_title": "Inbox(22)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 24: 17",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox",
			          "link_title": "Inbox(15)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 24: 29",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox",
			          "link_title": "Inbox(14)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 24: 31",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox",
			          "link_title": "Inbox(13)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 24: 35",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox",
			          "link_title": "Inbox(12)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 24: 38",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/138fcebcee3a0996",
			          "link_title": "Inbox(12)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 26: 05",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox",
			          "link_title": "Inbox(11)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 26: 06",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox/13907862e644cf17",
			          "link_title": "Inbox(12)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 38: 19",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //mail.google.com/mail/u/0/#inbox",
			          "link_title": "Inbox(11)-mrgubbels@google.com-Google.comMail",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 38: 21",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //localhost: 8080/",
			          "link_title": "SearchParty",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 38: 59",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //localhost: 8080/student_login",
			          "link_title": "SearchParty-StudentLogin",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 39: 03",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //localhost: 8080/",
			          "link_title": "SearchParty",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 39: 05",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //localhost: 8080/_ah/login?continue=http%3A//localhost%3A8080/teacher_login",
			          "link_title": "Login",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 39: 06",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //localhost: 8080/teacher_dashboard",
			          "link_title": "SearchParty-TeacherDashboard",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 39: 10",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //localhost: 8080/teacher/50518#students",
			          "link_title": "SearchParty-TeacherView",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 39: 21",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //localhost: 8080/teacher/50518#complete",
			          "link_title": "SearchParty-TeacherView",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 39: 24",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "search",
			          "search": "javascriptformatobjectasjson",
			          "link": null,
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 45: 22",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "javascriptformatobjectasjson",
			          "link": "http: //www.w3schools.com/json/default.asp",
			          "link_title": "JSONTutorial",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 45: 25",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "search",
			          "search": "serializejsononchromeconsole",
			          "link": null,
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 47: 49",
			          "student_nickname": "Mike"
			        },
			        {
			          "activity_type": "link",
			          "search": "serializejsononchromeconsole",
			          "link": "http: //blog.maxaller.name/2011/01/javascript-serialization/",
			          "link_title": "JavascriptSerialization�occasionallyuseful",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August09, 201201: 48: 15",
			          "student_nickname": "Mike"
			        }
			      ],
			      [
			        {
			          "activity_type": "answer",
			          "search": null,
			          "link": null,
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": "nope",
			          "answer_explanation": "",
			          "timestamp": "August09, 201200: 36: 21",
			          "student_nickname": "Mike"
			        }
			      ]
			    ],
			    "tasks": [
			      {
			        "searches": [
			          {
			            "query": "birdofprey",
			            "links_followed": [
			              
			            ]
			          },
			          {
			            "query": "contentscriptdocumentready",
			            "links_followed": [
			              
			            ]
			          },
			          {
			            "query": "<empty>",
			            "links_followed": [
			              {
			                "url": "http: //c/",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/?ui=2&view=btop&ver=d2splbkr2oxk#lhs@google.com",
			                "title": "Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=new",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d70780cfd48",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d738ff3b43f",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d771b713a21",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d79c6af4947",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d7aab7a229f",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d7d76688b1b",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d8138b546a4",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d8237594c5f",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d833a1bf259",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d8561d0ac60",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d8797248112",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d8c57bba208",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d921d46a167",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d94e68c324e",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d96892bebd7",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d9b03a196fa",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908d9f0a83b352",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908da317bdf553",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908da47dfc64c5",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908da613baff5b",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908da83dd36d91",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dab8f98a44a",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908daf02305a71",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908db0b3286fe5",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908db17483869e",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908db764a229be",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908db9b6581513",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dc2f9574640",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dc462b489da",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dc71f78cc2d",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dc99c03b344",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dcbcd41e607",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dcda3651e5c",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dd06148d888",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dd28be131a1",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dd539ac47f0",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dd7ef570cb6",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dda9bf1deba",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ddd4ea4dd02",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908de02b3cd972",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908de3deca1ae8",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908de82a51ee8d",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908de9cd505575",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908deca9ab9a0e",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dedbf1114b9",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908deff63488b9",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908df8b73b23bf",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dfcdef9328e",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908dff1795145b",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e01f51d33c0",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e0478ee0e6f",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e08517768d8",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e0b3563b597",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e0e6fbefd29",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e12a483d615",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e158642a716",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e17760c670f",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e1a9ad85e78",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e1d66736746",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e1f6863e8b0",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e2223b037b4",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e27a7cda699",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e2abc0303a4",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e2d32a972a7",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e2fbae9cc4e",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e32856b4dc7",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e350cebd1d7",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e388f03daa9",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e3b75ca45af",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e3d8e2ad243",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e40ac27355a",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e428b70a10e",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e448c62b361",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e464f38211f",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e47c8fb87cf",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e4af4872054",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e4d563e5e48",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e537b9be9c4",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e548b158e92",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e58062bc508",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e5b66d0b4e8",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e5f87c7c631",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e6a438fc4f4",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e6d2c2b41d1",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e706f385c78",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e786f495bfb",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e7cde08a583",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e7fdce57394",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e81f7b0278e",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e8650816700",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e8b0b287224",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e8f495e0756",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e9198845532",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e94dceeecbb",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e96bd5964be",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e98ea7d690f",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e9c01eafe5a",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908e9ea7b6a752",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ea1e4aaea46",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ea567db847f",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ea823827857",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eab1f480325",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eabea68c458",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eafeb976cb9",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eb2a0a8e092",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eb614d75fbc",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eb70a546a21",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ebc75a793ae",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ec08ce63d15",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ec75085b511",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ecc9341798a",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ecf8da286ec",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ed3365276e1",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ed6aca53768",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908edb44b944a8",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ede4cf81d38",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ee2ecb1f008",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ee6ab2c3eb9",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eeb7a750236",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908eef3a18317e",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ef1c1d5c693",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ef42344fac8",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908ef63fa42c47",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908efaadd90caa",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908efcdd6c0f86",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f0030f95e93",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f032db2e603",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f05a1aef914",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f087e4be62e",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f0f24cd77cb",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f1507739315",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f1bd182a040",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f1dfc631049",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f22729faf91",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f25ff0dbc2f",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f295438e9be",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f2dba9e56e1",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f30eabc823b",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f35d1bed8e2",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5?compose=13908f3ba91ddf57",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/139071a5b57011a5",
			                "title": "WeekendTripIdeas-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox",
			                "title": "Inbox(23)-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox",
			                "title": "Inbox(22)-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "http: //gmail.com/",
			                "title": "Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox",
			                "title": "Inbox(22)-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#sent",
			                "title": "SentMail-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/138ed95ed6e87f79",
			                "title": "Inbox(22)-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox",
			                "title": "Inbox(15)-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox",
			                "title": "Inbox(14)-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox",
			                "title": "Inbox(13)-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox",
			                "title": "Inbox(12)-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/138fcebcee3a0996",
			                "title": "Inbox(12)-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox",
			                "title": "Inbox(11)-mrgubbels@google.com-Google.comMail",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox/13907862e644cf17",
			                "title": "Inbox(12)-mrgubbels@google.com-Google.comMail"
			              },
			              {
			                "url": "https: //mail.google.com/mail/u/0/#inbox",
			                "title": "Inbox(11)-mrgubbels@google.com-Google.comMail"
			              },
			              {
			                "url": "http: //localhost: 8080/",
			                "title": "SearchParty"
			              },
			              {
			                "url": "http: //localhost: 8080/student_login",
			                "title": "SearchParty-StudentLogin"
			              },
			              {
			                "url": "http: //localhost: 8080/",
			                "title": "SearchParty"
			              },
			              {
			                "url": "http: //localhost: 8080/_ah/login?continue=http%3A//localhost%3A8080/teacher_login",
			                "title": "Login"
			              },
			              {
			                "url": "http: //localhost: 8080/teacher_dashboard",
			                "title": "SearchParty-TeacherDashboard"
			              },
			              {
			                "url": "http: //localhost: 8080/teacher/50518#students",
			                "title": "SearchParty-TeacherView"
			              },
			              {
			                "url": "http: //localhost: 8080/teacher/50518#complete",
			                "title": "SearchParty-TeacherView"
			              }
			            ]
			          },
			          {
			            "query": "define: duo",
			            "links_followed": [
			              
			            ]
			          },
			          {
			            "query": "umdalerts",
			            "links_followed": [
			              {
			                "url": "https: //alert.umd.edu/index.php?CCheck=1",
			                "title": "UMDAlerts",
			                "is_helpful": null
			              }
			            ]
			          },
			          {
			            "query": "define: undue",
			            "links_followed": [
			              {
			                "url": "https: //www.google.com/search?q=define%3A+undue&sugexp=chrome, mod=11&sourceid=chrome&ie=UTF-8",
			                "title": "define: undue-GoogleSearch",
			                "is_helpful": null
			              },
			              {
			                "url": "chrome: //newtab/",
			                "title": "NewTab",
			                "is_helpful": null
			              }
			            ]
			          },
			          {
			            "query": "define: contension",
			            "links_followed": [
			              
			            ]
			          },
			          {
			            "query": "sidebysidediv",
			            "links_followed": [
			              {
			                "url": "http: //welovecss.com/showthread.php?t=465",
			                "title": "Placing2DIVssidebyside..-WeLoveCSS",
			                "is_helpful": null
			              }
			            ]
			          },
			          {
			            "query": "javascriptformatobjectasjson",
			            "links_followed": [
			              {
			                "url": "http: //www.w3schools.com/json/default.asp",
			                "title": "JSONTutorial"
			              }
			            ]
			          },
			          {
			            "query": "serializejsononchromeconsole",
			            "links_followed": [
			              {
			                "url": "http: //blog.maxaller.name/2011/01/javascript-serialization/",
			                "title": "JavascriptSerialization�occasionallyuseful"
			              }
			            ]
			          }
			        ],
			        "answer": {
			          "text": "rapere",
			          "explanation": "notetest"
			        }
			      },
			      {
			        "searches": [
			          
			        ],
			        "answer": {
			          "text": "nope",
			          "explanation": ""
			        }
			      }
			    ]
			  },
			  "Mike-2": {
			    "logged_in": false,
			    "task_idx": 0,
			    "task_history": [
			      [
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //www.coursera.org/",
			          "link_title": "Coursera",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 24: 08",
			          "student_nickname": "Mike-2"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //google.com/",
			          "link_title": "NewTab",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 37: 17",
			          "student_nickname": "Mike-2"
			        },
			        {
			          "activity_type": "search",
			          "search": "birdofprey",
			          "link": "https: //www.google.com/#hl=en&gs_nf=1&tok=m9rn4160v6mCJXJZzZIf7w&cp=10&gs_id=11&xhr=t&q=bird+of+prey&pf=p&safe=active&output=search&sclient=psy-ab&oq=bird+of+pr&gs_l=&pbx=1&bav=on.2, or.r_gc.r_pw.r_cp.r_qf.&fp=46e1661602240d8a&biw=1680&bih=952",
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 37: 36",
			          "student_nickname": "Mike-2"
			        },
			        {
			          "activity_type": "search",
			          "search": "birdofprey",
			          "link": "https: //www.google.com/#hl=en&gs_nf=1&tok=m9rn4160v6mCJXJZzZIf7w&cp=10&gs_id=11&xhr=t&q=bird+of+prey&pf=p&safe=active&output=search&sclient=psy-ab&oq=bird+of+pr&gs_l=&pbx=1&bav=on.2, or.r_gc.r_pw.r_cp.r_qf.&fp=46e1661602240d8a&biw=1680&bih=952",
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 37: 42",
			          "student_nickname": "Mike-2"
			        },
			        {
			          "activity_type": "link",
			          "search": "birdofprey",
			          "link": "http: //en.wikipedia.org/wiki/Bird_of_prey",
			          "link_title": "Birdofprey-Wikipedia, thefreeencyclopedia",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 39: 06",
			          "student_nickname": "Mike-2"
			        },
			        {
			          "activity_type": "search",
			          "search": "birdofprey",
			          "link": "https: //www.google.com/#hl=en&gs_nf=1&tok=m9rn4160v6mCJXJZzZIf7w&cp=10&gs_id=11&xhr=t&q=bird+of+prey&pf=p&safe=active&output=search&sclient=psy-ab&oq=bird+of+pr&gs_l=&pbx=1&bav=on.2, or.r_gc.r_pw.r_cp.r_qf.&fp=46e1661602240d8a&biw=1680&bih=952",
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 39: 23",
			          "student_nickname": "Mike-2"
			        },
			        {
			          "activity_type": "search",
			          "search": "fakehackersite",
			          "link": "https: //www.google.com/search?sugexp=chrome, mod=19&sourceid=chrome&ie=UTF-8&q=fake+hacker+site",
			          "link_title": null,
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 42: 13",
			          "student_nickname": "Mike-2"
			        },
			        {
			          "activity_type": "link",
			          "search": "fakehackersite",
			          "link": "http: //hackertyper.net/",
			          "link_title": "HackerTyper",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 42: 17",
			          "student_nickname": "Mike-2"
			        },
			        {
			          "activity_type": "link",
			          "search": "fakehackersite",
			          "link": "http: //hackertyper.net/134446936276",
			          "link_title": "HackerTyper",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 42: 21",
			          "student_nickname": "Mike-2"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //www.blackle.com/",
			          "link_title": "Blackle-EnergySavingSearch",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 42: 56",
			          "student_nickname": "Mike-2"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "http: //google.com/+",
			          "link_title": "NewTab",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 46: 59",
			          "student_nickname": "Mike-2"
			        },
			        {
			          "activity_type": "link",
			          "search": "<empty>",
			          "link": "https: //plus.google.com/",
			          "link_title": "Google+",
			          "is_helpful": null,
			          "answer_text": null,
			          "answer_explanation": null,
			          "timestamp": "August08, 201223: 47: 13",
			          "student_nickname": "Mike-2"
			        }
			      ],
			      [
			        
			      ]
			    ],
			    "tasks": [
			      {
			        "searches": [
			          {
			            "query": "<empty>",
			            "links_followed": [
			              {
			                "url": "https: //www.coursera.org/",
			                "title": "Coursera",
			                "is_helpful": null
			              },
			              {
			                "url": "http: //google.com/",
			                "title": "NewTab",
			                "is_helpful": null
			              },
			              {
			                "url": "http: //www.blackle.com/",
			                "title": "Blackle-EnergySavingSearch",
			                "is_helpful": null
			              },
			              {
			                "url": "http: //google.com/+",
			                "title": "NewTab",
			                "is_helpful": null
			              },
			              {
			                "url": "https: //plus.google.com/",
			                "title": "Google+",
			                "is_helpful": null
			              }
			            ]
			          },
			          {
			            "query": "birdofprey",
			            "links_followed": [
			              {
			                "url": "http: //en.wikipedia.org/wiki/Bird_of_prey",
			                "title": "Birdofprey-Wikipedia, thefreeencyclopedia",
			                "is_helpful": null
			              }
			            ]
			          },
			          {
			            "query": "fakehackersite",
			            "links_followed": [
			              {
			                "url": "http: //hackertyper.net/",
			                "title": "HackerTyper",
			                "is_helpful": null
			              },
			              {
			                "url": "http: //hackertyper.net/134446936276",
			                "title": "HackerTyper",
			                "is_helpful": null
			              }
			            ]
			          }
			        ],
			        "answer": {
			          "text": "",
			          "explanation": ""
			        }
			      },
			      {
			        "searches": [
			          
			        ],
			        "answer": {
			          "text": "",
			          "explanation": ""
			        }
			      }
			    ]
			  }
			};

updateCompleteHistory();
//alert("updateCompleteHistory() completed")

function updateCompleteHistory() {			
	var accumulator = new QueryAccumulator();
	$.each(g_students, function (studentNickname, studentInfo) {
		//$.each(studentInfo.tasks[selectedTaskIdx()].searches, function (i,searchInfo) {
		$.each(studentInfo.tasks[g_task_index].searches, function (i, searchInfo) {
			var isHelpful = searchIsHelpful(searchInfo);
			accumulator.add(searchInfo.query, studentNickname, isHelpful);
			//alert(searchInfo.query);
		});
	});
//	alert("A");
	accumulator.setSort('ABC');
	var itemList = accumulator.getItems();
//	alert("B");
	//updateAnyWithItems(itemList);
//	alert("C");
	$('#pane_title').html('Complete History');
	$('#task_activity').hide();
//	alert("D");
	if (itemList.hasItems()) {
//		alert("E");
		var saveState2 = g_groupQueriesWithSameWords;
		g_groupQueriesWithSameWords=true;
		drawHistoryCloud(itemList);
		//listCompleteStudentHistories();
		g_groupQueriesWithSameWords = saveState2;
	}
}

function selectedTaskIdx() {
	return g_task_index;
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
//Word Clouds
//=================================================================================

function drawHistoryCloud(itemList, option) {
	alert("drawHistoryCloud() called");
	g_cloudShowOption = (option == undefined) ? g_cloudShowOption : option;
//	alert("1");
	var options = [];
	options.push(getCloudOption('Helpful', 'link_helpful', 'drawHistoryCloud'));
	options.push(getCloudOption('Unhelpful', 'link_unhelpful', 'drawHistoryCloud'));
	options.push(getCloudOption('Unrated', 'link', 'drawHistoryCloud'));
	var showOptions = { label:'Queries: ', options:options };
	
//	alert("2");
	
//	alert("itemList = " + itemList);
	
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
	alert("drawCloud() called");
	var cloudHtml = '';
	var maxWeight = 1;
	$.each(itemList.items, function(i, item) {
		var data = getCloudDataFunc(i, item);
		//alert(data.link);
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
	var isSelected = value==g_cloudShowOption;
	if (isSelected) {
		return '<strong>'+label+'</strong>';
	}
	else {
		//$('#searchPartyTopFrame').contents().find('#response').val();
		//var $f = $('#searchPartyTopFrame').contentWindow.;
		//return '<a href="javascript:$(\'#searchPartyTopFrame\').contentWindow.' + funcName + '(g_itemList, \''+value+'\');">' + label + '</a>';
		//return '<a href="javascript:parent.' + funcName + '(g_itemList, \''+value+'\');">' + label + '</a>';
		return '<a href="javascript:alert(\'' + parent.location.href + '\');">' + label + '</a>';
	}
}

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