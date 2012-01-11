class SearchPartyException(Exception):
	def __init__(self, *args, **kwargs):
		import sys, traceback
		from helpers import log
		super(SearchPartyException, self).__init__(*args, **kwargs)
		log( traceback.format_exception(*(sys.exc_info())) )

	def log(self):
		from helpers import log
		log( self.__class__.__name__ + ": " + "".join("\n - %s"%a for a in self.args) )

class LoginException(SearchPartyException): pass
class StudentLoginException(LoginException): pass
