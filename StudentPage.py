# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class StudentPage(SearchPartyRequestHandler):
	def get(self):
		from helpers import log
		self.load_search_party_context()

		if not self.is_student:
			self.redirect_with_msg('')
		else:
			log("PAGE: student, session.sid=%s"%(self.session.sid))
			template_values = {
				'header':     self.gen_header(),
				'teacher_id': self.student.teacher.teacher_id,
				'nickname':   self.student.nickname,
				'token':      self.create_channel(),
				'sid':        self.session.sid,
			}
			if self.session.has_key('msg'):
				template_values['msg'] = self.session.pop('msg')  # only show the message once

			self.write_response_with_template("student.html", template_values)
