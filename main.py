#!/usr/bin/env python

# SearchParty - Learning to Search in a Web-Based Classroom
# Author: Ben Bederson - www.cs.umd.edu/~bederson
#         University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

# see history of how students got to a link
# image search
# need to specify timecut off for teacher starting new class
# TODO: Clean up logging stuff
# TODO: Test student login before teacher has set password
# TODO: Test what happens when teachers log out when students still logged in
# TODO: Figure out time zones
# BUG:	Mouse over on search term with "+" in it doesn't work
# TODO: Add teacher content filtering
# TODO: Better aggregation
#   - Tag cloud
#   - Histogram
# TODO: general visual design
# TODO: Figure out what to put on home page when no one is logged in
# TODO: Roll over teacher link should show search terms that got student there
# DEPLOYMENT:
#   - Let teacher log out individual, or all students
#   - Let teacher remove student searches or links followed
#	- Consider efficiency - i.e., make counting more efficient (i.e., cache count)
#	- Consider security

# V2
#  - Let teacher change their label ("search leader")
#  - Let teacher time filter use range slider
#  - Push visual indicator to student's view to identify inappropriate behavior
#  - Add ability for teacher to see student's screens
#  - Push teacher tasks to student view (different tasks per student?)
#  - Replace search widget with custom search result display
#  - Generalize architecture so other activities can be supported
#  - Add polling/question activities with mobile web page/app support
#  - Export data to spreadsheet

import os
import random
import types
import datetime
import logging

from google.appengine.api import users
from google.appengine.api import channel
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import login_required
from django.utils import simplejson as json
from gaesessions import *

logger = logging.getLogger()

class SearchParty(db.Model):
	next_teacher_id = db.IntegerProperty(default=1)
	
class Teacher(db.Model):
	user = db.UserProperty()
	teacher_id = db.IntegerProperty()
	password = db.StringProperty()
	date = db.DateTimeProperty(auto_now_add=True)

class Student(db.Model):
	logged_in = db.BooleanProperty()
	teacher = db.ReferenceProperty(Teacher)
	nickname = db.StringProperty()
	date = db.DateTimeProperty(auto_now_add=True)
	session_sid = db.StringProperty()

class StudentActivity(db.Model):
	teacher = db.ReferenceProperty(Teacher)
	student = db.ReferenceProperty(Student)
	activity_type = db.StringProperty()
	search = db.StringProperty()
	link = db.LinkProperty()
	date = db.DateTimeProperty(auto_now_add=True)

def is_logged_in(self):
	session = get_current_session()
	logged_in = False
	if session.has_key('student'):
		# There could be an active session without matching sid in DB if student
		# got logged out automatically (by, say, window being closed)
		# So, check for this situation explicitly
		studentQuery = Student.all().filter('session_sid = ', session.sid)
		studentObj = studentQuery.get()
		if studentObj:
			logged_in = studentObj.logged_in
		if not logged_in:
			session.terminate()
	return logged_in

def get_search_party():
	keyname = "search_party"
	sp = SearchParty.get_or_insert(keyname)
	return sp

def redirect_with_msg(h, msg, dst='/'):
	get_current_session()['msg'] = msg
	h.redirect(dst)

def render_template(h, file, template_vals):
	path = os.path.join(os.path.dirname(__file__), 'templates', file)
	h.response.out.write(template.render(path, template_vals))

def extend_session_lifetime(session):
	expire_dt = datetime.datetime.now() + DEFAULT_LIFETIME
	expiration = time.mktime(expire_dt.timetuple())
	session.regenerate_id(expiration_ts=expiration)	 # Extends expiration time
	
def gen_header(requestHandler):
	teacher_user = users.get_current_user()
	teacher_id = requestHandler.request.get("teacher_id")
	
	html = ""
	html += "<table class='header' width='100%'>"
	html += "	<tr>"
	html += "		<td width='30%'><a href='/'>SP Logo</a></td>"
	html += "		<td align='middle' width='40%'>Search Party: Learn To Search</td>"
	html += "		<td align='right' width='30%'>"
	if teacher_user:
		html += "				" + teacher_user.nickname()
		html += "				<a href='/logout'>Logout</a>"
	else:
		session = get_current_session()
		if is_logged_in(requestHandler):
			student = session['student']
			html += "				" + student.nickname
			html += "				<a href='/logout'>Logout</a>"
		else:
			teacher_login_url = users.create_login_url("/teacher_login")
			html += "				Login as"
			html += "				<a href='" + teacher_login_url + "'>teacher</a> OR"
			html += "				<a href='/student_login'>student</a>"
	html += "		</td>"
	html += "	</tr>"
	html += "</table>"
	return html

def gen_teacher_info(requestHandler, teacher_id, password):
	html = "<table>"
	html += "  <tr valign='top'>"
	html += "	 <td width='150px'>"
	html += "		Teacher ID: " + str(teacher_id)
	html += "	 </td>"
	html += "	 <td>"
	if password:
		html += "	   Password: " + password
	else:
		html += "	   Enter password: <input id='password' type='text'></input><input id='password_submit' type='button' value='Ok'></input>"
		html += "	   <br><span class='help'>Set a new password everytime you log in</span>"
		html += "	   <script type='text/javascript'>"
		html += "		 function passwordChanged() {"
		html += "		   $.post('/teacher_login', {'password': $('#password').val() }, window.location.replace('/teacher'));"
		html += "		 }"

		html += "		 $('#password').focus();"
		html += "		 $('#password').keyup(function(event) {"
		html += "		   if (event.which == 13) {"  # Enter key
		html += "			  passwordChanged();"
		html += "		   }"
		html += "		 });"
		html += "		 $('#password_submit').click(function(event) {"
		html += "		   passwordChanged();"
		html += "		 });"
		html += "	   </script>"
		html += "	   <br><br>"
	html += "	 </td>"
	html += "  </tr>"
	html += "</table>"
	return html

def calcSinceTime(sinceStr):
	# default is Today
	now = datetime.datetime.now()
	sinceTime = datetime.datetime(now.year, now.month, now.day, 0)
	if sinceStr == "1":			# The beginning
		sinceTime = datetime.datetime(datetime.MINYEAR, 1, 1)
	elif sinceStr == "2":		# Last week
		dayOfWeek = sinceTime.weekday()
		sinceTime -= datetime.timedelta(days=(dayOfWeek + 7))
	elif sinceStr == "3":		# This week
		dayOfWeek = sinceTime.weekday()
		sinceTime -= datetime.timedelta(days=dayOfWeek)
	elif sinceStr == "4":		# Yesterday
		sinceTime -= datetime.timedelta(days=1)
	return sinceTime

class MainPage(webapp.RequestHandler):
	def get(self):
		session = get_current_session()
		user = users.get_current_user()
		
		if user:
			# Teacher logged in
			redirect_with_msg(self, "", dst="/teacher")
		elif session.has_key('student'):
			# Student logged in
			redirect_with_msg(self, "", dst="/student")
			
		template_values = {
			'header': gen_header(self),
		}
		if session.has_key('msg'):
			template_values['msg'] = session['msg']
			del session['msg'] # only show the message once

		render_template(self, "index.html", template_values)

class TeacherLoginHandler(webapp.RequestHandler):
	@login_required
	def get(self):
		user = users.get_current_user()

		# Close any active session the user has since s/he is trying to login
		session = get_current_session()
		if session.is_active():
			session.terminate()

		# Get the teacher's record
		teacherQuery = Teacher.all().filter('user =', user)
		teacher = teacherQuery.get()
		if not teacher:
			sp = get_search_party()
			teacher = Teacher()
			teacher.user = user
			teacher_id = sp.next_teacher_id
			teacher.teacher_id = teacher_id
			teacher.put()
			sp.next_teacher_id += 1
			sp.put()

		session['teacher'] = teacher
		session.regenerate_id()

		template_values = {
			'header': gen_header(self),
		}

		redirect_with_msg(self, 'Teacher Logged in. Hello: ' + teacher.user.nickname(), dst='/teacher')

	def post(self):
		password = self.request.get('password')
		if password:
			user = users.get_current_user()
			teacherQuery = Teacher.all().filter('user =', user)
			teacher = teacherQuery.get()
			if teacher:
				teacher.password = password
				teacher.put()

class TeacherPage(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		teacherQuery = Teacher.all().filter('user =', user)
		teacher = teacherQuery.get()
		if not user or not teacher or (type(teacher) is types.NoneType):
			self.redirect(users.create_login_url('/teacher_login'))
		else:
			session = get_current_session()
			token = channel.create_channel(user.user_id())
		
			template_values = {
				'header': gen_header(self),
				'teacher_info': gen_teacher_info(self, teacher.teacher_id, teacher.password),
				'password': teacher.password,
				'token': token,
			}
			if session.has_key('msg'):
				template_values['msg'] = session['msg']
				del session['msg'] # only show the message once

			render_template(self, "teacher.html", template_values)

class StudentListPage(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		teacherQuery = Teacher.all().filter('user =', user)
		teacher = teacherQuery.get()
		if not user or not teacher:
			self.redirect(users.create_login_url('/teacher_login'))

		studentQuery = Student.all().filter('teacher = ', teacher)
		results = studentQuery.fetch(100)
		students = []
		for result in results:
			students.append(result.nickname)
		
		session = get_current_session()
		token = channel.create_channel(user.user_id())

		template_values = {
			'header': gen_header(self),
			'teacher_info': gen_teacher_info(self, teacher.teacher_id, teacher.password),
			'students': json.dumps(students),
			'token': token,
		}
		if session.has_key('msg'):
			template_values['msg'] = session['msg']
			del session['msg'] # only show the message once

		render_template(self, "student_list.html", template_values)

class StudentLoginPage(webapp.RequestHandler):
	def get(self):
		session = get_current_session()
		template_values = {
			'header': gen_header(self),
		}
		if session.has_key('msg'):
			template_values['msg'] = session['msg']
			del session['msg'] # only show the message once

		render_template(self, "student_login.html", template_values)

class StudentLoginHandler(webapp.RequestHandler):
	def post(self):
		# Close any active session the user has since s/he is trying to login
		session = get_current_session()
		if session.is_active():
			session.terminate()

		teacher_id_str = self.request.get('teacher_id')
		teacher_id = ""
		if teacher_id_str.isdigit():
			teacher_id = int(teacher_id_str)
		teacher_password = self.request.get('teacher_password')
		student_name = self.request.get('student_name')
		if not student_name.isalpha():
			student_name = ""
		error = ""
		if teacher_id and teacher_password and student_name:
			teacherQuery = Teacher.all().filter('teacher_id =', teacher_id)
			teacherQuery = teacherQuery.filter('password = ', teacher_password)
			teacher = teacherQuery.get()
			student = ""
			if teacher:
				studentQuery = Student.all()
				studentQuery = studentQuery.filter('teacher = ', teacher)
				studentQuery = studentQuery.filter('nickname = ', student_name)
				studentQuery = studentQuery.filter('logged_in = ', True)
				student = studentQuery.get()
				if student:
					error = "Another student with the name " + student_name + " is already logged in. Please choose another name."
					student = ""
				else:
					# Successful student login
					# Update session
					session.regenerate_id()
					session['msg'] = "Student logged in: Hello " + student_name;

					# Send update message
					msg = {"change" : "student_login"}
					channel.send_message(teacher.user.user_id(), json.dumps(msg))

					# Put student in database
					student = Student()
					student.teacher = teacher
					student.nickname = student_name
					student.logged_in = True
					student.session_sid = session.sid
					student.put()

					session['student'] = student

					# Return data
					data = {'status' : 'logged_in'}
					self.response.out.write(json.dumps(data))
			else:
				error = "No teacher with that ID and password logged in"
		else:
			error = 'Student login failed. Must enter teacher ID, password and student name'

		if error:
			if 'student' in session:
				del session['student']
			session['msg'] = error
			data = {'status' : 'logged_out'}
			self.response.out.write(json.dumps(data))

class StudentPage(webapp.RequestHandler):
	def get(self):
		logged_in = is_logged_in(self)
		if not logged_in:
			redirect_with_msg(self, '')
			return
			
		session = get_current_session()
		token = channel.create_channel(session.sid)
		nickname = ''
		logger.info("student page: logged_in = " + str(logged_in))
		student = session['student']
		teacher_id = student.teacher.teacher_id
		nickname = student.nickname
		template_values = {
			'header': gen_header(self),
			'logged_in': logged_in,
			'teacher_id': teacher_id,
			'nickname': nickname,
			'token': token,
			'sid': session.sid,
		}
		if session.has_key('msg'):
			template_values['msg'] = session['msg']
			del session['msg'] # only show the message once

#		extend_session_lifetime(session)
		render_template(self, "student.html", template_values)

class LogoutPage(webapp.RequestHandler):
	def get(self):
		session = get_current_session()
		user = users.get_current_user()
		if user:
			# Teacher logout
			if session.is_active():
				teacherQuery = Teacher.all().filter('user =', user)
				teacher = teacherQuery.get()
				teacher.password = ""
				teacher.put()
				session.terminate()
			logout_url = users.create_logout_url('/')
			redirect_with_msg(self, 'Teacher Logged out: Goodbye ' + user.nickname(), dst=logout_url)
		elif session.has_key('student'):
			# Student logout
			logger.info("student logout, sid = " + session.sid)
			student = session['student']
			student.logged_in = False
			student.session_sid = ""
			student.put()
			# Send update message
			teacher = student.teacher.user
			msg = {"change" : "student_logout"}
			channel.send_message(teacher.user_id(), json.dumps(msg))

			session.terminate()
			redirect_with_msg(self, 'Student Logged out: Goodbye ' + student.nickname)
		else:
			if session.is_active():	 # defensive
				session.terminate()
			redirect_with_msg(self, "Whoops, you weren't logged in")

class SearchExecutedHandler(webapp.RequestHandler):
	def post(self):		   
		session = get_current_session()
		if session.has_key('student'):
			student = session['student']
			teacher = student.teacher
			activity = StudentActivity()
			activity.activity_type = 'search'
			activity.search = self.request.get('q')
			activity.student = student
			activity.teacher = teacher
			activity.put()

			# Send update message
			msg = {"change" : "student_search"}
			channel.send_message(teacher.user.user_id(), json.dumps(msg))
			
#			extend_session_lifetime(session)

class LinkFollowedHandler(webapp.RequestHandler):
	def post(self):

		session = get_current_session()
		if session.has_key('student'):
			student = session['student']
			teacher = student.teacher
			link = StudentActivity()
			link.activity_type = 'link'
			link.link = self.request.get('href')
			link.student = student
			link.teacher = teacher
			link.put()

			# Send update message
			msg = {"change" : "student_link_followed"}
			channel.send_message(teacher.user.user_id(), json.dumps(msg))

class QueryHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		qt = self.request.get('qt')
		if qt == 'num_students':
			if user:
				teacherQuery = Teacher.all().filter('user =', user)
				teacher = teacherQuery.get()
				studentQuery = Student.all().filter('teacher = ', teacher)
				studentQuery = studentQuery.filter('logged_in = ', True)
				num_students = studentQuery.count()
				data = {'num_students' : num_students}
				self.response.out.write(json.dumps(data))
		elif qt == 'students':
			teacherQuery = Teacher.all().filter('user =', user)
			teacher = teacherQuery.get()
			studentQuery = Student.all().filter('teacher = ', teacher)
			studentQuery = studentQuery.filter('logged_in = ', True)
			results = studentQuery.fetch(100)
			data = []
			for result in results:
				student = [result.nickname]
				activityQuery = StudentActivity.all().filter('teacher = ', teacher)
				activityQuery = activityQuery.filter('student = ', result)
				activityQuery = activityQuery.order("date");
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
			activities = []
			teacher_id = self.request.get('teacher_id')
			teacherQuery = Teacher.all().filter('teacher_id =', int(teacher_id))
			teacher = teacherQuery.get()
			student_nickname = self.request.get('student')
			studentQuery = Student.all().filter('teacher = ', teacher)
			studentQuery = studentQuery.filter('logged_in = ', True)
			studentQuery = studentQuery.filter('nickname = ', student_nickname)
			student = studentQuery.get()
			activityQuery = StudentActivity.all().filter('teacher = ', teacher)
			activityQuery = activityQuery.filter('student = ', student)
			activityQuery = activityQuery.order("date");
			results = activityQuery.fetch(1000)
			for result in results:
				if result.activity_type == 'search':
					activities.append(['search', result.search])
				elif result.activity_type == 'link':
					activities.append(['link', result.link])
			self.response.out.write(json.dumps(activities))
		elif qt == 'search':
			if user:
				teacherQuery = Teacher.all().filter('user =', user)
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
			if user:
				teacherQuery = Teacher.all().filter('user =', user)
				teacher = teacherQuery.get()

				# First look at search history
				searchQuery = StudentActivity.all()
				searchQuery = searchQuery.filter('teacher = ', teacher)
				searchQuery = searchQuery.filter('activity_type = ', 'search')
				sinceStr = self.request.get('since')
				if sinceStr:
					sinceTime = calcSinceTime(sinceStr)
					searchQuery = searchQuery.filter('date >= ', sinceTime)
				searchQuery = searchQuery.order("date")
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
					sinceTime = calcSinceTime(sinceStr)
					linkQuery = linkQuery.filter('date >= ', sinceTime)
				linkQuery = linkQuery.order("date")
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

class ChannelConnectedHandler(webapp.RequestHandler):
	def post(self):
		session = get_current_session()
		user = users.get_current_user()
		client_id = self.request.get('from')
		logger.info("channel connected")
		logger.info("  session = " + str(session))
		logger.info("  client_id = " + client_id)
		if user:
			# Teacher connected
			msg = {"log" : "Client connected: " + client_id}
			channel.send_message(user.user_id(), json.dumps(msg))
		else:
			# Student connected
			# Send update message
			msg = {"log" : "student connected"}
			channel.send_message(client_id, json.dumps(msg))

class ChannelDisconnectedHandler(webapp.RequestHandler):
	def post(self):
		session = get_current_session()
		user = users.get_current_user()
		client_id = self.request.get('from')
		logger.info("channel disconnected")
		logger.info("  session = " + str(session))
		logger.info("  client_id = " + client_id)
		if user:
			msg = {"log" : "Client disconnected: " + client_id}
			channel.send_message(user.user_id(), json.dumps(msg))
		elif session.has_key('student'):
			# Student connected
			logger.info("  Student with session disconnected")
			student = session['student']
			# Send update message
			msg = {"log" : "student disconnected"}
			channel.send_message(session.sid, json.dumps(msg))
		else:
			logger.info("  Channel disconnected, force student logout, sid = " + client_id)
			# Student logout
			session = Session(sid=client_id)
			logger.info("  calc'd session = " + str(session))
			studentQuery = Student.all().filter('session_sid = ', client_id)
			student = studentQuery.get()
			if student:
				student.logged_in = False
				student.session_sid = ""
				student.put()
				# Send update message
				teacher = student.teacher.user
				msg = {"change" : "student_logout"}
				channel.send_message(teacher.user_id(), json.dumps(msg))
			else:
				logger.info("  No student w/ matching sid found in DB")

def main():
	application = webapp.WSGIApplication([('/', MainPage),
										  ('/teacher_login', TeacherLoginHandler),
										  ('/teacher', TeacherPage),
										  ('/student_list', StudentListPage),
										  ('/student_login', StudentLoginPage),
										  ('/student_login_handler', StudentLoginHandler),
										  ('/student', StudentPage),
										  ('/logout', LogoutPage),
										  ('/search_executed', SearchExecutedHandler),
										  ('/link_followed', LinkFollowedHandler),
										  ('/query', QueryHandler),
										  ('/_ah/channel/connected/', ChannelConnectedHandler),
										  ('/_ah/channel/disconnected/', ChannelDisconnectedHandler),
										 ],
										 debug=True)
	util.run_wsgi_app(application)


if __name__ == '__main__':
	main()