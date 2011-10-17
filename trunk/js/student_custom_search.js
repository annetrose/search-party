google.load('search', '1', {language : 'en'});
google.setOnLoadCallback(function() {
var customSearchControl = new google.search.CustomSearchControl('011823409747730989012:4citusfmkhu');
customSearchControl.setResultSetSize(5);
customSearchControl.draw('cse');
customSearchControl.setSearchCompleteCallback(null, searchCompleteCallback)
initEventHandlers();
}, true);
