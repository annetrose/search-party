# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

import webapp2

class SearchPartyChannelHandler(webapp2.RequestHandler):
	def load_search_party_context(self):
		from helpers import log
		import client_id_utils, settings

		# Student and teacher objects are expensive to fetch, so we will use a property
		# to fetch them lazily and use these member variables to cache the value if/when
		# it has been cached.
		self._student = None
		self._teacher = None

		# You cannot get the session info or google authenticated user info from a channel handler.
		# Both get_current_session() and get_current_user() will return None.  All you get is the
		# client ID, which comes via the "from" CGI parameter.

		# Get the client ID for this channel from the CGI parameter.
		self.client_id = self.request.get('from', None)

		# Determine whether this is a teacher or a student using the first character of the
		# client ID (as of 1-10-2012, anyway).  See client_id_utils.py for more details.
		self.person_type = client_id_utils.person_type_for_client_id(self.client_id)
		assert self.person_type in ("student", "teacher")

		self.is_student = (self.person_type=="student")
		self.is_teacher = (self.person_type=="teacher")

		log("\n\n\n" + "."*68 + "\n" + self.request.url + "\n" + self.client_id)

		if settings.DEBUG:
		# This could conceivably cause an unnecessary crash, so only enforce when debugging.
			assert self.person is not None, "Unidentified person !!!!!!!!!!!!!!! "

	@property
	def person(self):
		if self.is_student:
			return self.student
		elif self.is_teacher:
			return self.teacher
		else:
			return None

	@property
	def teacher(self):
		if self._teacher is None:
			from model import Teacher
			self._teacher = Teacher.all().filter("client_ids =", self.client_id).get()  # will match any
		return self._teacher

	@property
	def student(self):
		if self._student is None:
			from model import Student
			self._student = Student.all().filter("client_ids =", self.client_id).get()
		return self._student
