# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

def extend_session_lifetime(session):
	from datetime import datetime
	expire_dt = datetime.now() + DEFAULT_LIFETIME
	expiration = time.mktime(expire_dt.timetuple())
	session.regenerate_id(expiration_ts=expiration)	 # Extends expiration time
	

def calc_since_time(sinceStr):
	from datetime import datetime, timedelta, MINYEAR
	# default is Today
	now = datetime.now()
	sinceTime = datetime(now.year, now.month, now.day, 0)
	if sinceStr == "1":			# The beginning
		sinceTime = datetime(MINYEAR, 1, 1)
	elif sinceStr == "2":		# Last week
		dayOfWeek = sinceTime.weekday()
		sinceTime -= timedelta(days=(dayOfWeek + 7))
	elif sinceStr == "3":		# This week
		dayOfWeek = sinceTime.weekday()
		sinceTime -= timedelta(days=dayOfWeek)
	elif sinceStr == "4":		# Yesterday
		sinceTime -= timedelta(days=1)
	return sinceTime

def send_msg(person, msg_type, msg):
	from google.appengine.api import channel
	from django.utils import simplejson as json
	from model import Student, Teacher
	assert isinstance(person, Student) or isinstance(person, Teacher)
	for client_id in person.client_ids:
		channel.send_message(client_id, json.dumps({msg_type:msg}))

def send_update_msg(person, msg):
	send_msg(person=person, msg_type="change", msg=msg)

def send_log_msg(person, msg):
	send_msg(person=person, msg_type="log", msg=msg)

def log(s):
	import logging
	logging.getLogger().info(s)
