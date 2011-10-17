#from django import template
from django.template.defaultfilters import stringfilter
from google.appengine.ext.webapp import template

register = template.create_template_register()

@register.filter
def linkify(value):
	import re
	value = re.sub(r"(http://\S+)", r'<a href="\1" title="" target="_blank">\1</a>', value)
	return value

linkify.is_safe = True
linkify = stringfilter(linkify)
linkify.is_safe = True
