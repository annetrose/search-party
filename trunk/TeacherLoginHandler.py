# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class TeacherLoginHandler(SearchPartyRequestHandler):
    from webapp2_extras.users import login_required

    @login_required
    def get(self):
        from model import Teacher
        self.load_search_party_context(user_type="teacher")
        
        # Close any active session the user has since s/he is trying to login
        if self.session.is_active():
            self.session.terminate()

        # Get the teacher's record
        if not self.is_teacher:
            teacher = Teacher(key_name=self.user.user_id()) # key is user ID of authenticated Google user
            teacher.user = self.user
            teacher.put()
            self.set_person(teacher)

        # Create a new session ID, for added security.
        self.session.regenerate_id()

        # Greet with nickname of authenticated Google user.
        page = self.request.get('page', 'teacher_dashboard')
        self.redirect_with_msg('Teacher Logged in.  Hello, %s.'%self.person.user.nickname(), dst='/'+page)
