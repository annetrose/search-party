# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0


from google.appengine.ext import webapp

class SearchPartyRequestHandler(webapp.RequestHandler):
	def load_search_party_context(self):
		from model import Teacher, Student
		from gaesessions import get_current_session
		from google.appengine.api import users
		from helpers import log

		self.session = get_current_session()
		self.user = users.get_current_user()

		user_type = self.session.get("person_type", None)
		assert user_type in ("student", "teacher", None)

		person = None
		if user_type=="student":
			person = Student.all().filter("session_sid =", self.session.sid).get()
		elif user_type=="teacher" and self.user is not None:
			person = Teacher.all().filter("user =", self.user).get()
		
		self.set_person(person)

		assert not ((self.is_teacher) ^ (self.teacher is not None))
		assert not ((self.is_student) ^ (self.student is not None))


		log( "........  is_teacher=%s,  is_student=%s"%(self.is_teacher, self.is_student))
		log( "..............  user="+repr(self.user) )
		log( "......session.keys()="+repr(tuple(self.session)) )
		# TODO: Consider using this logic, which was previously used to get the teacher
		# and/or figure out if a teacher is logged on rather than a student.
#		user = users.get_current_user()
#		teacherQuery = Teacher.all().filter('user =', user)
#		teacher = teacherQuery.get()
#		if not user or not teacher:
#			self.redirect_to_teacher_login()

	def set_person(self, person):
		from model import Student, Teacher
		assert person is None or isinstance(person, Student) or isinstance(person, Teacher)

		self.is_student = False
		self.student = None
		self.is_teacher = False
		self.teacher = None

		person_type = None
		if person is not None:
			if isinstance(person, Student):
				self.student = person
				self.teacher = None
				self.is_student = True
				self.is_teacher = False
				person_type = "student"
			elif isinstance(person, Teacher):
				self.teacher = person
				self.student = None
				self.is_teacher = True
				self.is_student = False
				person_type = "teacher"
			else:
				assert False, "Unknown person type in set_person(..),  error # 13108, "+repr(person)

			if self.session.get("person_type",None) != person_type:
				self.session["person_type"] = person_type

		else:
			if self.session.has_key("person_type"):
				del self.session["person_type"]


	

	def redirect_to_teacher_login(self):
		from google.appengine.api import users
		self.redirect(users.create_login_url('/teacher_login'))
	
	def create_channel(self):
		from model import Client
		from google.appengine.api import channel
		client_id = self.session.sid  # same for teacher or student, for now.  may change later.
		client = Client()
		if self.is_teacher:
			client.user_type = "teacher"
		elif self.is_student:
			client.user_type = "student"
		client.student = self.student
		client.teacher = self.teacher
		client.client_id = client_id
		client.put()
		token = channel.create_channel(client_id)
		return token

	def gen_header(self):
		# TODO:  Move this to a template.
		from google.appengine.api import users

		html = ""
		html += "<table class='header' width='100%'>"
		html += "	<tr>"
		html += "		<td width='30%'><a href='/'>SP Logo</a></td>"
		html += "		<td align='middle' width='40%'>Search Party: Learn To Search</td>"
		html += "		<td align='right' width='30%'>"
		if self.is_teacher:
			html += "				" + self.user.nickname()
			html += "				<a href='/logout'>Logout</a>"
		elif self.is_student:
			html += "				" + self.student.nickname
			html += "				<a href='/logout'>Logout</a>"
		else:
			teacher_login_url = users.create_login_url("/teacher_login")
			html += "				Login as"
			html += "				<a href='" + teacher_login_url + "'>teacher</a> OR"
			html += "				<a href='/student_login'>student</a>"
		html += "		</td>"
		html += "	</tr>"
		html += "</table>"
		return html

	def gen_teacher_info(self, teacher_id, password):
		# TODO:  Move this to a template.
		html = "<table>"
		html += "  <tr valign='top'>"
		html += "	 <td width='150px'>"
		html += "		Teacher ID: " + str(teacher_id)
		html += "	 </td>"
		html += "	 <td>"
		if password:
			html += "	   Password: " + password
		else:
			html += "	   Enter password: <input id='password' type='text'></input><input id='password_submit' type='button' value='Ok'></input>"
			html += "	   <br><span class='help'>Set a new password everytime you log in</span>"
			html += "	   <script type='text/javascript'>"
			html += "		 function passwordChanged() {"
			html += "		   $.post('/teacher_login', {'password': $('#password').val() }, window.location.replace('/teacher'));"
			html += "		 }"

			html += "		 $('#password').focus();"
			html += "		 $('#password').keyup(function(event) {"
			html += "		   if (event.which == 13) {"  # Enter key
			html += "			  passwordChanged();"
			html += "		   }"
			html += "		 });"
			html += "		 $('#password_submit').click(function(event) {"
			html += "		   passwordChanged();"
			html += "		 });"
			html += "	   </script>"
			html += "	   <br><br>"
		html += "	 </td>"
		html += "  </tr>"
		html += "</table>"
		return html

	def is_logged_in(self):
		# TODO:  Make sure this is really not needed.  For now, it is more or less a stub.
		return self.is_student
#		from model import Student
#		logged_in = False
#		if self.session.has_key('student'):
#			# There could be an active session without matching sid in DB if student
#			# got logged out automatically (by, say, window being closed)
#			# So, check for this situation explicitly
#			studentQuery = Student.all().filter('session_sid = ', self.session.sid)
#			studentObj = studentQuery.get()
#			if studentObj:
#				logged_in = studentObj.logged_in
#			if not logged_in:
#				self.session.terminate()
#		return logged_in

	def get_search_party(self):
		from model import SearchParty
		keyname = "search_party"
		sp = SearchParty.get_or_insert(keyname)
		return sp

	def redirect_with_msg(self, msg, dst='/'):
		self.session['msg'] = msg
		self.redirect(dst)

	def render_template(self, file, template_vals):
		from google.appengine.ext.webapp import template
		import os
		path = os.path.join(os.path.dirname(__file__), 'templates', file)
		self.response.out.write(template.render(path, template_vals))
