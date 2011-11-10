from SearchPartyRequestHandler import SearchPartyRequestHandler

class UpdateDB(SearchPartyRequestHandler):
	def get(self):
		pass
	
	def convert_students(self):
		from model import Student
		from google.appengine.ext import db
		out = []
		students = []
		for student in Student.all():
			student.teacher = student.lesson.teacher
			out.append(repr(student))
			students.append(student)
		db.put(students)
		self.write_response_plain_text("\n\n".join(out))

	def put_tasks_in_lesson(self):
		from model import Lesson
		from helpers import log
		from google.appengine.ext import db
		from pprint import pformat
		lessons = []
		out = []
		all_task_entities = []
		for lesson in Lesson.all():
			task_entities = sorted(lesson.task_entities, key=lambda te:te.task_idx)
			if len(task_entities)==0:
				continue
			all_task_entities.extend(task_entities)
			tasks = tuple((t.title, t.description) for t in task_entities)
			log(task_entities)
			out.append(pformat(task_entities))
			out.append(pformat(lesson.tasks))
			out.append("")
			lesson.tasks_repr = repr(tasks)
			lessons.append(lesson)
		db.put(lessons)
		db.delete(all_task_entities)
		self.write_response_plain_text("\n".join(out))
	
	def convert_answers_to_activities(self):
		from model import StudentActivity, StudentAnswer
		from helpers import log
		from google.appengine.ext import db
		new_activities = []
		old_answers = []
		student_names = {}
		output_parts = []

		for answer in StudentAnswer.all():
			student_key = StudentAnswer.student.get_value_for_datastore(answer)
			try:
				student_nickname = student_names[str(student_key)]
			except KeyError:
				student_nickname = student_names[str(student_key)] = answer.student.nickname

			activity = StudentActivity(
				student=StudentAnswer.student.get_value_for_datastore(answer),
				student_nickname=student_nickname,
				lesson=StudentAnswer.lesson.get_value_for_datastore(answer),
				task_idx=answer.task_idx,
				activity_type=StudentActivity.ACTIVITY_TYPE_ANSWER,
				answer_text=answer.text,
				answer_explanation=answer.explanation,
				timestamp=answer.timestamp
			)
			new_activities.append(activity)
			old_answers.append(answer)
			log( activity )
			parts.append("")
			parts.append("ANSWER:")
			parts.append(repr(answer))
			parts.append("ACTIVITY:")
			parts.append(repr(activity))

		db.put(new_activities)
		self.write_response_plain_text("\n".join(parts))
