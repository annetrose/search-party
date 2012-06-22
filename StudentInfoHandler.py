# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

# Used by Chrome extension to get info of student currently logged in
class StudentInfoHandler(SearchPartyRequestHandler):
    def post(self):           
        self.load_search_party_context(user_type="student")

        if self.is_student and self.person.is_logged_in:
            student = self.person
            response_data = { 
                "status": 1, 
                "student_nickname": student.nickname, 
                "lesson_name": student.lesson.title,
                "lesson_code": student.lesson.lesson_code,
                "lesson_task": student.lesson.tasks[student.current_task_idx], 
                "task_idx": student.current_task_idx,
                "history": self.get_student_activities(student, student.lesson, student.current_task_idx)
            }            
        else:
            response_data = { "status":0, "msg":"Student not logged in" }
         
        import json
        self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
        self.response.out.write(json.dumps(response_data))
        
    def get_student_activities(self, student, lesson, task_idx):
        from model import StudentActivity, EXPECTED_UPPER_BOUND
        query = StudentActivity.all()
        query = query.filter('student =', student).filter('lesson =', lesson).filter('task_idx =', task_idx)
        query.order('timestamp')
        activities = []
        for activity in query.fetch(EXPECTED_UPPER_BOUND):
            activities.append(activity.toDict())
        return activities
        