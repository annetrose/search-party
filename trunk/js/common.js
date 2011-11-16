
function clipText(s, maxLength) {
	var dots = "...";
	var sLength = s.length;
	if(sLength > maxLength) {
		s = s.substr(0, maxLength - dots.length) + dots;
	}
	return s;
}

function makeLinkHTML(linkInfo, maxLength, className) {
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
		moreAttrs = ' class="' + className + '"';
	}
	var linkHTML = '<a href="' + url + '" title="' + title + '" target="_blank" ' + moreAttrs + '>' + displayTitle + '</a>';

	return linkHTML;
}
function makeTimestamp() {
	return (new Date()).toLocaleTimeString();
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

	if(typeof console != "undefined") {
		console.log(s);
	}
	if(DEBUG_MODE) {
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
