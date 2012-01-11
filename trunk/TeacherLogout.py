# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class TeacherLogout(SearchPartyRequestHandler):
	def get(self):
		from helpers import log
		from google.appengine.api import users

		self.load_search_party_context(user_type="teacher")

		if self.is_teacher:
			if self.session.is_active():
				log("LOGOUT: teacher, active session, sid=%s"%(self.session.sid))
				self.session.terminate()
			else:
				log("LOGOUT: teacher, inactive session, sid=%s"%(self.session.sid))
			logout_url = users.create_logout_url('/')
			self.clear_session_and_redirect(dst=logout_url)

		else:
		# Not logged in
			log("LOGOUT: teacher, not logged in, sid=%s"%(self.session.sid))
			self.clear_session_and_redirect(dst="/")
