class SearchPartyException(Exception):
	def log(self):
		from helpers import log
		log( self.__class__.__name__ + ": " + "".join("\n - %s"%a for a in self.args) )

class LoginException(SearchPartyException): pass
class StudentLoginException(LoginException): pass
class NoPersonForChannelError(SearchPartyException): pass
class NoTeacherForChannelError(NoPersonForChannelError): pass
class NoStudentForChannelError(NoPersonForChannelError): pass
