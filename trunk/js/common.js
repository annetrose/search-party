
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
	if(className != null) {
		moreAttrs = ' class="' + className + '"';
	}
	var linkHTML = '<a href="' + url + '" title="' + title + '" target="_blank" ' + moreAttrs + '>' + displayTitle + '</a>';

	return linkHTML;
}
function log(s) {
	if(typeof console != "undefined") {
		console.log(s);
	}
}
function escapeForHtml(s) {
	return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");
}
