# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

#class TeacherPageException(Exception): pass

class TeacherPage(SearchPartyRequestHandler):
	def get(self, lesson_code):
		# TODO:  Find out why this method takes too long:  ms=52 cpu_ms=2860 api_cpu_ms=2822

		from helpers import log, read_file, smush
		from model import Lesson
		from django.utils import simplejson as json
		self.load_search_party_context()
		log( "PAGE:  %s, session.sid=%s, is_teacher==%s"%(self.__class__.__name__, smush(self.session.sid, 20), self.is_teacher) )

		if not self.is_teacher:
			self.redirect_to_teacher_login()
		else:
			lesson = Lesson.all().filter("lesson_code =", lesson_code).get()
			if lesson.teacher.key() != self.teacher.key():
				log("lesson.teacher == %r"%lesson.teacher)
				log("self.teacher   == %r"%self.teacher)
				self.redirect_to_teacher_login()
			else:
				default_start_pane = "students"

				template_values = {
					'header': self.gen_header("teacher"),
					"teacher_id" : self.teacher.teacher_id,
					'lesson_code': lesson.lesson_code,
					"lesson"     : lesson,  # needed for task chooser
					"token"      : self.create_channel(),
					#"students"   : student_structure,
					"students_js": self.make_student_structure_js(lesson=lesson, indent="    "),
					"root_words" : "{}",
					"default_start_pane" : default_start_pane,
				}
				if self.session.has_key('msg'):
					template_values['msg'] = self.session.pop('msg')  # only show the message once
				self.write_response_with_template("teacher.html", template_values)
	
	def make_student_structure(self, lesson):
		from model import Student, Task, StudentActivity
		num_tasks = Task.all().filter("lesson =",lesson).count()
		student_structure = {}
		for student in Student.all().filter("lesson =", lesson):
			tasks_info = [{"searches":[], "answer":None} for _ in range(num_tasks)]
			student_structure[student.nickname] = {
				"task_idx"  : student.task_idx,
				"logged_in"	: student.logged_in,
				"tasks"     : tasks_info,
				"answer"    : None
			}

		searches_dict = {}
		for activity in StudentActivity.all().filter("lesson_code =", lesson.lesson_code).order("timestamp"):
			nickname = activity.student.nickname
			task_idx = activity.task_idx
			query = activity.search

			search_key = (nickname, task_idx, query)
			try:
				search_info = searches_dict[search_key]
			except KeyError:
				search_info = {"query":query, "links_followed":[]}
				searches_dict[search_key] = search_info
				student_structure[nickname]["tasks"][task_idx]["searches"].append(search_info)

			if activity.activity_type == StudentActivity.ACTIVITY_TYPE_LINK:
				link_url = activity.link
				link_title = activity.link_title
				search_info["links_followed"].append({"url":link_url, "title":link_title})

		return student_structure

	def make_student_structure_js(self, lesson, indent):
		from django.utils.simplejson import JSONEncoder  # there's also a JSONEncoderForHTML that escapes &, <, >
		lines = []
		add = lines.append
		encoder = JSONEncoder()
		as_json = encoder.encode

		student_structure = self.make_student_structure(lesson=lesson)

		add("var g_students = {};")
		add('var student_info, task_info, task_infos, search_info, search_infos, followed_link_info, followed_link_infos;')
		for student_nickname,student_info in sorted(student_structure.items()):
			student_nickname_json = as_json(student_nickname)
			add('')
			add('//============================================================')
			add('// STUDENT:  %s'%student_nickname)
			add('student_info = {};')
			add('g_students[%s] = student_info;'%(as_json(student_nickname)))
			add('student_info["logged_in"] = %s;'%(as_json(student_info["logged_in"])) )
			add('student_info["task_idx"] = %s;'%(student_info["task_idx"]))
			add('task_infos = [];')
			add('student_info["tasks"] = task_infos;')
			for task_idx,task_info in enumerate(student_info["tasks"]):  # assumes position in array equals task_idx
				add('')
				add('// %s\'s work on task %s'%(student_nickname, task_idx))
				add('task_info = {};')
				add('task_infos.push(task_info);')
				add('search_infos = [];')
				add('task_info["searches"] = search_infos;')
				for query_info in task_info["searches"]:
					add('')
					add('// %s\'s query for task %s:  %s'%(student_nickname, task_idx, query_info["query"]))
					add('search_info = {};')
					add('search_infos.push(search_info);')
					add('search_info["query"] = %s'%(as_json(query_info["query"])))
					add('followed_link_infos = [];')
					add('search_info["links_followed"] = followed_link_infos;')
					for followed_link_info in query_info["links_followed"]:
						add('followed_link_info = {};')
						add('followed_link_infos.push(followed_link_info);')
						add('followed_link_info["url"] = %s;'%(as_json(followed_link_info["url"])))
						add('followed_link_info["title"] = %s;'%(as_json(followed_link_info["title"])))

		js = ("\n"+indent).join(lines)
		return js
