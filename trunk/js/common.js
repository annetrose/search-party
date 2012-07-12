function clipText(s, maxLength) {
	var dots = "...";
	var sLength = s.length;
	if(sLength > maxLength) {
		s = s.substr(0, maxLength - dots.length) + dots;
	}
	return s;
}

function makeLinkHTML(linkInfo, maxLength, className, onclick) {
	var url = linkInfo.url;
	var title = linkInfo.title;
	url = escapeForHtml(url);
	var displayTitle;

	if(maxLength !== null && maxLength !== 0) {
		displayTitle = clipText(title, maxLength);
	}
	else {
		displayTitle = title;
	}
	displayTitle = escapeForHtml( displayTitle );
	var moreAttrs = "";
	if(className) {
		moreAttrs += ' class="' + className + '"';
	}
	if(onclick) {
		moreAttrs += ' onclick="' + onclick + '"';
	}
	var linkHTML = '<a href="' + url + '" title="' + title + '" target="_blank" ' + moreAttrs + '>' + displayTitle + '</a>';

	return linkHTML;
}

function log(arg1, arg2) {
	var hasName = (arg2!==undefined);
	var name = (hasName ? arg1 : null);
	var value = (hasName ? arg2 : arg1);
	if((typeof value) !== "string") {
		value = JSON.stringify(value);
	}
	var s = (hasName ? (name + " == " + value) : value);
	s = escapeForHtml(s);

	if((typeof console) != "undefined") {
		console.log(s);
	}
	if(window.DEBUG_MODE) {
		var numRows = log._numRows;
		var style = "";
		var cls = (numRows % 2 == 0 ? "even" : "odd");
		var rowHtml = '<tr class="dbg_log ' + cls + '"><td align="right">' + (log._numRows+1) + '.</td><td>' + makeTimestamp() + '</td><td>' + s + '</td></tr>';
		if(numRows==0) {
			$("#dbg_log_container").append('<table id="dbg_log_table">' + rowHtml + "</table>")
		}
		else {
			$("#dbg_log_table").prepend(rowHtml);
		}
		log._numRows += 1;
	}
}
log._numRows = 0

function escapeForHtml(s) {
	return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");
}

function makeTimestamp() {
	return (new Date()).toLocaleTimeString();
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
    var date =  month + '/' + day + '/'+ (ts.getFullYear()+'').substr(2);
    var hours = ''+ts.getHours();
    var mins = ''+ts.getMinutes();
    if (mins.length == 1) mins = '0' + mins;
    var time = hours + ':' + mins;
    return date + '&nbsp;' + time;
}

function getFormattedNumericDate(ts) {
    var month = ''+(ts.getMonth()+1);
    if (month.length==1) month = '0' + month;
    var day = ''+ts.getDate();
    if (day.length == 1) day = '0' + day;
    return month + '/' + day + '/'+ ts.getFullYear();
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

THUMBS_UP_URL = "/imgs/check.png"; 
THUMBS_DOWN_URL = "/imgs/no.png";
