# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class LinkFollowedHandler(SearchPartyRequestHandler):
	def post(self):
		from model import StudentActivity
		from helpers import send_update_msg

		self.load_search_party_context()
		if self.is_student:
			link = StudentActivity()
			link.activity_type = 'link'
			link.link = self.request.get('href')
			link.student = self.student
			link.teacher = self.student.teacher
			link.put()

			send_update_msg(self.student.teacher, "student_link_followed")
