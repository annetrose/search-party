# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class TeacherDashboard(SearchPartyRequestHandler):

    def get(self):
        self.load_search_party_context(user_type="teacher")

        try:
            if not self.is_teacher:
                raise NotAnAuthenticatedTeacherError()
            
            else:
                form_item = lambda key:self.request.get(key, "").strip()
                if form_item is not None:
                    lesson_code = form_item("lesson_code")
                    if lesson_code != "":
                        from model import Lesson
                        lesson = Lesson.get_by_key_name(lesson_code)       
                    action = form_item("action")
                if action=="create":
                    self.create_lesson(form_item)
                elif action=="start":
                    self.start_lesson(lesson)  
                elif action=="stop":
                    self.stop_lesson(lesson)
                elif action=="stopall":
                    self.stop_all_lessons()
                elif action=="clear":
                    self.clear_lesson(lesson)
                elif action=="delete":
                    self.delete_lesson(lesson)
                elif action=="deleteall":
                    self.delete_all_lessons()
                elif action=="logoutstudent":
                    from model import Student
                    student_nickname = form_item("student_nickname")
                    student_key = "::".join((student_nickname, lesson_code))
                    student = Student.get_by_key_name(student_key)
                    self.log_out_student(student)
                else:
                    self.show_dashboard()

        except NotAnAuthenticatedTeacherError:
            self.redirect_to_teacher_login()

    def post(self):
        self.get();
        
    def show_dashboard(self):
            import helpers
            import settings
            
            template_values = {
                'header'     : self.gen_header("teacher"),
                "lessons_json"  : self.get_lessons_json(),
                "dbg_timestamp" : (helpers.timestamp() if settings.ENABLE_FILLER_FORM_FILLING else ""),
            }

            if self.session.has_key('msg'):
                template_values['msg'] = self.session.pop('msg')
                    
            self.write_response_with_template("teacher_dashboard.html", template_values)
            
    def create_lesson(self, form_item):
        lesson_title = self.request.get("lesson_title")
        lesson_code = self.make_lesson_code()
        lesson_description = form_item("lesson_description")
        class_name = form_item("class_name")
        task_infos = []
    
        for task_num in range(1, int(self.request.get("max_num_tasks", "10"))+1):
            task_title = form_item("task_title_%d"%task_num)
            task_description = form_item("task_description_%d"%task_num)
            if task_title != "":
                task_infos.append((task_title, task_description))

        import json
        tasks_json = json.dumps(task_infos)

        if (len(lesson_title) > 0) and (len(lesson_code) > 0) and (len(task_infos) > 0):
            from datetime import datetime
            from model import Lesson
            now = datetime.now()
            lesson = Lesson(key_name=lesson_code,
                teacher=self.person, title=lesson_title, lesson_code=lesson_code,
                description=lesson_description, class_name=class_name, 
                start_time=now, stop_time=None, tasks_json=tasks_json)
            lesson.put()
            self.response.out.write(self.get_lessons_json())
                        
        else:
            data = { 'error': 1, 'msg': 'Required fields are missing.' }
            self.response.out.write(json.dumps(data))

    def start_lesson(self, lesson, write_response=True):
        lesson.stop_time = None
        lesson.put()
        if write_response:
            self.write_response_plain_text("OK")

    def stop_lesson(self, lesson, write_response=True):
        from datetime import datetime
        now = datetime.now()
        lesson.stop_time = now
        lesson.put()
        if write_response:
            self.write_response_plain_text("OK")

    def stop_all_lessons(self):
        from model import Lesson
        lessons = Lesson.fetch_all(filter_expr="teacher", filter_value=self.person)
        for lesson in lessons:
            self.stop_lesson(lesson, False)
        self.write_response_plain_text("OK")
       
    def clear_lesson(self, lesson, write_response=True):
        from model import Student, StudentActivity
        from google.appengine.ext import db
        db.delete(StudentActivity.fetch_all("lesson =", lesson))
        db.delete(Student.fetch_all("lesson =", lesson))
        
        # should start time be reset whenever the data is cleared (i.e., lesson is started over)
#        from datetime import datetime
#        now = datetime.now()
#        lesson.start_time = now
#        lesson.put()
            
        if write_response:
            self.write_response_plain_text("OK")
                
    def delete_lesson(self, lesson, write_response=True):
        from datetime import datetime
        now = datetime.now()
        lesson.deleted_time = now
        if lesson.stop_time is None:
            lesson.stop_time = now
        lesson.put()
        if write_response:
            self.write_response_plain_text("OK")
    
    def delete_all_lessons(self):
        from model import Lesson
        lessons = Lesson.fetch_all(filter_expr="teacher", filter_value=self.person)
        for lesson in lessons:
            self.delete_lesson(lesson, False)
        self.write_response_plain_text("OK")
             
    def log_out_student(self, student):
        student.log_out(True)
        self.write_response_plain_text("OK")
                   
    def make_lesson_code(self):
        import random
        from model import Lesson
        digits = 5
        
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
    
    def get_lessons_json(self):
        from model import Lesson
        import json
        import datetime
            
        def handler(o):
            if isinstance(o, datetime.datetime):
                return "(new Date(%d, %d, %d, %d, %d, %d))"%(
                        o.year,
                        o.month-1, # javascript months start at zero  
                        o.day,
                        o.hour,
                        o.minute,
                        o.second)
            else:
                raise TypeError(repr(o))
    
        lessons = Lesson.fetch_all(filter_expr="teacher", filter_value=self.person)
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

class NotAnAuthenticatedTeacherError(Exception): pass
