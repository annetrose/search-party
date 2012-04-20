# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class AdminPage(SearchPartyRequestHandler):

    def get(self):
        self.load_search_party_context(user_type="teacher")

        try:
            if not self.is_teacher:
                raise NotAnAuthenticatedTeacherError()
            
            elif not self.person.admin:
                raise NotAnAdminError()
            
            else:  
                action = self.request.get("action", "");
                if action=="logoutallstudents":
                    self.logout_all_students()
                elif action=="updatevalues":
                    self.update_values()
                else:
                    template_values = {
                        'header'     : self.gen_header("teacher"),
                    }

                    if self.session.has_key('msg'):
                        template_values['msg'] = self.session.pop('msg')
                
                    self.write_response_with_template("admin.html", template_values)
            
        except NotAnAuthenticatedTeacherError:
            self.redirect_to_teacher_login(dst='admin')
        
        except NotAnAdminError:
            self.redirect("/teacher_dashboard")


    def post(self):
        self.get();
        
    def logout_all_students(self):
        from model import Student
        query = Student.all()
        for student in query:
            if student.is_logged_in or len(student.client_ids) > 0:
                from helpers import log
                log("=> log out student {0} from lesson {1}".format(student.nickname,student.lesson.lesson_code))
                student.log_out(True)
      
    # helpful when adding new attributes to existing datastore entities and default needs to be set
    def update_values(self):          
        from model import Teacher
        query = Teacher.all()
        for teacher in query:
            teacher.admin = False
            teacher.put()
            
        self.write_response_plain_text("OK")

class NotAnAuthenticatedTeacherError(Exception): pass
class NotAnAdminError(Exception): pass
