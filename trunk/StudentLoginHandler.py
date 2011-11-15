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
		from all_exceptions import StudentLoginException
#		class StudentLoginException(Exception): pass

		try:
			self.load_search_party_context(user_type="student")  # This might throw StudentLoginException

			student_nickname = self.request.get('student_nickname')
			student_nickname = " ".join(student_nickname.split())  # normalize whitespace
			lesson_code = self.request.get("lesson_code")

			if not lesson_code and not student_nickname:
				raise StudentLoginException("Please enter a lesson code and a student name.",
						"lesson_code==%r, student_nickname==%r"%(lesson_code, student_nickname))
			elif not lesson_code:
				raise StudentLoginException("Please enter a lesson code.",
						"lesson_code==%r"%lesson_code)
			elif not student_nickname:
				raise StudentLoginException("Please enter a student name.",
						"student_nickname==%r"%student_nickname)

			lesson = Lesson.get_by_key_name(lesson_code)

			if lesson is None:
				raise StudentLoginException("Please check the lesson code.",
						"lesson retrieved from datastore with lesson_code %r is None"%lesson_code)

			login_timestamp = datetime.now()
			key_name = Student.make_key_name(student_nickname=student_nickname, lesson_code=lesson_code)
			student = Student.get_by_key_name(key_name)
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
					key_name=key_name,
					logged_in=True,
					nickname=student_nickname,
					session_sid=self.session.sid,
					lesson=lesson,
					teacher=lesson.teacher_key,
					task_idx=task_idx,
					first_login_timestamp=login_timestamp,
					latest_login_timestamp=login_timestamp,
					latest_logout_timestamp=None,
					client_ids=[]
				)

			student.put()
			self.set_person(student)

			self.session['msg'] = "Student logged in:  Hello " + student_nickname

			send_update_log_in(teacher=lesson.teacher,
							   student_nickname=student.nickname,
							   task_idx=task_idx)

			self.response.out.write(json.dumps({"status":"logged_in"}))

		except StudentLoginException, e:
			e.log()
			self.set_person(None)
			self.session['msg'] = e.args[0]
			self.response.out.write(json.dumps({"status":"logged_out"}))