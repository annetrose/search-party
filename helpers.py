# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

def calc_since_time(since_str):
	from datetime import datetime, timedelta, MINYEAR
	# default is Today
	now = datetime.now()
	since_time = datetime(now.year, now.month, now.day, 0)
	if since_str == "1":		# The beginning
		since_time = datetime(MINYEAR, 1, 1)
	elif since_str == "2":		# Last week
		day_of_week = since_time.weekday()
		since_time -= timedelta(days=(day_of_week + 7))
	elif since_str == "3":		# This week
		day_of_week = since_time.weekday()
		since_time -= timedelta(days=day_of_week)
	elif since_str == "4":		# Yesterday
		since_time -= timedelta(days=1)
	return since_time


#def send_msg(person, msg_type, msg):
#	from google.appengine.api import channel
#	from django.utils import simplejson as json
#	from model import Student, Teacher
#	assert isinstance(person, Student) or isinstance(person, Teacher), repr(person)
#	for client_id in person.get_all_client_ids():
#		channel.send_message(client_id, json.dumps({msg_type:msg}))
#
#def send_update_msg(person, msg):
#	send_msg(person=person, msg_type="change", msg=msg)
#
#def send_log_msg(person, msg):
#	import settings
#	if settings.ENABLE_UPDATE_LOGGING:
#		send_msg(person=person, msg_type="log", msg=msg)

def log(msg):
	import logging, settings
	if settings.ENABLE_DEBUG_LOGGING:
		logging.getLogger().info(msg)

def path_for_filename(filename):
	import os
	base_dir = os.path.dirname(os.path.abspath(__file__))
	path = os.path.join(base_dir, filename)
	path = os.path.abspath(path)
	return path

def read_file(filename, encoding="utf8"):
	import codecs
	path = path_for_filename(filename)
	infile = codecs.open(path, "r", encoding)
	try:
		file_contents = infile.read()
	finally:
		infile.close()
	return file_contents

def timestamp():
	import time
	return time.strftime("%Y%m%d-%H%M%S")

def prettify_html(html):
	from BeautifulSoup import BeautifulSoup
	soup = BeautifulSoup(html)
	pretty_html = soup.prettify()
	return pretty_html

def smush(s, to_length, num_dots=3):
	if not isinstance(s, basestring):
		s = str(s)
	s_len = len(s)
	if s_len > to_length:
		front_len = int((to_length - num_dots) / 2)
		back_len = to_length - num_dots - front_len
		s = s[:front_len] + "."*num_dots + s[-back_len:]
	return s

def chop(s, to_length, num_dots=3):
	if not isinstance(s, basestring):
		s = str(s)
	s_len = len(s)
	if s_len > to_length:
		front_len = to_length - num_dots
		s = s[:front_len] + "."*num_dots
	return s

#print smush( "fish", 5 )
#print smush( "fish fried with butter", 5 )
#print smush( 1, 5 )
#print smush( 1234567890, 5 )
#print chop( "fish", 5 )
#print chop( "fish fried with butter", 5 )
#print chop( 1, 5 )
#print chop( 1234567890, 5 )

	




#def extend_session_lifetime(session):
#	from datetime import datetime
#	expire_dt = datetime.now() + DEFAULT_LIFETIME
#	expiration = time.mktime(expire_dt.timetuple())
#	session.regenerate_id(expiration_ts=expiration)	 # Extends expiration time
	
