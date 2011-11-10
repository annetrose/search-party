
# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class PersonPage(SearchPartyRequestHandler):
	def make_student_structure(self, lesson, student=None):
		# If student is None, then this will return info for all students who
		# worked on this lesson.

		from model import Student, StudentActivity
		from helpers import log

		if student is not None:
			students = (student,)
			filter_key = "student ="
			filter_value = student
		else:
			students = tuple( Student.all().filter("lesson =", lesson) )  # PERFORMANCE: Generator might be inefficient
			filter_key = "lesson ="
			filter_value = lesson

		student_structure = {}

		if len(students) > 0:
			num_tasks = len(lesson.tasks)

			for student in students:
				tasks_info = [{"searches":[], "answer":{"text":"", "explanation":""}} for _ in range(num_tasks)]
				student_structure[student.nickname] = {
					"task_idx"  : student.task_idx,
					"logged_in"	: student.logged_in,
					"tasks"     : tasks_info
				}

			searches_dict = {}

			link_infos_and_ratings = {}  # (student_nickname,task_idx,link_url) -> ([link_info,...], is_helpful)

			activities = StudentActivity.all().filter(filter_key, filter_value).fetch(10000) # PERFORMANCE: Generator might be inefficient
			assert len(activities) < 10000, "Upper bound is apparently not big enough."
			activities.sort(key=lambda sa:sa.timestamp)

			for activity in activities:
				student_nickname = activity.student_nickname
				task_idx = activity.task_idx

				activity_type = activity.activity_type
				if activity_type in (StudentActivity.ACTIVITY_TYPE_LINK, StudentActivity.ACTIVITY_TYPE_LINK_RATING):
					link_url = activity.link
					key = (student_nickname,task_idx,link_url)
					link_infos_and_rating = link_infos_and_ratings.setdefault(key, [[],None])
					if activity_type==StudentActivity.ACTIVITY_TYPE_LINK:
						query = activity.search
						search_key = (student_nickname, task_idx, query)
						try:
							search_info = searches_dict[search_key]
						except KeyError:
							search_info = {"query":query, "links_followed":[]}
							searches_dict[search_key] = search_info
							student_structure[student_nickname]["tasks"][task_idx]["searches"].append(search_info)

						link_title = activity.link_title
						link_info = {"url":link_url, "title":link_title, "is_helpful":None}
						search_info["links_followed"].append(link_info)
						link_infos_and_rating[0].append(link_info)
					elif activity_type==StudentActivity.ACTIVITY_TYPE_LINK_RATING:
						link_infos_and_rating[1] = activity.is_helpful
				elif activity_type==StudentActivity.ACTIVITY_TYPE_ANSWER:
					# This will end up with the most recent answer because it is in ascending time order, so
					# later answers will overwrite the older ones.
					answer_info = student_structure[student_nickname]["tasks"][task_idx]["answer"]
					answer_info["text"] = activity.answer_text
					answer_info["explanation"] = activity.answer_explanation

			for k,v in link_infos_and_ratings.items():
				(student_nickname,task_idx,link_url) = k
				link_infos, is_helpful = v
				for link_info in link_infos:
					link_info["is_helpful"] = is_helpful

		return student_structure

	def make_student_structure_js(self, lesson, indent, student=None):
		from django.utils.simplejson import JSONEncoder  # there's also a JSONEncoderForHTML that escapes &, <, >
		from helpers import log
		lines = []
		add = lines.append
		indent_level = 1
		def add(s):
			lines.append(indent*indent_level + s)
		encoder = JSONEncoder()
		as_json = encoder.encode
		single_student_mode = (student is not None)

		student_structure = self.make_student_structure(lesson=lesson, student=student)
		
		# Wrapping this in an anonymous JavaScript function to avoid polluting the global namespace.

		add("var g_students = (function () {")
		indent_level += 1
		add('var students, student_info, task_info, task_infos, search_info, search_infos, followed_link_info, followed_link_infos, answer_info;')
		add('')
		add('students = {};')
		for student_nickname,student_info in sorted(student_structure.items()):
			add('')
			add('//============================================================')
			add('// STUDENT:  %s'%student_nickname)
			add('student_info = {};')
			add('students[%s] = student_info;'%(as_json(student_nickname)))
			add('student_info.logged_in = %s;'%(as_json(student_info["logged_in"])) )
			add('student_info.task_idx = %s;'%(student_info["task_idx"]))
			add('task_infos = [];')
			add('student_info.tasks = task_infos;')
			for task_idx,task_info in enumerate(student_info["tasks"]):  # assumes position in array equals task_idx
				add('')
				add('// %s\'s work on task %s'%(student_nickname, task_idx))
				add('task_info = {};')
				add('task_infos.push(task_info);')
				add('search_infos = [];')
				add('task_info.searches = search_infos;')
				for query_info in task_info["searches"]:
					if query_info["query"] is None:
						log(query_info)
						continue
					add('')
					add('// %s\'s query for task %s:  %s'%(student_nickname, task_idx, query_info["query"]))
					add('search_info = {};')
					add('search_infos.push(search_info);')
					add('search_info.query = %s;'%(as_json(query_info["query"])))
					add('followed_link_infos = [];')
					add('search_info.links_followed = followed_link_infos;')
					for followed_link_info in query_info["links_followed"]:
						add('followed_link_info = {};')
						add('followed_link_infos.push(followed_link_info);')
						add('followed_link_info.url = %s;'%(as_json(followed_link_info["url"])))
						add('followed_link_info.title = %s;'%(as_json(followed_link_info["title"])))
						add('followed_link_info.is_helpful = %s;'%(as_json(followed_link_info["is_helpful"])))
				answer_info = task_info["answer"]
				add('answer_info = {};')
				add('task_info.answer = answer_info;')
				add('answer_info.text = %s;'%(as_json(answer_info["text"])))
				add('answer_info.explanation = %s;'%(as_json(answer_info["explanation"])))
		add('return students;')
		indent_level -= 1
		add('})();')
		
		if student is not None:
			assert len(student_structure)==1, repr(student_structure)
			add('var g_student_nickname = %s;'%(as_json(student.nickname)))
			add('var g_student_info = g_students[g_student_nickname];')

		js = ("\n").join(lines).lstrip()
		return js
