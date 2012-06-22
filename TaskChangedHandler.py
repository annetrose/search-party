# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class TaskChangedHandler(SearchPartyRequestHandler):
    def post(self):
        from helpers import log
        from updates import send_update_task

        self.load_search_party_context(user_type="student")
        
        if self.is_student:
            student = self.person
            teacher = student.lesson.teacher
            task_idx = int(self.request.get("task_idx"))
            if student.current_task_idx != task_idx:
                student.current_task_idx = task_idx
                student.put()
                
            log( "TaskChangedHandler:  task_idx=%r"%task_idx )
            send_update_task(student=student, teacher=teacher, task_idx=task_idx)
