# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0


from google.appengine.ext import db

class SearchPartyModel(db.Model):
	default_sort_key_fn = None

	@classmethod
	def fetch_all(cls, filter_expr, filter_value):
		expected_upper_bound = 10000

		assert (filter_expr is None)==(filter_value is None)
		import settings, helpers

		def get_query():
			query = cls.all()
			if filter_expr is not None:
				assert filter_value is not None
				query = query.filter(filter_expr, filter_value)
			return query

		items = get_query().fetch(expected_upper_bound)
		
		if len(items) >= expected_upper_bound:
			if settings.DEBUG:
				assert False, "Upper bound is apparently not big enough."
			else:
				helpers.log("ERROR:  Upper bound is apparently not big enough.")
				items = list( get_query() )

		if cls.default_sort_key_fn is not None:
			items.sort(key=cls.default_sort_key_fn)

		return tuple(items)

class PersonModel(SearchPartyModel):
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

		self.client_ids = client_ids

	@classmethod
	def all_client_ids(cls):
		return tuple(c for p in cls.all() for c in p.client_ids)

class Teacher(PersonModel):
	# FIELDS
	user = db.UserProperty()
	date = db.DateTimeProperty(auto_now_add=True)

	# OTHER METHODS
	nickname = property(lambda self: self.user.nickname())

	def __repr__(self):
		from helpers import to_str_if_ascii
		return "%s(%r)"%(self.__class__.__name__, to_str_if_ascii(self.user.email()))

class Lesson(SearchPartyModel):
	# FIELDS
	teacher = db.ReferenceProperty(Teacher)
	title = db.StringProperty()
	description = db.StringProperty(multiline=True)
	lesson_code = db.StringProperty()
	class_name = db.StringProperty()
	start_time = db.DateTimeProperty()
	stop_time = db.DateTimeProperty()
	tasks_json = db.TextProperty()
	deleted_time = db.DateTimeProperty()

	# OTHER METHODS
	is_active = property(lambda self: (self.start_time is not None) and (self.stop_time is None))

	@property
	def tasks(self):
#		from django.utils import simplejson as json
		import json
		return json.loads(self.tasks_json)

	lesson_key = property(lambda self: self.key())
	teacher_key = property(lambda self: Lesson.teacher.get_value_for_datastore(self))
	is_deleted = property(lambda self: self.deleted_time is not None)

	def __repr__(self):
		from helpers import to_str_if_ascii
		return "%s(%r)"%(self.__class__.__name__, to_str_if_ascii(self.key().name()))


class Student(PersonModel):
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

	default_sort_key_fn = (lambda item: item.nickname)
	
	@classmethod
	def make_key_name(cls, student_nickname, lesson_code):
		assert "::" not in lesson_code
		return "::".join((student_nickname, lesson_code))

	teacher_key = property(lambda self: Student.teacher.get_value_for_datastore(self))

	def __repr__(self):
		from helpers import to_str_if_ascii
		return "%s(%r)"%(self.__class__.__name__, to_str_if_ascii(self.key().name()))

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
	answer_text = db.StringProperty(multiline=True) # answer only
	answer_explanation = db.StringProperty(multiline=True) # answer only
	timestamp = db.DateTimeProperty(auto_now_add=True) # all

	lesson_key = property(lambda self: StudentActivity.lesson.get_value_for_datastore(self))
	student_key = property(lambda self: StudentActivity.student.get_value_for_datastore(self))

	default_sort_key_fn = (lambda item: item.timestamp)

	def __repr__(self):
		from helpers import to_str_if_ascii
		params_to_show = [
			self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
			self.lesson_key.name(),
			self.student_nickname,
			self.activity_type,
		]
		return self.__class__.__name__ + repr(tuple(params_to_show))

