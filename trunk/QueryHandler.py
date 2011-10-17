# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class QueryHandler(SearchPartyRequestHandler):
	def get(self):
		from django.utils import simplejson as json
		from helpers import calc_since_time
		from model import Student, StudentActivity, Teacher, Lesson, Task
		self.load_search_party_context()

		# TODO:  Use self.is_teacher instead of user is not None ... but make sure it's right.
		# TODO:  Refactor copious duplace code from below.
		qt = self.request.get('qt')
		user = self.user
		if qt == 'num_students':
			# Used by teacher -- see teacher.js
			if user is not None:  
#				teacherQuery = Teacher.all().filter('user =', self.user)
#				teacher = teacherQuery.get()
#				studentQuery = Student.all().filter('teacher = ', teacher)
#				studentQuery = studentQuery.filter('logged_in = ', True)
#				num_students = studentQuery.count()
# FIXME:  totally broken
				num_students = Student.all().count()
				data = {'num_students' : num_students}
				self.response.out.write(json.dumps(data))
		elif qt == 'students':
			# Used by teacher -- see js/teacher.js and templates/student_list.html and js/student_list.js
			teacherQuery = Teacher.all().filter('user =', self.user)
			teacher = teacherQuery.get()
			studentQuery = Student.all().filter('teacher = ', teacher)
			studentQuery = studentQuery.filter('logged_in = ', True)
			results = studentQuery.fetch(100)
			data = []
			for result in results:
				student = [result.nickname]
				# TODO: 1012
				activityQuery = StudentActivity.all().filter('teacher = ', teacher)
				activityQuery = activityQuery.filter('student = ', result)
				activityQuery = activityQuery.order("timestamp");
				activityResults = activityQuery.fetch(1000)
				activities = []
				for activityResult in activityResults:
					if activityResult.activity_type == 'search':
						activities.append(['search', activityResult.search])
					elif activityResult.activity_type == 'link':
						activities.append(['link', activityResult.link])
				student.append(activities)
				data.append(student)
			self.response.out.write(json.dumps(data))
		elif qt == 'student_activity':
			# Used by student -- see student_js_top.js
			activities = []
#			teacher_id = self.request.get('teacher_id')
#			teacherQuery = Teacher.all().filter('teacher_id =', int(teacher_id))
#			teacher = teacherQuery.get()
#			lesson_code = self.request.get("lesson_code")
#			student_nickname = self.request.get('student')
#			studentQuery = Student.all().filter('teacher = ', teacher)
#			studentQuery = studentQuery.filter('logged_in = ', True)
#			studentQuery = studentQuery.filter('nickname = ', student_nickname)
#			student = studentQuery.get()
#			student = Student.all().filter("lesson =",lesson)
#			activityQuery = StudentActivity.all().filter('teacher = ', teacher)
			task_idx = self.request.get("task_idx")
			student = self.student
			lesson = student.lesson
			task = Task.all().filter("lesson =",lesson).filter("task_idx =",task_idx).get()
			activityQuery = StudentActivity.all().filter('lesson = ', lesson)
			activityQuery = activityQuery.filter('student = ', student)
			activityQuery = activityQuery.order("timestamp");
			results = activityQuery.fetch(1000)
			for result in results:
				if result.activity_type == 'search':
					activities.append(['search', result.search])
				elif result.activity_type == 'link':
					activities.append(['link', result.link])
			self.response.out.write(json.dumps(activities))
		elif qt == 'search':
			# Used by teacher -- see teacher.js
			if user is not None:
				teacherQuery = Teacher.all().filter('user =', self.user)
				teacher = teacherQuery.get()
				searchTerms = self.request.get('terms')
				searchQuery = StudentActivity.all().filter('teacher = ', teacher)
				searchQuery = searchQuery.filter('activity_type = ', 'search')
				searchQuery = searchQuery.filter('search = ', searchTerms)
				searchQuery = searchQuery.order("student");
				results = searchQuery.fetch(1000)
				students = set()
				for result in results:
					students.add(result.student.nickname)
				self.response.out.write(json.dumps(list(students)))
		elif qt == 'data':
			# Used by teacher -- see teacher.js
			if user is not None:
				teacherQuery = Teacher.all().filter('user =', self.user)
				teacher = teacherQuery.get()

				# First look at search history
				searchQuery = StudentActivity.all()
				searchQuery = searchQuery.filter('teacher = ', teacher)
				searchQuery = searchQuery.filter('activity_type = ', 'search')
				sinceStr = self.request.get('since')
				if sinceStr:
					sinceTime = calc_since_time(sinceStr)
					searchQuery = searchQuery.filter('timestamp >= ', sinceTime)
				searchQuery = searchQuery.order("timestamp")
				searchQuery = searchQuery.order("search")
				results = searchQuery.fetch(1000)
				terms = []
				term = ""
				termCount = 0
				for result in results:
					if term != "":
						if result.search == term:
							termCount += 1
						else:
							terms.append([term, termCount])
							term = result.search
							termCount = 1
					else:
						term = result.search
						termCount = 1
				if termCount > 0:
					terms.append([term, termCount])
				terms = sorted(terms, key=lambda term: term[1])

				# Then look at links followed
				linkQuery = StudentActivity.all()
				linkQuery = linkQuery.filter('teacher = ', teacher)
				linkQuery = linkQuery.filter('activity_type = ', 'link')
				sinceStr = self.request.get('since')
				if sinceStr:
					sinceTime = calc_since_time(sinceStr)
					linkQuery = linkQuery.filter('timestamp >= ', sinceTime)
				linkQuery = linkQuery.order("timestamp")
				linkQuery = linkQuery.order("link")
				results = linkQuery.fetch(1000)
				links = []
				link = ""
				linkCount = 0
				for result in results:
					if link != "":
						if result.link == link:
							linkCount += 1
						else:
							links.append([link, linkCount])
							link = result.link
							linkCount = 1
					else:
						link = result.link
						linkCount = 1
				if linkCount > 0:
					links.append([link, linkCount])
				links = sorted(links, key=lambda link: link[1])
			
				data = {'terms' : terms, 'links' : links}
				self.response.out.write(json.dumps(data))


#class QueryHandler(SearchPartyRequestHandler):
#	def get(self):
#		from django.utils import simplejson as json
#		from helpers import calc_since_time
#		from model import Student, StudentActivity, Teacher
#		self.load_search_party_context()
#
#		# TODO:  Use self.is_teacher instead of user is not None ... but make sure it's right.
#		# TODO:  Refactor copious duplace code from below.
#		qt = self.request.get('qt')
#		user = self.user
#		if qt == 'num_students':
#			if user is not None:  
#				teacherQuery = Teacher.all().filter('user =', self.user)
#				teacher = teacherQuery.get()
#				studentQuery = Student.all().filter('teacher = ', teacher)
#				studentQuery = studentQuery.filter('logged_in = ', True)
#				num_students = studentQuery.count()
#				data = {'num_students' : num_students}
#				self.response.out.write(json.dumps(data))
#		elif qt == 'students':
#			teacherQuery = Teacher.all().filter('user =', self.user)
#			teacher = teacherQuery.get()
#			studentQuery = Student.all().filter('teacher = ', teacher)
#			studentQuery = studentQuery.filter('logged_in = ', True)
#			results = studentQuery.fetch(100)
#			data = []
#			for result in results:
#				student = [result.nickname]
#				activityQuery = StudentActivity.all().filter('teacher = ', teacher)
#				activityQuery = activityQuery.filter('student = ', result)
#				activityQuery = activityQuery.order("timestamp");
#				activityResults = activityQuery.fetch(1000)
#				activities = []
#				for activityResult in activityResults:
#					if activityResult.activity_type == 'search':
#						activities.append(['search', activityResult.search])
#					elif activityResult.activity_type == 'link':
#						activities.append(['link', activityResult.link])
#				student.append(activities)
#				data.append(student)
#			self.response.out.write(json.dumps(data))
#		elif qt == 'student_activity':
#			activities = []
#			teacher_id = self.request.get('teacher_id')
#			teacherQuery = Teacher.all().filter('teacher_id =', int(teacher_id))
#			teacher = teacherQuery.get()
#			student_nickname = self.request.get('student')
#			studentQuery = Student.all().filter('teacher = ', teacher)
#			studentQuery = studentQuery.filter('logged_in = ', True)
#			studentQuery = studentQuery.filter('nickname = ', student_nickname)
#			student = studentQuery.get()
#			activityQuery = StudentActivity.all().filter('teacher = ', teacher)
#			activityQuery = activityQuery.filter('student = ', student)
#			activityQuery = activityQuery.order("timestamp");
#			results = activityQuery.fetch(1000)
#			for result in results:
#				if result.activity_type == 'search':
#					activities.append(['search', result.search])
#				elif result.activity_type == 'link':
#					activities.append(['link', result.link])
#			self.response.out.write(json.dumps(activities))
#		elif qt == 'search':
#			if user is not None:
#				teacherQuery = Teacher.all().filter('user =', self.user)
#				teacher = teacherQuery.get()
#				searchTerms = self.request.get('terms')
#				searchQuery = StudentActivity.all().filter('teacher = ', teacher)
#				searchQuery = searchQuery.filter('activity_type = ', 'search')
#				searchQuery = searchQuery.filter('search = ', searchTerms)
#				searchQuery = searchQuery.order("student");
#				results = searchQuery.fetch(1000)
#				students = set()
#				for result in results:
#					students.add(result.student.nickname)
#				self.response.out.write(json.dumps(list(students)))
#		elif qt == 'data':
#			if user is not None:
#				teacherQuery = Teacher.all().filter('user =', self.user)
#				teacher = teacherQuery.get()
#
#				# First look at search history
#				searchQuery = StudentActivity.all()
#				searchQuery = searchQuery.filter('teacher = ', teacher)
#				searchQuery = searchQuery.filter('activity_type = ', 'search')
#				sinceStr = self.request.get('since')
#				if sinceStr:
#					sinceTime = calc_since_time(sinceStr)
#					searchQuery = searchQuery.filter('timestamp >= ', sinceTime)
#				searchQuery = searchQuery.order("timestamp")
#				searchQuery = searchQuery.order("search")
#				results = searchQuery.fetch(1000)
#				terms = []
#				term = ""
#				termCount = 0
#				for result in results:
#					if term != "":
#						if result.search == term:
#							termCount += 1
#						else:
#							terms.append([term, termCount])
#							term = result.search
#							termCount = 1
#					else:
#						term = result.search
#						termCount = 1
#				if termCount > 0:
#					terms.append([term, termCount])
#				terms = sorted(terms, key=lambda term: term[1])
#
#				# Then look at links followed
#				linkQuery = StudentActivity.all()
#				linkQuery = linkQuery.filter('teacher = ', teacher)
#				linkQuery = linkQuery.filter('activity_type = ', 'link')
#				sinceStr = self.request.get('since')
#				if sinceStr:
#					sinceTime = calc_since_time(sinceStr)
#					linkQuery = linkQuery.filter('timestamp >= ', sinceTime)
#				linkQuery = linkQuery.order("timestamp")
#				linkQuery = linkQuery.order("link")
#				results = linkQuery.fetch(1000)
#				links = []
#				link = ""
#				linkCount = 0
#				for result in results:
#					if link != "":
#						if result.link == link:
#							linkCount += 1
#						else:
#							links.append([link, linkCount])
#							link = result.link
#							linkCount = 1
#					else:
#						link = result.link
#						linkCount = 1
#				if linkCount > 0:
#					links.append([link, linkCount])
#				links = sorted(links, key=lambda link: link[1])
#			
#				data = {'terms' : terms, 'links' : links}
#				self.response.out.write(json.dumps(data))
