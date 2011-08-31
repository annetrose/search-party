# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0


from google.appengine.ext import db

def generic_repr(self):
# Generic __repr__ function that can be glued onto any class.  Results in a string like...
#    Car(maker_name="Toyota", model_name="Prius", num_wheels=4)
	params = sorted(vars(self).items())
	params_str = ", ".join("%s=%s"%(k,repr(v)) for k,v in params)
	class_name = self.__class__.__name__
	repr_str = class_name + "(" + params_str + ")"
	return repr_str


class SearchParty(db.Model):
	next_teacher_id = db.IntegerProperty(default=1)
	__repr__ = generic_repr

	
class Teacher(db.Model):
	user = db.UserProperty()
	teacher_id = db.IntegerProperty()
	password = db.StringProperty()
	date = db.DateTimeProperty(auto_now_add=True)

	students = property(lambda self: tuple(Student.all().filter("teacher =", self)))
	__repr__ = generic_repr
	nickname = property(lambda self: self.user.nickname())

	@property
	def client_ids(self):
		client_ids = []
		for client in Client.all().filter("teacher =", self):
			client_ids.append( client.client_id )
		return tuple(client_ids)


class Student(db.Model):
	logged_in = db.BooleanProperty()
	teacher = db.ReferenceProperty(Teacher)
	nickname = db.StringProperty()
	date = db.DateTimeProperty(auto_now_add=True)
	session_sid = db.StringProperty()

	__repr__ = generic_repr
	def log_out(self):
		self.logged_in = False
		self.session_sid = ""
		self.put()
	client_id = property(lambda self: Client.all().filter("student =", self).get().client_id )
	client_ids = property(lambda self: (self.client_id,))  # for consistency with Teacher


class StudentActivity(db.Model):
	teacher = db.ReferenceProperty(Teacher)
	student = db.ReferenceProperty(Student)
	activity_type = db.StringProperty()
	search = db.StringProperty()
	link = db.LinkProperty()
	date = db.DateTimeProperty(auto_now_add=True)

	__repr__ = generic_repr


class Client(db.Model):
	client_id = db.StringProperty()
	teacher = db.ReferenceProperty(Teacher)
	student = db.ReferenceProperty(Student)
	user_type = db.StringProperty()  # either "teacher" or "student"

	__repr__ = generic_repr
