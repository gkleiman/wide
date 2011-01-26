# mod_wsgi deploy

#   WSGIScriptAliasMatch ^(.*)$ /var/www/cgi-bin/hgwebdir.wsgi$1
#   <Directory "/var/www/cgi-bin/">
#     Order allow,deny
#     Allow from all
#     AllowOverride All
#     Options ExecCGI
#     AddHandler wsgi-script .wsgi
#     WSGIPassAuthorization On    #EXTREMELY IMPORTANT
#   </Directory>

# enable demandloading to reduce startup time
from mercurial import demandimport; demandimport.enable()

# Uncomment to send python tracebacks to the browser if an error occurs:
#import cgitb
#cgitb.enable()

# If you'd like to serve pages with UTF-8 instead of your default
# locale charset, you can do so by uncommenting the following lines.
# Note that this will cause your .hgrc files to be interpreted in
# UTF-8 and all your repo files to be displayed using UTF-8.
#
import os
os.environ["HGENCODING"] = "UTF-8"

import sys
sys.path.append("/home/wide/hgwide/")

from hgwide import HgWide

DSN = {
	'ENGINE' : 'sqlite3',
	'HOST'   : '',
	'PORT'   : '',
	'NAME'	 : '/home/wide/application/current/db/production.sqlite3',
	'USER'   : '',
	'PASSWORD' : '',
	'PEPPER' : '8c858d8d637763dd07fecc528c59d953161b52e86483d3ed142bf2a736e74762635b279a7657b23c9e51236416b819f442e20ee6de72b9535bdc4ada8c75dda9',
	'OPTIONS': {},
}

TITLE = 'Mercurial (Hg) Proxy for wIDE'
HGWEB_CFG_PATH = '/home/wide/hgwide/hgweb.cfg'
REPOS_BASE = '/home/wide/application/current/repositories'

application = HgWide(TITLE, DSN, REPOS_BASE, HGWEB_CFG_PATH)


class Debugger:

    def __init__(self, object):
        self.__object = object

    def __call__(self, *args, **kwargs):
        import pdb, sys
        debugger = pdb.Pdb()
        debugger.use_rawinput = 0
        debugger.reset()
        sys.settrace(debugger.trace_dispatch)

        try:
            return self.__object(*args, **kwargs)
        finally:
            debugger.quitting = 1
            sys.settrace(None)

#application = Debugger(application)
