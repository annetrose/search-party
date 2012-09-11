var SEARCH_PARTY_URL = 'http://search-party.appspot.com';
//var SEARCH_PARTY_URL = 'http://hciltest.appspot.com';
//var SEARCH_PARTY_URL = 'http://localhost:8081';

var DEBUG = false;

var STUDENT_LOGGED_OUT = 0;
var STUDENT_LOGGED_IN = 1;
var UNRATED_LINK = 2;
var HELPFUL_LINK = 3;
var UNHELPFUL_LINK = 4;
var TASK_CHANGED = 5;

var EMPTY_SEARCH = '<empty>';
var RECORDING_TEXT = '>';
var NOT_RECORDING_TEXT = '||';

var g_login_status = STUDENT_LOGGED_OUT;

function initLocalStorage() {
	storeTask(0);
	storeLink('');
}

function getStoredTask() {
	return parseInt(localStorage['task_idx']);
}

function storeTask(task_idx) {
	localStorage['task_idx'] = task_idx;
}

function getStoredLink() {
	return localStorage['link'];
}

function storeLink(link) {
	localStorage['link'] = link;
	localStorage['link_title'] = '';
}

function getStoredLinkTitle() {
	return localStorage['link_title'];
}

function storeLinkTitle(title) {
	localStorage['link_title'] = title;
}

function getStoredTab() {
	return parseInt(localStorage['tab']);
}

function storeTab(tab) {
	localStorage['tab'] = tab;
}

function isStudentLoggedIn() {
	return g_login_status == STUDENT_LOGGED_IN;
}

function updateBadge(status) {
        if (status == STUDENT_LOGGED_OUT) {
		chrome.browserAction.setBadgeText({text:''});
		chrome.browserAction.setIcon({path:'images/icon-16-logged-out.png'});
		g_login_status = status;
        }
	else if (status == STUDENT_LOGGED_IN) {
		chrome.browserAction.setIcon({path:'images/icon-16-logged-in.png'});
        	chrome.browserAction.setBadgeText({text:""+(getStoredTask()+1)});
		g_login_status = status;
        }
	else if (status == UNRATED_LINK) {
		chrome.browserAction.setIcon({path:'images/icon-16-unrated.png'});
	}
	else if (status == HELPFUL_LINK) {
		chrome.browserAction.setIcon({path:'images/icon-16-unrated.png'});
	}
	else if (status == UNHELPFUL_LINK) {
		chrome.browserAction.setIcon({path:'images/icon-16-unrated.png'});
	}
	else if (status == TASK_CHANGED) {
        	chrome.browserAction.setBadgeText({text:""+(getStoredTask()+1)});
	}
}

function getUrlParameter(url, parameter) {
	// if hash, only search hash for parameter; otherwise search regular url parameters
	// Google seems to store "current" values for params in hash sometimes, 
	// and regular url params contain prior values
        var search = url;
	if (!search) search = '';
        if (search.indexOf('#') != -1) {
                search = search.substring(search.indexOf('#'));
        }
        return decodeURIComponent((new RegExp('[?|&|#]' + parameter + '=' + '([^&;]+?)(&|#|;|$)').exec(search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function debug(str) {
	if (DEBUG) {
		console.log(str);
	}
}
