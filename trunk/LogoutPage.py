# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class LogoutPage(SearchPartyRequestHandler):
	def get(self):
		from google.appengine.api import users
#		from helpers import send_update_msg
		from helpers import log
#		from model import Teacher
		from updates import send_update_log_out

		self.load_search_party_context()

		if self.is_teacher:
			# Teacher logout
			if self.session.is_active():
				log("LOGOUT: teacher, active session, sid=%s"%(self.session.sid))
				self.teacher.password = ""
				self.teacher.put()
				self.session.terminate()
			else:
				log("LOGOUT: teacher, inactive session, sid=%s"%(self.session.sid))
			logout_url = users.create_logout_url('/')
			msg = 'Teacher Logged out: Goodbye ' + self.user.nickname()
			self.set_person(None)
			self.redirect_with_msg(msg, dst=logout_url)
		elif self.is_student:
			# Student logout
			log("LOGOUT: student, sid=%s, student=%r"%(self.session.sid, self.student))
			student = self.student
			student.log_out()
			student_nickname = student.nickname
			teacher = student.lesson.teacher
			send_update_log_out(teacher=teacher, student_nickname=student_nickname)
			self.session.terminate()
			msg = 'Student Logged out: Goodbye ' + student_nickname
			self.set_person(None)
			self.redirect_with_msg(msg)
		else:
			log("LOGOUT: ????, sid=%s"%(self.session.sid))
			if self.session.is_active():	 # defensive
				self.session.terminate()
			self.set_person(None)
			self.redirect_with_msg("Whoops, you weren't logged in")
