#!/usr/bin/env python

# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from model import Teacher, Student, StudentActivity, SearchParty, Client

# Silence warnings about Django
# http://code.google.com/appengine/docs/python/tools/libraries.html#Django
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'dummy_django_settings'
from google.appengine.dist import use_library
use_library('django', '1.2')


def main():
	from ChannelConnectedHandler    import ChannelConnectedHandler
	from ChannelDisconnectedHandler import ChannelDisconnectedHandler
	from LinkFollowedHandler        import LinkFollowedHandler
	from LogoutPage                 import LogoutPage
	from MainPage                   import MainPage
	from QueryHandler               import QueryHandler
	from SearchExecutedHandler      import SearchExecutedHandler
	from StudentListPage            import StudentListPage
	from StudentLoginHandler        import StudentLoginHandler
	from StudentLoginPage           import StudentLoginPage
	from StudentPage                import StudentPage
	from TeacherLessons             import TeacherLessons
	from TeacherLoginHandler        import TeacherLoginHandler
	from TeacherPage                import TeacherPage

	from google.appengine.ext import webapp

	application = webapp.WSGIApplication(
			[ ('/',                          MainPage),
			  ('/link_followed',             LinkFollowedHandler),
			  ('/logout',                    LogoutPage),
			  ('/query',                     QueryHandler),
			  ('/search_executed',           SearchExecutedHandler),
			  ('/student',                   StudentPage),
			  ('/student_list',              StudentListPage),
			  ('/student_login',             StudentLoginPage),
			  ('/student_login_handler',     StudentLoginHandler),
			  ('/teacher/([-_A-Za-z0-9]+)',  TeacherPage),
			  ('/teacher_login',             TeacherLoginHandler),
			  ('/teacher_lessons',           TeacherLessons),
			  ('/_ah/channel/connected/',    ChannelConnectedHandler),
			  ('/_ah/channel/disconnected/', ChannelDisconnectedHandler),
			 ], debug=True)
	webapp.util.run_wsgi_app(application)


if __name__ == '__main__':
	main()
