# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class StudentLoginPage(SearchPartyRequestHandler):
	def get(self):
		from helpers import log
		log("STUDENTLOGIN")
		self.load_search_party_context(user_type="student")
		template_values = {
			'header': self.gen_header("student"),
		}
		if self.session.has_key('msg'):
			template_values['msg'] = self.session.pop('msg')  # only show the message once

		self.clear_session()
		self.write_response_with_template("student_login.html", template_values)
