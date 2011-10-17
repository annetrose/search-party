# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyChannelHandler import SearchPartyChannelHandler

class ChannelDisconnectedHandler(SearchPartyChannelHandler):
	def post(self):
#		from helpers import send_log_msg, send_update_msg
		from helpers import log

		self.load_search_party_context()
		log("DISC:  client.client_id=%r"%self.client.client_id)
		if self.is_teacher:
			pass
#			for student in self.teacher.students:
#				send_log_msg(student, "Teacher disconnected")
		elif self.is_student:
#			send_update_msg(self.student.teacher, "Student %s logged out"%(self.student.nickname) )
			self.student.log_out()
