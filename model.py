# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0


from google.appengine.ext import db

class SearchPartyModel(db.Model):
	def __repr__(self):
	# Generic __repr__ function that can be glued onto any class.  Results in a string like...
	#    Car(maker_name="Toyota", model_name="Prius", num_wheels=4)
		params = sorted(vars(self).items())
		params_str = ", ".join("%s=%s"%(k,repr(v)) for k,v in params)
		class_name = self.__class__.__name__
		repr_str = class_name + "(" + params_str + ")"
		return repr_str

class SearchParty(SearchPartyModel):
	# FIELDS
	next_teacher_id = db.IntegerProperty(default=1)

	
class Teacher(SearchPartyModel):
	# FIELDS
	user = db.UserProperty()
	teacher_id = db.IntegerProperty()
	password = db.StringProperty()
	date = db.DateTimeProperty(auto_now_add=True)

	# OTHER METHODS
	students = property(lambda self: tuple(Student.all().filter("teacher =", self)))
	nickname = property(lambda self: self.user.nickname())

	def get_all_client_ids(self):
		client_ids = []
		for client in Client.all().filter("teacher =", self):
			client_ids.append( client.client_id )

		# Might end up with multiple copies of same client.  For now, bandage over it.  FIXME
		client_ids = tuple(set(client_ids))

		# Teacher is allowed to be logged in at multiple computers.  Students are not.
		return tuple(client_ids)

	def make_client_id(self, session_sid):
		#  This is to be explicit and have this defined in one and only one place.
		return session_sid

class Student(SearchPartyModel):
	# FIELDS
	logged_in = db.BooleanProperty()
	teacher = db.ReferenceProperty(Teacher)
	nickname = db.StringProperty()
	date = db.DateTimeProperty(auto_now_add=True)
	session_sid = db.StringProperty()

	# OTHER METHODS
	def log_out(self):
		self.logged_in = False
		self.session_sid = ""
		self.put()

	def get_all_client_ids(self):
		#  This is to be explicit and have this defined in one and only one place.
		clients = tuple(Client.all().filter("student =", self).get())
		client_ids = tuple(client.client_id for client in clients)

		# Might end up with multiple copies of same client.  For now, bandage over it.  FIXME
		client_ids = tuple(set(client_ids))

		# Students are not allowed to be logged in at multiple computers.  Teachers are.
		assert len(client_ids) in (0,1), "Got %d client_ids.  %s"%(len(client_ids), repr(client_ids))

		return client_ids

	def make_client_id(self, session_sid):
		#  This is to be explicit and have this defined in one and only one place.
		return session_sid

class StudentActivity(SearchPartyModel):
	# FIELDS
	teacher = db.ReferenceProperty(Teacher)
	student = db.ReferenceProperty(Student)
	activity_type = db.StringProperty()
	search = db.StringProperty()
	link = db.LinkProperty()
	date = db.DateTimeProperty(auto_now_add=True)

class Client(SearchPartyModel):
	# FIELDS
	client_id = db.StringProperty()
	teacher = db.ReferenceProperty(Teacher)
	student = db.ReferenceProperty(Student)
	user_type = db.StringProperty()  # either "teacher" or "student"

class Lesson(SearchPartyModel):
	# FIELDS
	teacher = db.ReferenceProperty(Teacher)
	title = db.StringProperty()
	description = db.StringProperty()
	class_name = db.StringProperty()
	start_time = db.DateTimeProperty()
	stop_time = db.DateTimeProperty()

	# OTHER METHODS
	is_active = property(lambda self: (self.start_time is not None) and (self.stop_time is None))

class Task(SearchPartyModel):
	# FIELDS
	assignment = db.ReferenceProperty(Teacher)
	title = db.StringProperty()
	description = db.StringProperty()
