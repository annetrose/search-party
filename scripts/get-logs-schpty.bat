@rem Download the logs to a local file for schpty.

@rem Run this from the project directory like this:
@rem
@rem cd s:\d\sp\search-party\
@rem scripts\get-logs-schpty.bat

c:\p\Python27\python27.exe c:\p\AppEngine\appcfg.py --email=alexanderjquinn@gmail.com --num_days 0 --include_vhost --severity=0 --application=schpty --version=dev request_logs . "logs\schpty.log" 

@rem See:
@rem http://blog.dantup.com/2009/12/downloadingexporting-app-engine-logs.html

@rem Alteratively, you could go to:
@rem https://appengine.google.com/logs?&app_id=s~schpty&version_id=dev.352755266362077037


@rem ______________________________________________________________________________
@rem Usage: appcfg.py [options] request_logs <directory> <output_file>
@rem 
@rem Write request logs in Apache common log format.
@rem 
@rem The 'request_logs' command exports the request logs from your application
@rem to a file.  It will write Apache common log format records ordered
@rem chronologically.  If output file is '-' stdout will be written.
@rem 
@rem Options:
@rem   -h, --help            Show the help message and exit.
@rem   -q, --quiet           Print errors only.
@rem   -v, --verbose         Print info level logs.
@rem   --noisy               Print all logs.
@rem   -s SERVER, --server=SERVER
@rem                         The App Engine server.
@rem   --insecure            Use HTTP when communicating with the server.
@rem   -e EMAIL, --email=EMAIL
@rem                         The username to use. Will prompt if omitted.
@rem   -H HOST, --host=HOST  Overrides the Host header sent with all RPCs.
@rem   --no_cookies          Do not save authentication cookies to local disk.
@rem   --skip_sdk_update_check
@rem                         Do not check for SDK updates.
@rem   --passin              Read the login password from stdin.
@rem   -A APP_ID, --application=APP_ID
@rem                         Override application from app.yaml file.
@rem   -V VERSION, --version=VERSION
@rem                         Override (major) version from app.yaml file.
@rem   -r RUNTIME, --runtime=RUNTIME
@rem                         Override runtime from app.yaml file.
@rem   -R, --allow_any_runtime
@rem                         Do not validate the runtime in app.yaml
@rem   -n NUM_DAYS, --num_days=NUM_DAYS
@rem                         Number of days worth of log data to get. The cut-off
@rem                         point is midnight US/Pacific. Use 0 to get all
@rem                         available logs. Default is 1, unless --append is also
@rem                         given; then the default is 0.
@rem   -a, --append          Append to existing file.
@rem   --severity=SEVERITY   Severity of app-level log messages to get. The range
@rem                         is 0 (DEBUG) through 4 (CRITICAL). If omitted, only
@rem                         request logs are returned.
@rem   --vhost=VHOST         The virtual host of log messages to get. If omitted,
@rem                         all log messages are returned.
@rem   --include_vhost       Include virtual host in log messages.
@rem   --include_all         Include everything in log messages.
@rem   --end_date=END_DATE   End date (as YYYY-MM-DD) of period for log data.
@rem                         Defaults to today.
