# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class StudentLogout(SearchPartyRequestHandler):
    def get(self):
        self.load_search_party_context(user_type="student")
        
        if self.is_student and self.person.is_logged_in:
            student = self.person
            student.log_out(True)
            self.clear_session_and_redirect(dst="/")
