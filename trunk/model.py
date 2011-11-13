# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0


from google.appengine.ext import db

class Person(db.Model):
	client_ids = db.StringListProperty()

	def add_client_id(self, client_id):
		self._update_client_ids(client_id_to_add=client_id)
	
	def remove_client_id(self, client_id):
		self._update_client_ids(client_id_to_remove=client_id)
	
	def _update_client_ids(self, client_id_to_add=None, client_id_to_remove=None):
		from helpers import log

#		log( "Before:  client_ids == %r"%self.client_ids )
		client_ids = self.client_ids
		if client_ids is None:
			client_ids = []

		if client_id_to_add is not None:
			client_ids.append(client_id_to_add)
		
		if client_id_to_remove is not None:
			client_ids.remove(client_id_to_remove)

#		if (client_id_to_add is not None) and (client_id_to_add not in client_ids):
#			client_ids.append(client_id_to_add)
#
#		if client_id_to_remove is not None:
#			while client_id_to_remove in client_ids:  # just in case it snuck in multiple times.
#				client_ids.remove(client_id_to_remove)

		self.client_ids = client_ids

#		try:
#			self.client_ids = client_ids
#		except:
#			log( "client_id==%r"%self.client_id )
#			log( "client_ids==%r"%client_ids )
#			log( "self.client_ids==%r"%self.client_ids )
#			log( "type(self.client_ids)==%r"%type(self.client_ids) )
#			raise
#		log( "After:  client_ids == %r"%self.client_ids )

	@classmethod
	def all_client_ids(cls):
		return tuple(c for p in cls.all() for c in p.client_ids)

class Teacher(Person):
	# FIELDS
	user = db.UserProperty()
	date = db.DateTimeProperty(auto_now_add=True)

	# OTHER METHODS
	nickname = property(lambda self: self.user.nickname())

#	def get_all_client_ids(self):
#		client_ids = []
#		for client in Client.all().filter("teacher =", self):  # PERFORMANCE:  Attach client IDs to Teacher.
#			client_ids.append( client.client_id )
#
#		# Might end up with multiple copies of same client.  For now, bandage over it.  FIXME
#		client_ids = tuple(set(client_ids))
#
#		# Teacher is allowed to be logged in at multiple computers.  Students are not.
#		return tuple(client_ids)


#	def make_client_id(self, session_sid):
#		#  This is to be explicit and have this defined in one and only one place.
#		return session_sid

	def __repr__(self):
		from helpers import to_str_if_ascii
		return "%s(%r)"%(self.__class__.__name__, to_str_if_ascii(self.user.email()))

class Lesson(Person):
	# FIELDS
	teacher = db.ReferenceProperty(Teacher)
	title = db.StringProperty()
	description = db.StringProperty(multiline=True)
	lesson_code = db.StringProperty()
	class_name = db.StringProperty()
	start_time = db.DateTimeProperty()
	stop_time = db.DateTimeProperty()
	tasks_json = db.TextProperty()

	# OTHER METHODS
	is_active = property(lambda self: (self.start_time is not None) and (self.stop_time is None))

	@property
	def tasks(self):
		from django.utils import simplejson as json
		return json.loads(self.tasks_json)

	lesson_key = property(lambda self: self.key())
	teacher_key = property(lambda self: Lesson.teacher.get_value_for_datastore(self))

	def __repr__(self):
		from helpers import to_str_if_ascii
		return "%s(%r)"%(self.__class__.__name__, to_str_if_ascii(self.key().name()))


class Student(Person):
	# FIELDS
	logged_in = db.BooleanProperty()
	nickname = db.StringProperty()
	session_sid = db.StringProperty()
	lesson = db.ReferenceProperty(Lesson)
	teacher = db.ReferenceProperty(Teacher)
	task_idx = db.IntegerProperty()
	first_login_timestamp = db.DateTimeProperty(auto_now_add=True)
	latest_login_timestamp = db.DateTimeProperty()
	latest_logout_timestamp = db.DateTimeProperty()
	client_id = db.StringProperty()

	def log_out(self, clear_session_sid=False):
		from datetime import datetime
		self.latest_logout_timestamp = datetime.now()
		self.logged_in = False
		if clear_session_sid:
			self.session_sid = ""
		self.put()

#	client_ids = property(lambda self:[self.client_id])

#	def get_all_client_ids(self):
#		#  This is to be explicit and have this defined in one and only one place.
#		clients = tuple(Client.all().filter("student =", self))
#		client_ids = tuple(client.client_id for client in clients)
#
#		# Might end up with multiple copies of same client.  For now, bandage over it.  FIXME
#		client_ids = tuple(set(client_ids))
#
#		# Students are not allowed to be logged in at multiple computers.  Teachers are.
#		assert len(client_ids) in (0,1), "Got %d client_ids.  %s"%(len(client_ids), repr(client_ids))
#
#		return client_ids
#
#	def make_client_id(self, session_sid):
#		#  This is to be explicit and have this defined in one and only one place.
#		return session_sid

	@property
	def is_logged_in(self):
		login = self.latest_login_timestamp
		logout = self.latest_logout_timestamp

		assert login is not None
		assert login != logout

		if logout is None:
			return True
		elif logout < login:
			return True
		elif logout > login:
			return False
		else:
			assert False, "unexpected, login=%r, logout=%r"%(login, logout)

	
	@classmethod
	def make_key_name(cls, student_nickname, lesson_code):
		assert "::" not in lesson_code
		return "::".join((student_nickname, lesson_code))

	teacher_key = property(lambda self: Student.teacher.get_value_for_datastore(self))

	def __repr__(self):
		from helpers import to_str_if_ascii
		return "%s(%r)"%(self.__class__.__name__, to_str_if_ascii(self.key().name()))

class StudentActivity(db.Model):
	ACTIVITY_TYPE_LINK = "link"
	ACTIVITY_TYPE_SEARCH = "search"
	ACTIVITY_TYPE_LINK_RATING = "link_rating"
	ACTIVITY_TYPE_ANSWER = "answer"

	# FIELDS
	student = db.ReferenceProperty(Student)  # all
	student_nickname = db.StringProperty()   # all
	lesson = db.ReferenceProperty(Lesson)    # all
	task_idx = db.IntegerProperty()          # all
	activity_type = db.StringProperty()      # all
	search = db.StringProperty()             # search or link only
	link = db.LinkProperty()                 # link or link_rating only
	link_title = db.StringProperty()         # link only
	is_helpful = db.BooleanProperty()        # link_rating only
	answer_text = db.StringProperty()        # answer only
	answer_explanation = db.StringProperty() # answer only
	timestamp = db.DateTimeProperty(auto_now_add=True) # all

	lesson_key = property(lambda self: StudentActivity.lesson.get_value_for_datastore(self))
	student_key = property(lambda self: StudentActivity.student.get_value_for_datastore(self))

	def __repr__(self):
		from helpers import to_str_if_ascii
		return "%s(%r, %r, %r)"%(self.__class__.__name__, self.activity_type, to_str_if_ascii(self.lesson_key.name()), self.timestamp.strftime("%Y-%m-%d %H:%M:%S"))

#class Client(db.Model):
#	# FIELDS
#	client_id = db.StringProperty()
#	teacher = db.ReferenceProperty(Teacher)
#	student = db.ReferenceProperty(Student)
#	user_type = db.StringProperty()  # either "teacher" or "student"
#	teacher_key = property(lambda self: Client.teacher.get_value_for_datastore(self))
#	student_key = property(lambda self: Client.student.get_value_for_datastore(self))

#class Task(db.Model):  # NO LONGER USED, only left to aid in updating old databases.
#	# FIELDS
#	lesson = db.ReferenceProperty(Lesson)
#	title = db.StringProperty()
#	description = db.StringProperty(multiline=True)
#	task_idx = db.IntegerProperty()

#class StudentAnswer(db.Model):  # NO LONGER USED, only left to aid in updating old databases.
#	student = db.ReferenceProperty(Student)
#	student_nickname = db.StringProperty()
#	lesson = db.ReferenceProperty(Lesson)
#	task_idx = db.IntegerProperty()
#	text = db.StringProperty()
#	explanation = db.StringProperty()
#	timestamp = db.DateTimeProperty(auto_now_add=True)

#class SearchParty(db.Model):
#	# FIELDS
#	next_teacher_id = db.IntegerProperty(default=1)

#class SearchPartyModel(db.Model):
#	def __repr__(self):
#	# Generic __repr__ function that can be glued onto any class.  Results in a string like...
#	#    Car(maker_name="Toyota", model_name="Prius", num_wheels=4)
#		from helpers import to_str_if_ascii
#		class_name = self.__class__.__name__
#		key = self.key()
#		key_name = key.name() if key is not None else None
#
#		if key_name is not None:
#			params_str = repr(to_str_if_ascii(key_name))
#		elif self._entity is not None:
#			params = sorted((k,v) for (k,v) in self._entity.items() if not k.startswith("_"))
#			params_str = ", ".join("%s=%s"%(k,repr(to_str_if_ascii(v))) for k,v in params)
#		else:
#			params_str = "..."
#		repr_str = class_name + "(" + params_str + ")"
#		return repr_str
#
#	__str__ = __repr__
