# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from PersonPage import PersonPage

class TeacherPage(PersonPage):
	def get(self, lesson_code):
		from model import Lesson
		import json
		import settings
		self.load_search_party_context(user_type="teacher")

		try:
			if not self.is_teacher:
				raise NotAnAuthenticatedTeacherError()

			lesson = Lesson.get_by_key_name(lesson_code)

			if lesson is None:
				raise LessonNotFoundError()
			if lesson.teacher_key != self.teacher_key:
				raise WrongTeacherError()

			default_start_pane = "students"

			template_values = {
				'header': self.gen_header("teacher"),
				"lesson"     : lesson,  # needed for task chooser
				"token"      : self.create_channel(lesson_code=lesson_code),
				"students_js": self.make_student_structure_js(lesson=lesson, indent="  "),
				"default_start_pane" : default_start_pane,
				"debug_mode" : json.dumps(settings.DEBUG),
			}

			if self.session.has_key('msg'):
				template_values['msg'] = self.session.pop('msg')  # only show the message once

			self.write_response_with_template("teacher.html", template_values)

		except NotAnAuthenticatedTeacherError:
			self.redirect_to_teacher_login()

		except LessonNotFoundError:
			self.redirect_with_msg("There was an internal error.  Please choose your lesson to continue.", "/teacher_lessons")

		except WrongTeacherError:
			self.redirect_to_teacher_login()

class WrongTeacherError(Exception): pass
class LessonNotFoundError(Exception): pass
class NotAnAuthenticatedTeacherError(Exception): pass
