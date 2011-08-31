# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class TeacherLoginHandler(SearchPartyRequestHandler):
	from google.appengine.ext.webapp.util import login_required

	@login_required
	def get(self):
		from helpers import log
		from model import Teacher
		self.load_search_party_context()

		log( "LOGIN:  teacher, get" )

		# Close any active session the user has since s/he is trying to login
		if self.session.is_active():
			self.session.terminate()

		# Get the teacher's record
		if not self.is_teacher:
			sp = self.get_search_party()
			teacher = Teacher()
			teacher.user = self.user
			teacher_id = sp.next_teacher_id
			teacher.teacher_id = teacher_id
			teacher.put()
			sp.next_teacher_id += 1
			sp.put()
			self.set_person(teacher)
			log( ".....   Make new teacher and stored in DB" )

#		self.session['teacher'] = teacher  # don't store teacher object in two places
		self.session.regenerate_id()

		log( ".....   redirect to /teacher")
		self.redirect_with_msg('Teacher Logged in. Hello: ' + self.teacher.user.nickname(), dst='/teacher')

	def post(self):
		from helpers import log
		from model import Teacher
		self.load_search_party_context()

		log( "LOGIN:  teacher, post" )
		password = self.request.get('password')
		if password:
			# TODO:  Make this use the base class.
			teacherQuery = Teacher.all().filter('user =', self.user)
			teacher = teacherQuery.get()
			if teacher:
				teacher.password = password
				teacher.put()

