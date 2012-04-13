# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class SearchExecutedHandler(SearchPartyRequestHandler):
    def post(self):           
        from model import StudentActivity
        from updates import send_update_query

        self.load_search_party_context(user_type="student")

        if self.is_student and self.person.is_logged_in:
            student = self.person
            lesson = student.lesson
            teacher = lesson.teacher
            query = self.request.get("query")
            task_idx = int(self.request.get("task_idx"))
            activity = StudentActivity(
                student = student,
                lesson = lesson,
                task_idx = task_idx,
                activity_type = 'search',
                search = query,
            )
            activity.put()
            send_update_query(student=student, teacher=teacher, task_idx=task_idx, query=query)
            response_data = { "status":1 }
            
        else:
            response_data = { "status":0, "msg":"Student not logged in" }
         
        import json
        self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
        self.response.out.write(json.dumps(response_data))