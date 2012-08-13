# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from PersonPage import PersonPage

class AllStudentInfoHandler(PersonPage):
    def get(self, lesson_code):

#        self.load_search_party_context(user_type="teacher")

        try:
            from model import Lesson
            import json
            import settings
            
#            if not self.is_teacher:
#                raise NotAnAuthenticatedTeacherError()

            lesson = Lesson.get_by_key_name(lesson_code)
            if lesson is None:
                raise LessonNotFoundError()
#            if lesson.teacher_key != self.teacher_key:
#                raise WrongTeacherError()

#            teacher = self.person
#            person_key = teacher.user.user_id();
#            token = self.create_channel(person_key=person_key, lesson_code=lesson_code)
#            default_start_pane = "students"

#            template_values = {
#                'header'             : self.gen_header("teacher"),
#                'token'              : token,
#                'lesson'             : lesson,
#                'lesson_json'        : self.get_lesson_json(lesson_code),
#                'students_js'        : self.make_student_structure_js2(lesson=lesson, indent="  "),
#                'default_start_pane' : default_start_pane,
#                'debug_mode'         : json.dumps(settings.DEBUG)
#            }
            
            response_data = self.make_student_structure_json(lesson=lesson, indent="  "),

#            if self.session.has_key('msg'):
#                template_values['msg'] = self.session.pop('msg')  # only show the message once

            #self.write_response_with_template("teacher.html", template_values)
            
            import json
            self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
            self.response.out.write(json.dumps(response_data))

        except NotAnAuthenticatedTeacherError:
            self.redirect_to_teacher_login()

        except LessonNotFoundError:
            self.redirect_with_msg("There was an internal error.  Please choose your lesson to continue.", "/teacher_dashboard")

        except WrongTeacherError:
            self.redirect_to_teacher_login()

class WrongTeacherError(Exception): pass
class LessonNotFoundError(Exception): pass
class NotAnAuthenticatedTeacherError(Exception): pass
