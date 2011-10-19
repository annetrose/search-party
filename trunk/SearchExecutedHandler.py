# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class SearchExecutedHandler(SearchPartyRequestHandler):
	def post(self):		   
#		from helpers import send_update_msg
#		from helpers import log
		from model import StudentActivity
#		from datetime import datetime
		from updates import send_update_query

		self.load_search_party_context()


		if self.is_student:
			lesson = self.student.lesson
			teacher = lesson.teacher
			student = self.student
			query = self.request.get("query")
			task_idx = int(self.request.get("task_idx"))
			student_nickname = student.nickname
			activity = StudentActivity(
				student = student,
				student_nickname = student_nickname,
				lesson = lesson,
				task_idx = task_idx,
				activity_type = 'search',
				search = query,
			)
			activity.put()
			send_update_query(teacher=teacher, student_nickname=student_nickname, task_idx=task_idx, query=query)
