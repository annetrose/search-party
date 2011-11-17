# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from google.appengine.ext import webapp

class SearchPartyChannelHandler(webapp.RequestHandler):
	def load_search_party_context(self):
		from helpers import log
		import client_id_utils

		# Note:  Apparently, you cannot get the user or session from here.
		#        Both get_current_session() and get_current_user() return None
		#        when called from this handler.

		log( "" )
		log( "" )
		log( "" )
		log( "...................................................................." )
		log( self.request.url )
		log( "" )
		self.client_id = self.request.get('from', None)
		log( self.client_id )

		person_type = client_id_utils.person_type_for_client_id(self.client_id)
		assert person_type in ("student", "teacher")
		self.is_student = (person_type=="student")
		self.is_teacher = (person_type=="teacher")
		self.person_type = person_type

	def log_status(self):
		from helpers import log, smush
		log( "........  is_teacher=%s,  is_student=%s"%(self.is_teacher, self.is_student))
		log( "...........  student="+repr(self.student) )
		log( "...........  teacher="+repr(self.teacher) )
		log( ".........  client_id="+repr(self.client_id) )
		log( "........len(cookies)=%d"%(len(self.request.cookies)) )
	
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
		from model import Teacher
		from all_exceptions import NoTeacherForChannelError
		try:
			teacher = self._teacher
		except AttributeError:
			if self.is_teacher:
				teacher = self._teacher = Teacher.all().filter("client_ids =", self.client_id).get()  # will match any
				if teacher is None:
					raise NoTeacherForChannelError("%r not in %r"%(self.client_id, [tuple(t.client_ids) for t in Teacher.all()]))
			else:
				teacher = self._teacher = None
		return teacher

	@property
	def student(self):
		from model import Student
		from all_exceptions import NoStudentForChannelError
		try:
			student = self._student
		except AttributeError:
			if self.is_student:
				student = self._student = Student.all().filter("client_ids =", self.client_id).get()
				if student is None:
					raise NoStudentForChannelError("%r not in %r"%(self.client_id, [s.client_ids for s in Student.all()]))
			else:
				student = self._student = None
		return student

#
#		from model import Client
#		self.client = Client.get_by_key_name(self.client_id)
#		if self.client is not None:
#			user_type = self.client.user_type
#			assert user_type in ("student", "teacher")
#			if user_type=="teacher":
#				self.teacher = self.client.teacher
#				self.is_teacher = True
#			elif user_type=="student":
#				self.student = self.client.student
#				self.is_student = True
#		else:
#			log( "Client ID not found! ... %s"%repr(self.client_id) )
