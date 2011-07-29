from gaesessions import SessionMiddleware

# suggestion: generate your own random key using os.urandom(64).encode('hex')
# WARNING: Make sure you run os.urandom(64) OFFLINE and copy/paste the output to
# this file.  If you use os.urandom() to *dynamically* generate your key at
# runtime then any existing sessions will become junk every time you start,
# deploy, or update your app!
import os
COOKIE_KEY = '1fedb8b8ea2f341b86eb5d8c15241d41c4b9d9776b96337cf927598eb1dda7fc5d7b4b6fc33c7689e7825a7712cadbec492898481016995af7aafabc78b6e54f'

def webapp_add_wsgi_middleware(app):
  app = SessionMiddleware(app, cookie_key=COOKIE_KEY)
  return app