# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyChannelHandler import SearchPartyChannelHandler

class ChannelDisconnectedHandler(SearchPartyChannelHandler):
	def post(self):
		self.load_search_party_context()
		from helpers import log
		from all_exceptions import NoStudentForChannelError, NoTeacherForChannelError
		import sys
		import settings

		try:
			person = self.person
		except NoPersonForChannelError, e:
			e.log()
		else:
			if settings.REMOVE_OLD_CLIENT_IDS:
				person.remove_client_id(self.client_id)
				person.put()
				log("Client ID removed for %s"%(self.person_type))
			elif self.is_teacher:
				log( "*************************************************************************")
				log( "%s disconnected, but we will NOT remove the client ID ` ` ` ` ` ` ` ` ` `"%(self.person_type.title()) )
				log( "*************************************************************************")


			if self.is_student:
				student = person
				student.log_out(clear_session_sid=settings.CLEAR_SESSION_ID_ON_STUDENT_DISCONNECT)
				log("Student logged out")
