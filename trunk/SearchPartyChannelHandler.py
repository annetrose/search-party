# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from google.appengine.ext import webapp

class SearchPartyChannelHandler(webapp.RequestHandler):
	def load_search_party_context(self):
		from model import Client
		from helpers import log

		log( "" )
		log( "" )
		log( "" )
		log( "...................................................................." )
		log( self.request.url )
		log( "" )
		self.client_id = self.request.get('from', None)
		self.is_student = False
		self.is_teacher = False
		self.teacher = None
		self.student = None
		self.client = Client.get_by_key_name(self.client_id)
		if self.client is not None:
			user_type = self.client.user_type
			assert user_type in ("student", "teacher")
			if user_type=="teacher":
				self.teacher = self.client.teacher
				self.is_teacher = True
			elif user_type=="student":
				self.student = self.client.student
				self.is_student = True
		else:
			log( "Client ID not found! ... %s"%repr(self.client_id) )
