google.load('search', '1', {language : 'en'});

google.setOnLoadCallback(function() {
	var customSearchControl = new google.search.CustomSearchControl('011823409747730989012:4citusfmkhu');
	customSearchControl.setResultSetSize(5);
	customSearchControl.draw('cse');
	customSearchControl.setSearchCompleteCallback(null, searchCompleteCallback)
	customSearchControl.setLinkTarget("result_frame");
	initEventHandlers();
}, true);


/*
 * Disabling ads is explicitly ALLOWED because we are a university.
 *
 * From http://www.google.com/cse/manage/create:
 *
 * "... You must show ads alongside the search results, unless you are creating
 * your search engine for a nonprofit organization, university, or government
 * agency, in which case you can disable ads. ..."
 *
 * http://www.google.com/support/customsearch/bin/answer.py?hl=en&answer=70354
 */


/*
 * Autocompletion is NOT possible because we are searching the entire web.
 *
 * Because the autocompleted queries are based, in part, on the specific
 * content of the webpages covered by your search engine, we will not generate
 * autocompletions for custom search engines that search the entire web, ...
 *
 * http://googlecustomsearch.blogspot.com/2010/05/autocompletion-of-queries-in-custom.html
 */
