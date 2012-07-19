# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class AnswerHandler(SearchPartyRequestHandler):
    def post(self):
        from helpers import log
        from updates import send_update_answer
        from model import StudentActivity

        self.load_search_party_context(user_type="student")
        
        if self.is_student and self.person.is_logged_in:
            student = self.person 
            lesson = student.lesson
            teacher = lesson.teacher
            task_idx = int(self.request.get("task_idx", 0))
            answer_text = self.request.get("answer_text")
            answer_explanation = self.request.get("answer_explanation")
            ext = int(self.request.get("ext", 0))

            activity = StudentActivity(
                student=student,
                lesson=lesson,
                task_idx=task_idx,
                activity_type=StudentActivity.ACTIVITY_TYPE_ANSWER,
                answer_text=answer_text,
                answer_explanation=answer_explanation
            )
            activity.put()
            
            log( "AnswerHandler:  task_idx=%r,  answer=%r, explanation=%r"%(task_idx, answer_text, answer_explanation) )
            notifyStudent = ext==1
            send_update_answer(student=student, teacher=teacher, task_idx=task_idx,
                answer_text=answer_text, answer_explanation=answer_explanation, notifyStudent=notifyStudent)
            response_data = activity.toDict();
            response_data['status'] = 1;
            
        else:
            response_data = { "status":0, "msg":"Student not logged in" }
         
        import json
        self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
        self.response.out.write(json.dumps(response_data))
