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
		from helpers import to_str_if_ascii
		class_name = self.__class__.__name__
		key = self.key()
		key_name = key.name() if key is not None else None

		if key_name is not None:
			params_str = repr(to_str_if_ascii(key_name))
		elif self._entity is not None:
			params = sorted((k,v) for (k,v) in self._entity.items() if not k.startswith("_"))
			params_str = ", ".join("%s=%s"%(k,repr(to_str_if_ascii(v))) for k,v in params)
		else:
			params_str = "..."
		repr_str = class_name + "(" + params_str + ")"
		return repr_str

	__str__ = __repr__

	
class Teacher(SearchPartyModel):
	# FIELDS
	user = db.UserProperty()
	date = db.DateTimeProperty(auto_now_add=True)

	# OTHER METHODS
	nickname = property(lambda self: self.user.nickname())

	def get_all_client_ids(self):
		client_ids = []
		for client in Client.all().filter("teacher =", self):  # PERFORMANCE:  Attach client IDs to Teacher.
			client_ids.append( client.client_id )

		# Might end up with multiple copies of same client.  For now, bandage over it.  FIXME
		client_ids = tuple(set(client_ids))

		# Teacher is allowed to be logged in at multiple computers.  Students are not.
		return tuple(client_ids)

	def make_client_id(self, session_sid):
		#  This is to be explicit and have this defined in one and only one place.
		return session_sid

	def __repr__(self):
		from helpers import to_str_if_ascii
		return "Teacher(%r)"%to_str_if_ascii(self.user.email())

class Lesson(SearchPartyModel):
	# FIELDS
	teacher = db.ReferenceProperty(Teacher)
	title = db.StringProperty()
	description = db.StringProperty(multiline=True)
	lesson_code = db.StringProperty()
	class_name = db.StringProperty()
	start_time = db.DateTimeProperty()
	stop_time = db.DateTimeProperty()
	tasks_repr = db.TextProperty()

	# OTHER METHODS
	is_active = property(lambda self: (self.start_time is not None) and (self.stop_time is None))

	@property
	def tasks(self):
		from helpers import literal_eval
		return literal_eval(self.tasks_repr)

	lesson_key = property(lambda self: self.key())
	teacher_key = property(lambda self: Lesson.teacher.get_value_for_datastore(self))

class Student(SearchPartyModel):
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

	def log_out(self):
		from datetime import datetime
		self.latest_logout_timestamp = datetime.now()
		self.logged_in = False
		#self.session_sid = ""
		self.put()

	def get_all_client_ids(self):
		#  This is to be explicit and have this defined in one and only one place.
		clients = tuple(Client.all().filter("student =", self))
		client_ids = tuple(client.client_id for client in clients)

		# Might end up with multiple copies of same client.  For now, bandage over it.  FIXME
		client_ids = tuple(set(client_ids))

		# Students are not allowed to be logged in at multiple computers.  Teachers are.
		assert len(client_ids) in (0,1), "Got %d client_ids.  %s"%(len(client_ids), repr(client_ids))

		return client_ids

	def make_client_id(self, session_sid):
		#  This is to be explicit and have this defined in one and only one place.
		return session_sid
	
	@classmethod
	def make_key_name(cls, student_nickname, lesson_code):
		assert "::" not in lesson_code
		return "::".join((student_nickname, lesson_code))

	teacher_key = property(lambda self: Student.teacher.get_value_for_datastore(self))

class StudentActivity(SearchPartyModel):
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

class Client(SearchPartyModel):
	# FIELDS
	client_id = db.StringProperty()
	teacher = db.ReferenceProperty(Teacher)
	student = db.ReferenceProperty(Student)
	user_type = db.StringProperty()  # either "teacher" or "student"
	teacher_key = property(lambda self: Client.teacher.get_value_for_datastore(self))
	student_key = property(lambda self: Client.student.get_value_for_datastore(self))


#class Task(SearchPartyModel):  # NO LONGER USED, only left to aid in updating old databases.
#	# FIELDS
#	lesson = db.ReferenceProperty(Lesson)
#	title = db.StringProperty()
#	description = db.StringProperty(multiline=True)
#	task_idx = db.IntegerProperty()

#class StudentAnswer(SearchPartyModel):  # NO LONGER USED, only left to aid in updating old databases.
#	student = db.ReferenceProperty(Student)
#	student_nickname = db.StringProperty()
#	lesson = db.ReferenceProperty(Lesson)
#	task_idx = db.IntegerProperty()
#	text = db.StringProperty()
#	explanation = db.StringProperty()
#	timestamp = db.DateTimeProperty(auto_now_add=True)

#class SearchParty(SearchPartyModel):
#	# FIELDS
#	next_teacher_id = db.IntegerProperty(default=1)

