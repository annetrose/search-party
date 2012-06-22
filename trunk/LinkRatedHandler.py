# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class LinkRatedHandler(SearchPartyRequestHandler):
    def post(self):
        from model import StudentActivity, Student
        from helpers import log
        from updates import send_update_link_rated

        self.load_search_party_context(user_type="student")
        
        if self.is_student and self.person.is_logged_in:
            student = self.person
            teacher = student.teacher
            task_idx = int(self.request.get("task_idx", student.current_task_idx))
            url = self.request.get('url')
            lesson_key = Student.lesson.get_value_for_datastore(student)
            is_helpful = {"1":True, "0":False, None:None}[self.request.get("is_helpful")]
            link = StudentActivity(
                student = student,
                lesson = lesson_key,
                task_idx = task_idx,
                activity_type = StudentActivity.ACTIVITY_TYPE_LINK_RATING,
                link = url,
                is_helpful = is_helpful
            )
            link.put()
            log( "LinkRatedHandler:  activity=%r"%link )
            send_update_link_rated(student=student, teacher=teacher, task_idx=task_idx, url=url, is_helpful=is_helpful)            
            response_data = { "status":1 }
            
        else:
            response_data = { "status":0, "msg":"Student not logged in" }
         
        import json
        self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
        self.response.out.write(json.dumps(response_data))