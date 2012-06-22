google.load('search', '1', {language : 'en'});

google.setOnLoadCallback(function() {
	var customSearchId = '011823409747730989012:4citusfmkhu';

	var customSearchOptions = {};
	customSearchOptions[google.search.Search.RESTRICT_SAFESEARCH] = google.search.Search.SAFESEARCH_STRICT;

	// https://groups.google.com/a/googleproductforums.com/forum/#!msg/customsearch/Bp8MndGfn6M/AR8zQf5O3fIJ
	// https://groups.google.com/a/googleproductforums.com/forum/#!topic/customsearch/OUpAUFbQ6-o/discussion
	var customSearchControl = new google.search.CustomSearchControl(customSearchId, customSearchOptions);
	customSearchControl.setResultSetSize(10);
	customSearchControl.draw('custom_search_element');
	customSearchControl.setSearchCompleteCallback(null, onSearchComplete)
	//initSearchControl(customSearchControl);
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
