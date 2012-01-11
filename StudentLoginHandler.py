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
		import json
		from model import Student, Lesson
		from updates import send_update_log_in
		from datetime import datetime
		from helpers import log
		from all_exceptions import StudentLoginException

		try:
			self.load_search_party_context(user_type="student")  # This might raise StudentLoginException

			# Get CGI form fields.
			lesson_code = self.request.get("lesson_code")
			student_nickname = self.request.get('student_nickname')

			# Normalize whitespace in student name.
			# Replace any string of >=1 whitespace with a single space (equivalent to s/\s+/ /g).
			student_nickname = " ".join(student_nickname.split())

			if not lesson_code and not student_nickname:
			# Blank form
				raise StudentLoginException("Please enter a lesson code and a student name.",
						"lesson_code==%r, student_nickname==%r"%(lesson_code, student_nickname))
			elif not lesson_code:
			# No lesson code
				raise StudentLoginException("Please enter a lesson code.",
						"lesson_code==%r"%lesson_code)
			elif not student_nickname:
			# No student name
				raise StudentLoginException("Please enter a student name.",
						"student_nickname==%r"%student_nickname)

			lesson = Lesson.get_by_key_name(lesson_code)
			# Retrieve lesson from DB
			# - If lesson does not exist, this will return None.
			# - If lesson existed but is disabled, it will return the lesson, but lesson.is_active will be False.
			# - If lesson existed but was deleted (hidden), it will return the lesson, but lesson.is_deleted will be True.
			#   (Deleting lessons is done lazily.  Actually, they are merely hidden from the teacher's view.)

			if lesson is None or lesson.is_deleted:
			# Lesson does not exist or was deleted (hidden).
				raise StudentLoginException("Please check the lesson code.",
						"lesson retrieved from datastore with lesson_code %r is None"%lesson_code)
			elif not lesson.is_active:
			# Lesson has been disabled by teacher.  Students are not allowed to work on it anymore.
				raise StudentLoginException("This lesson is finished.  You cannot work on it now.",
						"lesson_code %r has is_active=False"%lesson_code)

			login_timestamp = datetime.now()
			key_name = Student.make_key_name(student_nickname=student_nickname, lesson_code=lesson_code)
			
			# Fetch student from DB.
			# - Might return None if nobody has ever logged in with this nickname+lesson combination.
			student = Student.get_by_key_name(key_name)

			if student is not None:
			# Found the student.
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

			assert student.session_sid is not None
			student.put()
			self.set_person(student)

			self.session['msg'] = "Student logged in:  Hello " + student_nickname

			send_update_log_in(teacher=lesson.teacher,
							   student_nickname=student.nickname,
							   task_idx=task_idx)

			self.response.out.write(json.dumps({"status":"logged_in"}))
			log( "LOGIN SUCCESS" )

		except StudentLoginException, e:
			e.log()
			self.set_person(None)
			msg = e.args[0]
			self.session['msg'] = msg
			self.response.out.write(json.dumps({"status":"logged_out"}))
			log( "LOGIN FAILURE:  %s"%msg )
