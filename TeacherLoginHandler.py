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
		self.load_search_party_context(user_type="teacher")

		# Close any active session the user has since s/he is trying to login
		if self.session.is_active():
			self.session.terminate()

		# Get the teacher's record
		if not self.is_teacher:
			teacher = Teacher(key_name=self.user.user_id())
			teacher.user = self.user
			teacher.put()
			self.set_person(teacher)

		self.session.regenerate_id()

		self.redirect_with_msg('Teacher Logged in. Hello: ' + self.teacher.user.nickname(), dst='/teacher_lessons')
