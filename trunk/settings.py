# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

DEBUG = False
try:
	# Set to debug mode only when running in the development server.
	import os
	if os.environ["SERVER_SOFTWARE"].startswith("Development"):
		DEBUG = True
except:
	pass

DEBUG = True

ENABLE_DEBUG_LOGGING = DEBUG
ENABLE_UPDATE_LOGGING = DEBUG
ENABLE_FILLER_FORM_FILLING = DEBUG
REMOVE_OLD_CLIENT_IDS = False
CHANNEL_LIMIT_PER_PERSON = 1
PREVENT_MULTIPLE_STUDENT_LOGINS = True
ENABLE_LOGOUT_WHOOPS_ERROR = False
CLEAR_SESSION_ID_ON_STUDENT_DISCONNECT = True
