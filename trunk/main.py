#!/usr/bin/env python

# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from model import Teacher, Student, StudentActivity
import webapp2

from AnswerHandler              import AnswerHandler
from ChannelConnectedHandler    import ChannelConnectedHandler
from ChannelDisconnectedHandler import ChannelDisconnectedHandler
from LinkFollowedHandler        import LinkFollowedHandler
from LinkRatedHandler           import LinkRatedHandler
from LogoutPage                 import LogoutPage
from MainPage                   import MainPage
from SearchExecutedHandler      import SearchExecutedHandler
from StudentLoginHandler        import StudentLoginHandler
from StudentLoginPage           import StudentLoginPage
from StudentPage                import StudentPage
from TaskChangedHandler         import TaskChangedHandler
from TeacherLessons             import TeacherLessons
from TeacherLoginHandler        import TeacherLoginHandler
from UpdateDB                   import UpdateDB
from TeacherPage                import TeacherPage
from DataDump                   import DataDump

application = webapp2.WSGIApplication(
		[ ('/',                          MainPage),
		  ('/answer',                    AnswerHandler),
		  ('/link_followed',             LinkFollowedHandler),
		  ('/link_rated',                LinkRatedHandler),
		  ('/logout',                    LogoutPage),
		  ('/search_executed',           SearchExecutedHandler),
		  ('/student',                   StudentPage),
		  ('/student_login',             StudentLoginPage),
		  ('/student_login_handler',     StudentLoginHandler),
		  ('/task_changed',              TaskChangedHandler),
		  ('/teacher/([-_A-Za-z0-9]+)',  TeacherPage),
		  ('/teacher_login',             TeacherLoginHandler),
		  ('/teacher_lessons',           TeacherLessons),
		  ('/update_db',                 UpdateDB),
		  ('/data_dump',                 DataDump),
		  ('/_ah/channel/connected/',    ChannelConnectedHandler),
		  ('/_ah/channel/disconnected/', ChannelDisconnectedHandler),
		 ], debug=True)

def main():
	application.run()

if __name__ == '__main__':
	main()
