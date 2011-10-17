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
		from updates import send_update_link_followed

		self.load_search_party_context()
		if self.is_student:
			student = self.student
			student_nickname = student.nickname
			lesson = student.lesson
			teacher = lesson.teacher
			lesson_code = lesson.lesson_code  # PERFORMANCE: may be doing too needless queries here
			query = self.request.get("query")
			url = self.request.get('url')
			title = self.request.get("title")
			link = StudentActivity(
				student = student,
				student_nickname = student_nickname,
				lesson_code = lesson_code,
				task_idx = int(self.request.get("task_idx")),
				activity_type = 'link',
				search = query,
				link = url,
				link_title = title,
			)
			link.put()
			log( "LinkFollowedHandler:  activity=%r"%link )
#			send_update_msg(self.student.teacher, "student_link_followed")
			send_update_link_followed(teacher=teacher, student_nickname=student_nickname, query=query, url=url, title=title)
