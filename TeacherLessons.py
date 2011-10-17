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

	def serve_create_lesson_form(self):
		import helpers, settings
		from model import Lesson
		active_lessons = []
		inactive_lessons = []

		for lesson in Lesson.all():
			if lesson.is_active:
				active_lessons.append(lesson)
			else:
				inactive_lessons.append(lesson)

		template_values = {
			'header'        : self.gen_header("teacher"),
			"task_nums"     : self.TASK_NUMS,
			"dbg_timestamp" : (helpers.timestamp() if settings.ENABLE_FILLER_FORM_FILLING else ""),
			"active_lessons": active_lessons,
			"inactive_lessons" : inactive_lessons,
		}
		if self.session.has_key('msg'):
			template_values['msg'] = self.session.pop('msg')  # only show the message once

		self.write_response_with_template("teacher_lessons.html", template_values)


	def get_or_post(self, method):
		# TODO:  Find out why this method takes too long:  ms=52 cpu_ms=2860 api_cpu_ms=2822

		from helpers import log, chop
		from datetime import datetime
		from model import Lesson, Task
		assert method in ("get", "post")
		self.load_search_party_context()
		log( "PAGE:  %s, is_teacher==%s, method==%s, session.sid==%s"%
				(self.__class__.__name__, self.is_teacher, method, chop(self.session.sid, 20)) )

		if method=="post":
			form_item = lambda key:self.request.get(key, "").strip()

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
			if (len(lesson_title) > 0) and (len(lesson_code) > 0) and (len(task_infos) > 0):
				now = datetime.now()
				lesson = Lesson(teacher=self.teacher, title=lesson_title, lesson_code=lesson_code,
						        description=lesson_description, class_name=class_name,
								start_time=now, stop_time=None)
				lesson.put()
				for task_idx,task_info in enumerate(task_infos):
					task_title,task_description = task_info
					task = Task(lesson=lesson, title=task_title, description=task_description, task_idx=task_idx)
					task.put()

		if self.is_teacher:
			self.serve_create_lesson_form()
		else:
			self.redirect_to_teacher_login()
	
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
			lesson = Lesson.all().filter("lesson_code =", lesson_code).get()
			if lesson is None:
				break
		return lesson_code

