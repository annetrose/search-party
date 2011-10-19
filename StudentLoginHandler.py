# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class StudentLoginHandler(SearchPartyRequestHandler):
	INITIAL_TASK_IDX = 0

	def post(self):
		from django.utils import simplejson as json
		from model import Student, Lesson
		from updates import send_update_log_in
		from datetime import datetime
		from helpers import log
		class StudentLoginException(Exception): pass

		self.load_search_party_context()
		self.clear_session()

		student_nickname = self.request.get('student_nickname')
		student_nickname = " ".join(student_nickname.split())  # normalize whitespace
		lesson_code = self.request.get("lesson_code")
		try:
			if not lesson_code and not student_nickname:
				raise StudentLoginException("Please enter a lesson code and a student name.")
			elif not lesson_code:
				raise StudentLoginException("Please enter a lesson code.")
			elif not student_nickname:
				raise StudentLoginException("Please enter a student name.")

			lesson = Lesson.all().filter("lesson_code =", lesson_code).get()

			if lesson is None:
				raise StudentLoginException("Please check the lesson code.")

			login_timestamp = datetime.now()
			student = Student.all().filter("nickname =", student_nickname).filter("lesson =", lesson).get()
			if student is not None:
				student.session_sid=self.session.sid
				task_idx = student.task_idx
				student.logged_in = True
				student.latest_login_timestamp = login_timestamp
				student.latest_logout_timestamp = None
				if not student.first_login_timestamp:
					student.first_login_timestamp = login_timestamp
			else:
				task_idx = self.INITIAL_TASK_IDX
				student = Student(
					logged_in=True,
					nickname=student_nickname,
					session_sid=self.session.sid,
					lesson=lesson,
					task_idx=task_idx,
					first_login_timestamp=login_timestamp,
					latest_login_timestamp=login_timestamp,
					latest_logout_timestamp=None
				)

			student.put()

			self.session['msg'] = "Student logged in:  Hello " + student_nickname
			self.set_person(student)

			send_update_log_in(teacher=lesson.teacher,
							   student_nickname=student.nickname,
							   task_idx=task_idx)

			self.response.out.write(json.dumps({"status":"logged_in"}))

		except StudentLoginException, e:
			self.set_person(None)
			self.session['msg'] = e.args[0]
			self.response.out.write(json.dumps({"status":"logged_out"}))
