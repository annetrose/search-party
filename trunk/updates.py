# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 17, 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from google.appengine.api import channel
import json

def _send_update(from_person, to_person, *updates):
    from model import Student, Teacher
    from client_id_utils import timestamp_for_client_id
#    from settings import CHANNEL_LIMIT_PER_STUDENT
    from helpers import log

    assert isinstance(to_person, (Student,Teacher)), repr(to_person)

    import datetime
    timestamp = datetime.datetime.now()
    updates_list = list(updates)
    updates_list[0]['timestamp'] = timestamp.strftime('%B %d, %Y %H:%M:%S')
    updates_json = json.dumps(updates_list)

    # Sort and dedupe client_ids by timestamp, descending
    client_ids = set(to_person.client_ids)
    key_fn = lambda client_id:timestamp_for_client_id(client_id)
    client_ids = sorted(client_ids, key=key_fn, reverse=True)
    
#    if CHANNEL_LIMIT_PER_STUDENT is not None and len(client_ids) > CHANNEL_LIMIT_PER_STUDENT and isinstance(to_person, Student):
#        client_ids = client_ids[:CHANNEL_LIMIT_PER_STUDENT]
#        log( "=> WARNING: Found %d client IDs for %r but only using %d"%(len(to_person.client_ids), to_person, CHANNEL_LIMIT_PER_STUDENT) )

    if len(client_ids)==0:
        log("=> MESSAGE NOT SENT. No current client IDs for {0}.".format(to_person))
    
    for client_id in client_ids:
        log( "client ID : %r : sent %s"%(client_id," + ".join(u["type"] for u in updates)) )
        channel.send_message(client_id, updates_json)

def send_update_log_in(student, teacher):
    update = {"type":"log_in", "student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code }
    _send_update(student, teacher, update)

def send_update_log_out(student, teacher):
    update = {"type":"log_out", "student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code }
    _send_update(student, teacher, update)
    
def send_update_query(student, teacher, task_idx, query, notifyStudent=False):
    update = {"type":"query", "student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code, "task_idx":task_idx, "query":query}
    _send_update(student, teacher, update)
    if notifyStudent:
        _send_update(teacher, student, update)

def send_update_task(student, teacher, task_idx):
    update = {"type":"task", "student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code, "task_idx":task_idx}
    _send_update(student, teacher, update)

def send_update_link_followed(student, teacher, task_idx, query, url, title, notifyStudent=False):
    update = {"type":"link_followed", "student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code, "task_idx":task_idx, "query":query, "url":url, "title":title}
    _send_update(student, teacher, update)
    if notifyStudent:
        _send_update(teacher, student, update)
    
def send_update_link_rated(student, teacher, task_idx, url, is_helpful, notifyStudent=False):
    update = {"type":"link_rated", "student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code, "task_idx":task_idx, "url":url, "is_helpful":is_helpful}
    _send_update(student, teacher, update)
    if notifyStudent:
        _send_update(teacher, student, update)
    
def send_update_answer(student, teacher, task_idx, answer_text, answer_explanation, notifyStudent=False):
    update = {"type":"answer", "student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code, "task_idx":task_idx, "text":answer_text, "explanation":answer_explanation}
    _send_update(student, teacher, update)
    if notifyStudent:
        _send_update(teacher, student, update)     
    
def send_error(to_person, msg):
    for client_id in to_person.client_ids:
        channel.send_message(client_id, json.dumps({"type":"error", "msg":msg}))
