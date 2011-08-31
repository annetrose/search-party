# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class SearchExecutedHandler(SearchPartyRequestHandler):
	def post(self):		   
		from helpers import send_update_msg, log
		from model import StudentActivity
		self.load_search_party_context()

		if self.is_student:
			query = self.request.get("q")
			activity = StudentActivity()
			activity.activity_type = 'search'
			activity.search  = query
			activity.student = self.student
			activity.teacher = self.student.teacher
			activity.put()
			send_update_msg(self.student.teacher, "student_search")
			log( "SearchExecutedHandler : %s"%query )
		else:
			log( "SearchExecutedHandler : not recognized as student" )
