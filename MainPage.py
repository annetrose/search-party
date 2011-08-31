# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class MainPage(SearchPartyRequestHandler):
	def get(self):
		from helpers import log
		self.load_search_party_context()
		log("MAIN:  session.sid=%s, user=%s"%(self.session.sid, self.user))
		if self.is_teacher:   # Teacher logged in
			self.redirect_with_msg("", dst="/teacher") ###
		elif self.is_student: # Student logged in
			self.redirect_with_msg("", dst="/student")
		else:
			template_values = { 'header': self.gen_header() }
			if self.session.has_key('msg'):
				template_values['msg'] = self.session.pop('msg')  # only show the message once
			self.render_template("index.html", template_values)
