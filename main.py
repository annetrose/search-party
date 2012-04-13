#!/usr/bin/env python

# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

import webapp2

from AdminPage                  import AdminPage
from AnswerHandler              import AnswerHandler
from ChannelConnectedHandler    import ChannelConnectedHandler
from ChannelDisconnectedHandler import ChannelDisconnectedHandler
from ChannelExpiredHandler      import ChannelExpiredHandler
from LinkFollowedHandler        import LinkFollowedHandler
from LinkRatedHandler           import LinkRatedHandler
from MainPage                   import MainPage
from SearchExecutedHandler      import SearchExecutedHandler
from StudentLoginHandler        import StudentLoginHandler
from StudentLoginPage           import StudentLoginPage
from StudentLogout              import StudentLogout
from StudentPage                import StudentPage
from TaskChangedHandler         import TaskChangedHandler
from TeacherDashboard           import TeacherDashboard
from TeacherLoginHandler        import TeacherLoginHandler
from TeacherLogout              import TeacherLogout
from TeacherPage                import TeacherPage
#from UpdateDB                  import UpdateDB
from DataDump                   import DataDump

application = webapp2.WSGIApplication(
		[ ('/',                          MainPage),
          ('/admin',                     AdminPage),
		  ('/answer',                    AnswerHandler),
		  ('/data_dump',                 DataDump),
		  ('/link_followed',             LinkFollowedHandler),
		  ('/link_rated',                LinkRatedHandler),
		  ('/search_executed',           SearchExecutedHandler),
		  ('/student',                   StudentPage),
		  ('/student_login',             StudentLoginPage),
		  ('/student_login_handler',     StudentLoginHandler),
		  ('/student_logout',            StudentLogout),
		  ('/task_changed',              TaskChangedHandler),
          ('/teacher_dashboard',         TeacherDashboard),
		  ('/teacher/([-_A-Za-z0-9]+)',  TeacherPage),
		  ('/teacher_login',             TeacherLoginHandler),
		  ('/teacher_logout',            TeacherLogout),
#		  ('/update_db',                 UpdateDB),
		  ('/_ah/channel/connected/',    ChannelConnectedHandler),
		  ('/_ah/channel/disconnected/', ChannelDisconnectedHandler),
          ('/channel_expired/([-_A-Za-z0-9]+)', ChannelExpiredHandler),
		 ], debug=True)

def main():
	application.run()

if __name__ == '__main__':
	main()
