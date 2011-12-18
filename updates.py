# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 17, 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

def _send_update(person, *updates):
	from google.appengine.api import channel
#	from django.utils import simplejson as json
	import json
	from model import Student, Teacher
	assert isinstance(person, (Student,Teacher)), repr(person)
	from helpers import log
	from client_id_utils import is_client_id_expired, timestamp_for_client_id
	from settings import CHANNEL_LIMIT_PER_PERSON
	log( repr(person) + " --> " + updates[0]["type"] )
	updates_json = json.dumps(list(updates))
	#for client_id in person.get_all_client_ids():

	expired_client_ids = filter(is_client_id_expired, person.client_ids)
	if len(expired_client_ids):
		for client_id in expired_client_ids:
			person.client_ids.remove(client_id)
		person.put()
		log( "client ID : %r : ignored and removed because expired"%(client_id) )

	# Sort and dedupe client_ids by timestamp, descending
	client_ids = set(person.client_ids)
	key_fn = lambda client_id:timestamp_for_client_id(client_id)
	client_ids = sorted(client_ids, key=key_fn, reverse=True)

	if CHANNEL_LIMIT_PER_PERSON is not None and len(client_ids) > CHANNEL_LIMIT_PER_PERSON:
		client_ids = client_ids[:CHANNEL_LIMIT_PER_PERSON]
		log( "Found %d client IDs for %r but only using %d"%(len(person.client_ids), person, CHANNEL_LIMIT_PER_PERSON) )
	elif len(client_ids)==0:
		log( "No current client IDs for %r"%person )
	else:
		log( "Found %d client IDs for %r"%(len(person.client_ids), person) )

	for client_id in client_ids:
		log( "client ID : %r : sent %s"%(client_id," + ".join(u["type"] for u in updates)) )
		channel.send_message(client_id, updates_json)

def send_update_query(teacher, student_nickname, task_idx, query):
	update = {"type":"query", "student_nickname":student_nickname, "task_idx":task_idx, "query":query}
	_send_update(teacher, update)

def send_update_link_followed(teacher, student_nickname, task_idx, query, url, title):
	update = {"type":"link_followed", "student_nickname":student_nickname, "task_idx":task_idx, "query":query, "url":url, "title":title}
	_send_update(teacher, update)

def send_update_log_in(teacher, student_nickname, task_idx):
	update = {"type":"log_in", "student_nickname":student_nickname, "task_idx":task_idx}
	_send_update(teacher, update)

def send_update_log_out(teacher, student_nickname):
	update = {"type":"log_out", "student_nickname":student_nickname}
	_send_update(teacher, update)

def send_update_task(teacher, student_nickname, task_idx):
	update = {"type":"task", "student_nickname":student_nickname, "task_idx":task_idx}
	_send_update(teacher, update)

def send_update_answer(teacher, student_nickname, task_idx, answer_text, answer_explanation):
	update = {"type":"answer", "student_nickname":student_nickname, "task_idx":task_idx, "text":answer_text, "explanation":answer_explanation}
	_send_update(teacher, update)

def send_update_link_rated(teacher, student_nickname, task_idx, url, is_helpful):
	update = {"type":"link_rated", "student_nickname":student_nickname, "task_idx":task_idx, "url":url, "is_helpful":is_helpful}
	_send_update(teacher, update)
