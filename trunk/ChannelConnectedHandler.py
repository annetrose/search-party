# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyChannelHandler import SearchPartyChannelHandler

class ChannelConnectedHandler(SearchPartyChannelHandler):
	def post(self):
		# FIXME:  This is getting called multiple times for one page load.
		from helpers import send_log_msg
		self.load_search_party_context()
		if self.is_student:
			send_log_msg(self.student.teacher, "Student %s has logged on."%(self.student.nickname))
			if not self.student.logged_in:
				self.student.logged_in = True
				self.student.put()
