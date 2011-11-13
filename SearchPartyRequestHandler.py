# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0


from google.appengine.ext import webapp

class SearchPartyRequestHandler(webapp.RequestHandler):
	def load_search_party_context(self, user_type=None, lesson_code=None, student_nickname=None):
		from model import Teacher, Student
		from gaesessions import get_current_session
		from google.appengine.api import users
		from helpers import log, smush
		from all_exceptions import StudentLoginException

		log( "" )
		log( "" )
		log( "" )
		log( "____________________________________________________________________" )
		log( self.request.url )
		log( "" )

		assert user_type in ("student", "teacher", None)

		self.session = get_current_session()
		self.user = users.get_current_user()


		# PERFORMANCE:  Instead of fetching the Student or Teacher, you could just get the key and then fetch the real thing lazily in a property.
		person = None
		if user_type=="student":
			lesson_code = self.request.get("lesson_code", None)
			student_nickname = self.request.get("student_nickname", None)
			if lesson_code is not None and student_nickname is not None:
				log( "Found by data" )
				key_name = Student.make_key_name(student_nickname=student_nickname, lesson_code=lesson_code)
				student = Student.get_by_key_name(key_name)
				if (student is not None) and (student.session_sid != self.session.sid):
					log("Student SID doesn't match:\n * student == %r\n * student.session_sid == %r\n * self.session.sid == %r"%
							(student, student.session_sid, self.session.sid))
					if student.is_logged_in:
						raise StudentLoginException("Someone is already logged into this lesson with that name.",
								"Session ID doesn't match.", student.session_sid, self.session.sid,
								student.latest_login_timestamp, student.latest_logout_timestamp)
					else:
						self.session.clear()
						self.session.regenerate_id()
						student.session_sid = self.session.sid
						student.put()
			else:
				log( "Found by session" )
				student = Student.all().filter("session_sid =", self.session.sid).get()
			person = student
		elif self.user is not None:
			assert user_type in ("teacher", None)
			person = Teacher.get_by_key_name(self.user.user_id())

		self.set_person(person)

		assert not ((self.is_teacher) ^ (self.teacher is not None))
		assert not ((self.is_student) ^ (self.student is not None))


	def log_state(self):
		log( "........  is_teacher=%s,  is_student=%s"%(self.is_teacher, self.is_student))
		log( "..............  user="+repr(self.user) )
		if self.user is not None:
			log( "......  user.user_id="+repr(self.user.user_id()) )
			log( "........  vars(user)="+repr(vars(self.user)) )
		log( "...........  student="+repr(self.student) )
		if self.student is not None:
			log( "...  student.teacher="+repr(self.student.teacher) )
		log( "...........  teacher="+repr(self.teacher) )
		log( "......session.keys()="+repr(tuple(self.session)) )
		log( ".........session.sid="+smush(self.session.sid, 40))


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

	def _get_user_type(self):
		user_type = self.session.get("person_type", None)
		assert user_type in ("teacher", "student", None)
		return user_type

	def _set_user_type(self, user_type):
		assert user_type in ("teacher", "student")
		self.session["person_type"] = user_type
	
	user_type = property(_get_user_type, _set_user_type)
	
	def clear_session(self):
		self.session.clear()
		self.session.regenerate_id()

	def set_person(self, person):
		from model import Student, Teacher
		assert person is None or isinstance(person, Student) or isinstance(person, Teacher)

		self.is_student = False
		self.student = None
		self.is_teacher = False
		self.teacher = None
		self.person_type = None

		if person is not None:
			if isinstance(person, Student):
				self.student = person
				self.teacher = None
				self.is_student = True
				self.is_teacher = False
				self.person_type = "student"
			elif isinstance(person, Teacher):
				self.teacher = person
				self.student = None
				self.is_teacher = True
				self.is_student = False
				self.person_type = "teacher"
			else:
				assert False, "Unknown person type in set_person(..),  error # 13108, "+repr(person)

			if self.session.get("person_type",None) != self.person_type:
				self.session["person_type"] = self.person_type

		else:
			if self.session.has_key("person_type"):
				del self.session["person_type"]

		self.person = person

	def redirect_to_teacher_login(self):
		from google.appengine.api import users
		self.redirect(users.create_login_url('/teacher_login'))
	
	def create_channel(self, lesson_code):
		from google.appengine.api import channel
		import client_id_utils
		from helpers import log

#		from model import Client
#		client_id = self.session.sid  # same for teacher or student, for now.  may change later.
#		client = Client(key_name=client_id)
#		if self.is_teacher:
#			client.user_type = "teacher"
#			client.client_id = self.teacher.make_client_id(session_sid=self.session.sid)
#		elif self.is_student:
#			client.user_type = "student"
#			client.client_id = self.student.make_client_id(session_sid=self.session.sid)
#		client.student = self.student
#		client.teacher = self.teacher
#		client.put()

		client_id = client_id_utils.create_client_id(session_sid=self.session.sid, lesson_code=lesson_code, person_type=self.person_type)
		token = channel.create_channel(client_id)
		self.person.add_client_id(client_id)
		self.person.put()
		log( "Created channel for %r on %s."%(self.person, client_id) )
#		if self.is_teacher:
#			self.teacher.add_client_id(client_id)
#			self.teacher.put()
#			log( "Created channel for teacher %r on %s."%(self.teacher, client_id) )
#		elif self.is_student:
#			self.student.client_id = client_id
#			self.student.put()
#			log( "Created channel for student %r on %s."%(self.student, client_id) )
#		else:
#			assert False, "Neither Student nor Teacher"
		return token


	def gen_header(self, role="unknown"):
		from google.appengine.api import users
		assert role in ("teacher", "student", "unknown")
		template_vals = {"nickname":None, "teacher_login_url":None, "role":role}
		if self.is_student:
			template_vals["nickname"] = self.student.nickname
		elif self.is_teacher:
			template_vals["nickname"] = self.user.nickname()
		else:
			template_vals["teacher_login_url"] = users.create_login_url("/teacher_login")
		template_vals["is_logged_in"] = (template_vals["nickname"] is not None)
		html = self.render_template("header.html", template_vals)
		return html

	def redirect_with_msg(self, msg, dst='/'):
		self.session['msg'] = msg
		self.redirect(dst)

	def write_response_with_template(self, file, template_vals):
		html = self.render_template(file=file, template_vals=template_vals)
		self.response.out.write(html)
	
	def write_response_plain_text(self, s):
		if not isinstance(s, basestring):
			s = unicode(s)
		self.response.headers["Content-Type"] = "text/plain"
		self.response.out.write(s)

	def render_template(self, file, template_vals):
		from google.appengine.ext.webapp import template
		from helpers import prettify_html
		import os
		path = os.path.join(os.path.dirname(__file__), 'templates', file)
		html = template.render(path, template_vals)
#		html = prettify_html(html)
		return html
#		self.response.out.write(template.render(path, template_vals))

	@property
	def fragment_id(self):
		from urlparse import urlparse
		return urlparse(self.request.url).fragment
