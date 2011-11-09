# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from PersonPage import PersonPage

class TeacherPage(PersonPage):
	def get(self, lesson_code):
		# TODO:  Find out why this method takes too long:  ms=52 cpu_ms=2860 api_cpu_ms=2822

		from helpers import log, smush
		from model import Lesson
		self.load_search_party_context(user_type="teacher")
		log( "PAGE:  %s, session.sid=%s, is_teacher==%s"%(self.__class__.__name__, smush(self.session.sid, 20), self.is_teacher) )

		if not self.is_teacher:
			self.redirect_to_teacher_login()
		else:
			lesson = Lesson.all().filter("lesson_code =", lesson_code).get()
			if lesson.teacher.key() != self.teacher.key():
				log("lesson.teacher == %r"%lesson.teacher)
				log("self.teacher   == %r"%self.teacher)
				self.redirect_to_teacher_login()
			else:
				default_start_pane = "students"

				template_values = {
					'header': self.gen_header("teacher"),
#					"teacher_id" : self.teacher.teacher_id,
					'lesson_code': lesson.lesson_code,
					"lesson"     : lesson,  # needed for task chooser
					"token"      : self.create_channel(),
					"students_js": self.make_student_structure_js(lesson=lesson, indent="  "),
					"root_words" : "{}",
					"default_start_pane" : default_start_pane,
				}
				if self.session.has_key('msg'):
					template_values['msg'] = self.session.pop('msg')  # only show the message once
				self.write_response_with_template("teacher.html", template_values)
