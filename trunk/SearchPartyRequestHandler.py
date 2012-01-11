# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

import webapp2

class SearchPartyRequestHandler(webapp2.RequestHandler):

	def load_search_party_context(self, user_type):
		from model import Teacher, Student
		from gaesessions import get_current_session
		from google.appengine.api import users

		try:
			self._log_begin()
			
			assert user_type in ("student", "teacher", "unknown")  # Only these values are allowed.

			# Get the current browser session, if any.  Otherwise, create one.
			self.session = get_current_session()
			if self.session.sid is None:
				self.session.start()
			assert self.session.sid is not None

			self.user = users.get_current_user()  # authenticated Google user

			person = None

			# For all pages, except / (MainPage), user_type will be either "student" or "teacher",
			# at least as of 1-10-2011.  For MainPage, we will try to identify the user as a
			# student first, and then try as a teacher.

			if user_type in ("student", "unknown"):
			# Might be a student
				person = self._attempt_to_identify_as_student()

			if person is None and user_type in ("teacher", "unknown"):
			# Not found yet and might be a teacher
				person = self._attempt_to_identify_as_teacher()

			self.set_person(person)  # Pass None, if no student or teacher record was found.

		finally:
			self._log_end()


	def _attempt_to_identify_as_teacher(self):
		from model import Teacher
		authenticated_google_user = self.user

		# Teacher is identified solely by their Google account.  If they're logged into
		# the Google account, then they're logged into Search Party.

		if authenticated_google_user is None:
			teacher = None
		else:
			teacher = Teacher.get_by_key_name(authenticated_google_user.user_id())

		return teacher


	def _attempt_to_identify_as_student(self):
		from model import Student
		import settings
		from all_exceptions import StudentLoginException

		# We still store changes to student record only, if any, but we don't want to store
		# the record needlessly, since that consumes billable resources.
		student_is_dirty = False

		# Get CGI form values
		lesson_code = self.request.get("lesson_code", None)
		student_nickname = self.request.get("student_nickname", None)

		# There are two ways to identify a student:  nickname + lesson code sent via CGI,
		# or the session ID.  We will try them in that order.

		if lesson_code is not None and student_nickname is not None:
		# 1. Fetch student by nickname+lesson
			key_name = Student.make_key_name(student_nickname=student_nickname, lesson_code=lesson_code)
			student = Student.get_by_key_name(key_name)

			if student is not None:
				self._log( "Found student by lesson_code + student_nickname" )

				if student.is_logged_in and student.session_sid != self.session.sid:
				# If session stored for student is different than what we have, then we'll need to either
				# deny login to the current user or decide to clobber the old session if it's stale.

					if settings.PREVENT_MULTIPLE_STUDENT_LOGINS and student.logged_in and student.is_disconnected is False:
					# Deny login.  Do NOT clobber old student's session.
						self._log_student_clobber_decision(student, "DENIED")
						raise StudentLoginException("Please choose another name.  Someone is already logged in as %s."%\
										(student_nickname.encode("ascii","xmlcharrefreplace")),
								"Session ID doesn't match.", student.session_sid, self.session.sid,
								student.latest_login_timestamp, student.latest_logout_timestamp)
					else:
					# Allow login.  Clobber old student's session.
						self._log_student_clobber_decision(student, "ALLOWED")
						student.session_sid = self.session.sid
						student_is_dirty = True

		else:
		# 2. Fetch student by session ID.
			student = Student.all().filter("session_sid =", self.session.sid).get()
			if student is not None:
				self._log( "Found student by session" )

		if student is not None and student.session_sid != self.session.sid:
		# Store session ID with student record.
			student.session_sid = self.session.sid
			student_is_dirty = True
			self._log( "Stored new session ID" )

		if student is not None and not student.is_logged_in:
		# Log student in again.  Apparently, this is the right student, but s/he logged out at some point.
			student.latest_logout_timestamp = None
			self._log( "Re-logged in student" )
			student_is_dirty = True

		if student_is_dirty:
		# Store changes to student record, if any.
			student.put()

		return student

	@property
	def student_key(self):
		if self.student is None:
			return None
		else:
			return self.student.key()

	@property
	def teacher_key(self):
		if self.teacher is None:
			return None
		else:
			return self.teacher.key()

	def clear_session(self):
		self.session.terminate()
		self.session.clear()
		self.session.regenerate_id()

	def set_person(self, person):
		# Pass None to this method to indicate that no student or teacher was recognized.

		from model import Student, Teacher
		assert person is None or isinstance(person, Student) or isinstance(person, Teacher)

		if isinstance(person, Student):
			self.teacher = None
			self.student = person
			self.is_teacher = False
			self.is_student = True
			self.person_type = "student"
		elif isinstance(person, Teacher):
			self.teacher = person
			self.student = None
			self.is_teacher = True
			self.is_student = False
			self.person_type = "teacher"
		else:
			assert person is None
			self.is_student = False
			self.student = None
			self.is_teacher = False
			self.teacher = None
			self.person_type = None

		self.person = person

		assert self.is_teacher == isinstance(self.teacher,Teacher) == isinstance(self.person,Teacher)
		assert self.is_student == isinstance(self.student,Student) == isinstance(self.person,Student)
		assert not (self.is_student and self.is_teacher)

	def redirect_to_teacher_login(self):
		from google.appengine.api import users
		self.redirect(users.create_login_url('/teacher_login'))
	
	def create_channel(self, lesson_code):
		from google.appengine.api import channel
		import client_id_utils
		client_id = client_id_utils.create_client_id(session_sid=self.session.sid,
												     lesson_code=lesson_code,
													 person_type=self.person_type)
		token = channel.create_channel(client_id)
		self.person.add_client_id(client_id)
		assert not self.is_student or self.student.session_sid is not None
		self.person.put()
		self._log( "Created channel for %r on %s."%(self.person, client_id) )
		return token


	def gen_header(self, role="unknown"):
		from google.appengine.api import users
		assert role in ("teacher", "student", "unknown")
		template_vals = {"nickname":None, "teacher_login_url":None, "role":role}
		if self.is_student:
			template_vals["nickname"] = self.student.nickname
		elif self.is_teacher:
			template_vals["nickname"] = self.user.nickname()  # name of authenticated Google user
		else:
			template_vals["teacher_login_url"] = users.create_login_url("/teacher_login")
		template_vals["is_logged_in"] = (template_vals["nickname"] is not None)
		html = self.render_template("header.html", template_vals)
		return html

	def clear_session_and_redirect(self, dst):
		# TODO:  Find out if we should we call session.terminate() here.
		#        Ben did before.  Alex doesn't think it's necessary but he's not 100% sure.
		self.clear_session()
		self.redirect(dst)

	def redirect_with_msg(self, msg, dst='/'):
		self.session['msg'] = msg
		self.redirect(dst)

	def write_response_with_template(self, template_filename, template_vals):
		html = self.render_template(template_filename=template_filename, template_vals=template_vals)
		self.response.out.write(html)
	
	def write_response_plain_text(self, s):
		if not isinstance(s, basestring):
			s = unicode(s)
		self.response.headers["Content-Type"] = "text/plain"
		self.response.out.write(s)

	def write_response_as_file(self, encoded_content, content_type, filename, encoding):
		# Filename may consist of only letters, numbers, period, underscore, and hyphen.

		import re
		assert re.match(r"^[-_.a-zA-Z0-9]+$", filename) is not None, repr(filename)

		if encoding is not None:
			content_type += "; charset=%s"%encoding

		self.response.headers["Content-Type"] = content_type
		self.response.headers["Content-Disposition"] = 'attachment; filename="%s"'%filename

		self.response.out.write(encoded_content)


	def render_template(self, template_filename, template_vals):
		from google.appengine.ext.webapp import template
		# This page says "webapp" should still be used:
		# http://webapp-improved.appspot.com/tutorials/gettingstarted/templates.html
		from helpers import prettify_html
		import os
		path = os.path.join(os.path.dirname(__file__), 'templates', template_filename)
		html = template.render(path, template_vals)
		return html

	@property
	def fragment_id(self):
		from urlparse import urlparse
		return urlparse(self.request.url).fragment

	def _log(self, s):
		self._log_lines.append(s)

	def _log_begin(self):
		# We may want to log a lot of information.  To cluster it into one big message,
		# we will accumulate the lines in a list and then output them with the usual
		# logging function at the very end, when _log_end() is called.

		self._log_lines = []
		self._log( "" )
		self._log( "____________________________________________________________________" )
		self._log( self.request.url )
		self._log( "" )

	def _log_student_clobber_decision(self, already_connected_student, decision):
		# Log the decision of what happened when one student was apparently
		# logged in and another tried to log in with the same nickname and lesson code.

		import settings
		self._log("Student clobber %s"%(decision.upper()))
		self._log(" - settings.PREVENT_MULTIPLE_STUDENT_LOGINS : %r"%settings.PREVENT_MULTIPLE_STUDENT_LOGINS)
		self._log(" - already_connected_student : %r"%already_connected_student)
		self._log("     .logged_in : %r"%already_connected_student.logged_in)
		self._log("     .is_disconnected : %r"%already_connected_student.is_disconnected)
		self._log("     .session_sid : %r"%already_connected_student.session_sid)
		self._log("     .latest_logout_timestamp : %r"%already_connected_student.latest_logout_timestamp)
		self._log("     .latest_login_timestamp : %r"%already_connected_student.latest_login_timestamp)
		self._log(" - self")
		self._log("     .session.sid : %r"%self.session.sid)


	def _log_end(self):
		# This should be called only once.
		#
		# Finish adding to the log message and then output it using the usual logging function.

		from helpers import log, smush
		try:
			self._log( "........  is_teacher=%s,  is_student=%s"%(self.is_teacher, self.is_student))
			self._log( "..............  user="+repr(self.user) ) # authenticated Google user
			if self.user is not None:
				self._log( "......  user.user_id="+repr(self.user.user_id()) ) # ID# of authenticated Google user
				self._log( "........  vars(user)="+repr(vars(self.user)) ) # info about authenticated Google user
			self._log( "...........  student="+repr(self.student) )
			if self.student is not None:
				self._log( "...  student.teacher="+repr(self.student.teacher) )
			self._log( "...........  teacher="+repr(self.teacher) )
			self._log( "......session.keys()="+repr(tuple(self.session)) )
			self._log( ".........session.sid="+smush(self.session.sid, 40))
			self._log( "........len(cookies)=%d"%(len(self.request.cookies)) )
		except:
			self._log( ".... printing variables failed ...." )
		self._log( "" )
		self._log( "" )
		self._log( "" )

		log( "\n".join(self._log_lines) )
