# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class LinkFollowedHandler(SearchPartyRequestHandler):
    def post(self):
        from model import StudentActivity, Student
        from helpers import log
        from updates import send_update_link_followed

        self.load_search_party_context(user_type="student")
        
        if self.is_student and self.person.is_logged_in:
            student = self.person
            task_idx = int(self.request.get("task_idx"))
            teacher = student.teacher
            query = self.request.get("query")
            url = self.request.get('url')
            lesson_key = Student.lesson.get_value_for_datastore(student)
            title = self.request.get("title")
            link = StudentActivity(
                student = student,
                lesson = lesson_key,
                task_idx = task_idx,
                activity_type = StudentActivity.ACTIVITY_TYPE_LINK,
                search = query,
                link = url,
                link_title = title,
            )
            link.put()
            log("LinkFollowedHandler:  activity=%r"%link)
            send_update_link_followed(student=student, teacher=teacher, task_idx=task_idx, query=query, url=url, title=title)
            response_data = { "status":1 }
            
        else:
            response_data = { "status":0, "msg":"Student not logged in" }
         
        import json
        self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
        self.response.out.write(json.dumps(response_data))