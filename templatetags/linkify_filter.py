from google.appengine.ext.webapp import template
from django.utils.safestring import mark_safe
from django.utils.html import conditional_escape
import re

register = template.create_template_register()

@register.filter
def linkify(s):
	s = conditional_escape(s)
	s = re.sub(r"(http://\S+)", r'<a href="\1">\1</a>', s)
	s = mark_safe(s)
	return s
