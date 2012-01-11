# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class StudentLogout(SearchPartyRequestHandler):
	def get(self):
		from helpers import log
		from updates import send_update_log_out

		self.load_search_party_context(user_type="student")

		if self.is_student:
			log("LOGOUT: student, sid=%s, student=%r"%(self.session.sid, self.student))
			self.student.log_out(clear_session_sid=True)
			send_update_log_out(teacher=self.student.teacher, student_nickname=self.student.nickname)

		else:
		# Not logged in
			log("LOGOUT: student, not logged in, sid=%s"%(self.session.sid))

		self.clear_session_and_redirect(dst="/")
