# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyChannelHandler import SearchPartyChannelHandler

class ChannelConnectedHandler(SearchPartyChannelHandler):
	def post(self):
		self.load_search_party_context()
		if self.is_student:
			student = self.student
			student.logged_in = True
			student.is_disconnected = False
			student.put()
