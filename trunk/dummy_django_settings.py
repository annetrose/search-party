# Dummy to silence Django error like the following...
#
# WARNING  2011-08-29 15:23:38,051 __init__.py:165] Could not import settings 'settings' (Is it on sys.path? Does it have syntax errors?): No module named settings

import StripWhitespaceMiddleware
MIDDLEWARE_CLASSES = ( StripWhitespaceMiddleware, )
