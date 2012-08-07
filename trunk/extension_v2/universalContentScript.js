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
		Note<br/> \
		<textarea rows="2" name="explanation" id="explanation" style="width:300px"></textarea><br/> \
		<button id="submit_response" name="submit_response">Save</button> \
		<span id="response_saved" class="note"></span> \
		</div> \
		\
		<div> \
		Page Rating<br/> \
		<input type="radio" id="helpful" name="rating" value="1"> Helpful</input> \
		<input type="radio" id="unhelpful" name="rating" value="0"> Unhelpful</input> \
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
//hideSearchPartyTopUi();
//showSearchPartyTopUi();

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
			
		} else if (message.type == 'hide_top_ui') {
			
			hideSearchPartyTopUi();
			
		}

	});
});