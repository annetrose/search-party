# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class StudentLoginHandler(SearchPartyRequestHandler):
	def post(self):
		from django.utils import simplejson as json
		from helpers import send_update_msg
		from model import Student, Teacher
		self.load_search_party_context()

		# Close any active session the user has since s/he is trying to login
		if self.session and self.session.is_active():
			self.session.terminate()

		teacher_id_str = self.request.get('teacher_id')
		teacher_id = ""
		if teacher_id_str.isdigit():
			teacher_id = int(teacher_id_str)
		teacher_password = self.request.get('teacher_password')
		student_name = self.request.get('student_name')
		if not student_name.isalpha():
			student_name = ""
		error = ""
		if teacher_id and teacher_password and student_name:
			teacherQuery = Teacher.all().filter('teacher_id =', teacher_id)
			teacherQuery = teacherQuery.filter('password = ', teacher_password)
			teacher = teacherQuery.get()
			student = ""
			if teacher:
				studentQuery = Student.all()
				studentQuery = studentQuery.filter('teacher = ', teacher)
				studentQuery = studentQuery.filter('nickname = ', student_name)
				studentQuery = studentQuery.filter('logged_in = ', True)
				student = studentQuery.get()
				if student:
					error = "Another student with the name " + student_name + " is already logged in. Please choose another name."
					student = ""
				else:
					# Successful student login
					# Update session
					self.session.regenerate_id()  # not really necessary.  only needed for security for real authentication.
					self.session['msg'] = "Student logged in: Hello " + student_name;

					send_update_msg(teacher, "student_login")

					# Put student in database
					student = Student()
					student.teacher = teacher
					student.nickname = student_name
					student.logged_in = True
					student.session_sid = self.session.sid
					student.put()
					self.set_person(student)

#					self.session['student'] = student  # don't store in both session and DB

					# Return data
					data = {'status' : 'logged_in'}
					self.response.out.write(json.dumps(data))
			else:
				error = "No teacher with that ID and password logged in"
		else:
			error = 'Student login failed. Must enter teacher ID, password and student name'

		if error:
			self.set_person(None)
			self.session['msg'] = error
			data = {'status' : 'logged_out'}
			self.response.out.write(json.dumps(data))

