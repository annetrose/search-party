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

def to_str_if_ascii(s):
	if isinstance(s, basestring):
		try:
			s = str(s)
		except UnicodeEncodeError:
			pass
	return s

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

def literal_eval(node_or_string):
	# Credit for this method: Gabriel Genellina
	# http://www.velocityreviews.com/forums/t698556-re-compiler-ast-helper-function-literal_eval-in-python-2-4-a.html
	"""
	Safely evaluate an expression node or a string containing a Python
	expression. The string or node provided may only consist of the following
	Python literal structures: strings, numbers, tuples, lists, dicts, booleans,
	and None.
	"""
	from compiler import parse
	from compiler.ast import Const, Tuple, List, Dict, Name, UnarySub, Expression
	_safe_names = {'None': None, 'True': True, 'False': False}

	if isinstance(node_or_string, basestring):
		node_or_string = parse(node_or_string, mode='eval')
	if isinstance(node_or_string, Expression):
		node_or_string = node_or_string.node

	def _convert(node):
		if isinstance(node, Const) and isinstance(node.value, (basestring, int, float, long, complex)):
			return node.value
		elif isinstance(node, Tuple):
			return tuple(map(_convert, node.nodes))
		elif isinstance(node, List):
			return list(map(_convert, node.nodes))
		elif isinstance(node, Dict):
			return dict((_convert(k), _convert(v)) for k, v in node.items)
		elif isinstance(node, Name):
			if node.name in _safe_names:
				return _safe_names[node.name]
			elif isinstance(node, UnarySub):
				return -_convert(node.expr)
		raise ValueError('malformed string')

	return _convert(node_or_string)
