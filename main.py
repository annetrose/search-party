#!/usr/bin/env python

# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from model import Teacher, Student, StudentActivity, SearchParty, Client

import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

from google.appengine.dist import use_library
use_library('django', '0.96')
# See http://code.google.com/appengine/docs/python/tools/libraries.html#Django


def main():
	from ChannelConnectedHandler import ChannelConnectedHandler
	from ChannelDisconnectedHandler import ChannelDisconnectedHandler
	from LinkFollowedHandler import LinkFollowedHandler
	from LogoutPage import LogoutPage
	from MainPage import MainPage
	from QueryHandler import QueryHandler
	from SearchExecutedHandler import SearchExecutedHandler
	from SearchPartyChannelHandler import SearchPartyChannelHandler
	from SearchPartyRequestHandler import SearchPartyRequestHandler
	from StudentListPage import StudentListPage
	from StudentLoginHandler import StudentLoginHandler
	from StudentLoginPage import StudentLoginPage
	from StudentPage import StudentPage
	from TeacherLoginHandler import TeacherLoginHandler
	from TeacherPage import TeacherPage

	from google.appengine.ext.webapp import util
	from google.appengine.ext import webapp
	application = webapp.WSGIApplication(
			[ ('/', MainPage),
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
			 ], debug=True)
	util.run_wsgi_app(application)


if __name__ == '__main__':
	main()
