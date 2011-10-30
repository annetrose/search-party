# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from PersonPage import PersonPage

class StudentPage(PersonPage):
	def get(self):
		from helpers import log
		self.load_search_party_context(user_type="student")

		if not self.is_student:
			self.redirect_with_msg('Not a student')
		else:
			lesson = self.student.lesson
			template_values = {
				'header' :     self.gen_header("student"),
				'nickname' :   self.student.nickname,
				"token" :      self.create_channel(),
				"lesson" :     lesson,
				"student_js" : self.make_student_structure_js(lesson=lesson, indent="  ", student=self.student),
			}
			if self.session.has_key('msg'):
				template_values['msg'] = self.session.pop('msg')  # only show the message once

			self.write_response_with_template("student.html", template_values)
