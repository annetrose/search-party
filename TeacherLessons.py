# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class TeacherLessons(SearchPartyRequestHandler):
	TASK_NUMS = (1,2,3,4,5)

	def get(self):
		self.get_or_post("get")

	def post(self):
		self.get_or_post("post")
	
	def get_lessons_json(self):
		from model import Lesson
		from django.utils import simplejson as json
		import datetime
		from helpers import log
		
		def handler(o):
			if isinstance(o, datetime.datetime):
				return "(new Date(%d, %d, %d, %d, %d, %d))"%(
						o.year,
						o.month,
						o.day,
						o.hour,
						o.minute,
						o.second)
			else:
				raise TypeError(repr(o))

		lessons = Lesson.fetch_all(filter_expr="teacher", filter_value=self.teacher)
		lesson_infos = []
		for lesson in lessons:
			if not lesson.is_deleted:
				lesson_infos.append({
					"lesson_code" : lesson.lesson_code,
					"title" : lesson.title,
					"description" : lesson.description,
					"class_name" : lesson.class_name,
					"start_time" : lesson.start_time,
					"stop_time" : lesson.stop_time,
					"tasks" : lesson.tasks,
					"is_active" : lesson.is_active
				})
		lessons_json = json.dumps(lesson_infos, default=handler)
		return lessons_json


	
	def serve_create_lesson_form(self):
		import helpers, settings
#		from model import Lesson
#		active_lessons = []
#		inactive_lessons = []

#		for lesson in Lesson.all().filter("teacher =", self.teacher):
#			if lesson.is_active:
#				active_lessons.append(lesson)
#			else:
#				inactive_lessons.append(lesson)

		template_values = {
			'header'        : self.gen_header("teacher"),
			"task_nums"     : self.TASK_NUMS,
			"dbg_timestamp" : (helpers.timestamp() if settings.ENABLE_FILLER_FORM_FILLING else ""),
#			"active_lessons": active_lessons,
#			"inactive_lessons" : inactive_lessons,
			"lessons_json"  : self.get_lessons_json()
		}
		if self.session.has_key('msg'):
			template_values['msg'] = self.session.pop('msg')  # only show the message once

		self.write_response_with_template("teacher_lessons.html", template_values)


	def get_or_post(self, method):
		# TODO:  Find out why this method takes too long:  ms=52 cpu_ms=2860 api_cpu_ms=2822

		from helpers import log, chop
		from datetime import datetime
		from model import Lesson
		from django.utils import simplejson as json
		assert method in ("get", "post")
		self.load_search_party_context(user_type="teacher")
		log( "PAGE:  %s, is_teacher==%s, method==%s, session.sid==%s"%
				(self.__class__.__name__, self.is_teacher, method, chop(self.session.sid, 20)) )

		form_item = lambda key:self.request.get(key, "").strip()

		if not self.is_teacher:
			self.redirect_to_teacher_login()
		elif method=="post":

			lesson_title = form_item("lesson_title")
			lesson_code = self.make_lesson_code()
			lesson_description = form_item("lesson_description")
			class_name = form_item("class_name")
			task_infos = []
			for task_num in self.TASK_NUMS:
				task_title = form_item("task_title_%d"%task_num)
				task_description = form_item("task_description_%d"%task_num)
				if task_title != "":
					task_infos.append((task_title, task_description))

#			tasks_repr = repr(tuple(task_infos))
			tasks_json = json.dumps(task_infos)

			if (len(lesson_title) > 0) and (len(lesson_code) > 0) and (len(task_infos) > 0):
				now = datetime.now()
				lesson = Lesson(key_name=lesson_code,
								teacher=self.teacher, title=lesson_title, lesson_code=lesson_code,
						        description=lesson_description, class_name=class_name,
								start_time=now, stop_time=None, tasks_json=tasks_json)
#								start_time=now, stop_time=None, tasks_repr=tasks_repr)
				lesson.put()

				self.redirect("/teacher/%s"%lesson_code)
			else:
				self.serve_create_lesson_form()
		else:
			action = form_item("action")
			if action != "":
				lesson_code = form_item("lesson_code")
				log( action )
				log( lesson_code )
				lesson = Lesson.get_by_key_name(lesson_code)
				now = datetime.now()
				if action=="start":
					lesson.stop_time = None
				elif action=="stop":
					lesson.stop_time = now
				elif action=="delete":
					lesson.delete_time = now
					if lesson.stop_time is None:
						lesson.stop_time = now
				lesson.put()
				self.write_response_plain_text("OK")
			else:
				log( "action not found" )
				log( self.request.url )
				self.serve_create_lesson_form()
	
	def make_lesson_code(self):
		import random
		from model import Lesson
		digits = 5
		format = "%%0%d"%digits
		
		# This is essentially a do loop, but I'm using a generous upper bound to prevent the
		# possibility of an endless (and potentially costly) spin, in case of a bug, for example.
		for i in range(1000):
			assert i < 1000 - 1, "Looks like infinite loop."
			n = random.randint(0,10**digits - 1)
			lesson_code = "%05d"%n
			lesson = Lesson.get_by_key_name(lesson_code)
			if lesson is None:
				break
		return lesson_code
