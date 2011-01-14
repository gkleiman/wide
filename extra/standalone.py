#!/usr/bin/env python

from wsgiref.simple_server import make_server

from hgwide import HgWide


# 'postgresql', 'mysql', 'sqlite3', and 'oracle'
DSN = {
	'ENGINE' : 'sqlite3',
	'HOST'   : '',
	'PORT'   : '',
	'NAME'	 : '/home/gkleiman/Facu/wide/db/development.sqlite3',
	'USER'   : '',
	'PASSWORD' : '',
	'PEPPER' : '8c858d8d637763dd07fecc528c59d953161b52e86483d3ed142bf2a736e74762635b279a7657b23c9e51236416b819f442e20ee6de72b9535bdc4ada8c75dda9',
	'OPTIONS': {},
}

TITLE = 'Mercurial (Hg) Proxy for wIDE'
HGWEB_CFG_PATH = './hgweb.cfg'
REPOS_BASE = '/home/gkleiman/Facu/wide/public/repositories'

application = HgWide(TITLE, DSN, REPOS_BASE, HGWEB_CFG_PATH)

httpd = make_server('', 8070, application)
print "Serving on port 8070..."

# Serve until process is killed
httpd.serve_forever()

