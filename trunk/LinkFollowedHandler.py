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
#		from helpers import send_update_msg
		from helpers import log

		self.load_search_party_context()
		if self.is_student:
			student = self.student
			lesson_code = self.student.lesson.lesson_code  # PERFORMANCE: may be doing too needless queries here
			link = StudentActivity(
				student = student,
				student_nickname = student.nickname,
				lesson_code = lesson_code,
				task_idx = int(self.request.get("task_idx")),
				activity_type = 'link',
				search = self.request.get("query"),
				link = self.request.get('url'),
				link_title = self.request.get("title"),
			)
			link.put()
			log( "LinkFollowedHandler:  activity=%r"%link )
#			send_update_msg(self.student.teacher, "student_link_followed")
