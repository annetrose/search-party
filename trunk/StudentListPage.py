## SearchParty - Learning to Search in a Web-Based Classroom
## Authors: Ben Bederson - www.cs.umd.edu/~bederson
##          Alex Quinn - www.cs.umd.edu/~aq
##          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
## Date: Originally created July 2011
## License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
#
#from SearchPartyRequestHandler import SearchPartyRequestHandler
#
#class StudentListPage(SearchPartyRequestHandler):
#	def get(self):
#		self.load_search_party_context()
#		# TODO:  Find out why this method takes too long:  ms=52 cpu_ms=2860 api_cpu_ms=2822
#		if self.is_teacher:
#			template_values = {
#				'header':       self.gen_header("teacher"),
#				'teacher_info': self.gen_teacher_info(self.teacher.teacher_id, self.teacher.password),
#				'token':        self.create_channel()
#			}
#			if self.session.has_key('msg'):
#				template_values['msg'] = self.session.pop('msg')  # only show the message once
#			self.write_response_with_template("student_list.html", template_values)
#		else:
#			self.redirect_to_teacher_login()
