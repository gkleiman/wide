import bcrypt

from base64 import b64decode

import os, re, time
from mercurial.i18n import _
from mercurial import ui, hg, util, templater
from mercurial import error, encoding
from mercurial.hgweb.common import ErrorResponse, get_mtime, staticfile, paritygen,\
                   get_contact, HTTP_OK, HTTP_NOT_FOUND, HTTP_SERVER_ERROR
from mercurial.hgweb.hgweb_mod import hgweb
from mercurial.hgweb.request import wsgirequest
import mercurial.hgweb.webutil

from mercurial.hgweb.common import HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED, HTTP_METHOD_NOT_ALLOWED
from mercurial.hgweb.hgwebdir_mod import hgwebdir
from mercurial.hgweb import hgweb_mod

class HgWide(hgwebdir):
    """A simple HTTP basic authentication implementation (RFC 2617) usable
    as WSGI middleware.
    """

    def __init__(self, realm, dsn, repos_base, conf, baseui=None):
        self.dsn = dsn
        self.realm = realm
        self.placeholder = None
        self.repos_base = repos_base

        hgwebdir.__init__(self, conf, baseui)

    def findrepos(self, db):
        """
        Find repos from wIDE database.
        """
        dbcur = db.cursor()
        dbcur.execute('SELECT repositories.path FROM repositories')

        repos = {}
        row = dbcur.fetchone()
        while row:
            real_path =  os.path.normpath(os.path.join(self.repos_base, row[0].lstrip('/')))
            repos[row[0].lstrip('/')] = real_path
            row = dbcur.fetchone()

        self.repos = repos.items()

    def _send_challenge(self, req):
        req.header([('WWW-Authenticate', 'Basic realm="%s"' % self.realm)])
        raise ErrorResponse(HTTP_UNAUTHORIZED, 'List wIDE repositories is unauthorized')

    def _user_login(self, db, req):
        req.env['REMOTE_USER'] = None
        req.env['USER_ID'] = None

        header = req.env.get('HTTP_AUTHORIZATION')
        if not header or not header.startswith('Basic'):
            return False

        creds = b64decode(header[6:]).split(':')
        if len(creds) != 2:
            return False

        username, password = creds

        dbcur = db.cursor()
        dbcur.execute('SELECT users.encrypted_password, users.password_salt, users.id FROM users '
                            'WHERE LOWER(users.user_name)=LOWER(%s) AND users.active="t"' % (self.placeholder,),
                      (username,))

        row = dbcur.fetchone()
        if not row:
            return False

        hashed_password = bcrypt.hashpw('%(password)s%(pepper)s' % {'password':password, 'pepper':self.dsn["PEPPER"]}, row[1])
        if not row[0] == hashed_password:
          return False

        req.env['AUTH_TYPE'] = 'Basic'
        req.env['REMOTE_USER'] = username
        req.env['USER_ID'] = row[2]

        return True

    def _setup_repo(self, db, repo, repository_path):
        dbcur = db.cursor()
        dbcur.execute('SELECT projects.name FROM projects, repositories '
                            'WHERE projects.id=repositories.project_id AND repositories.path=%s' % (self.placeholder,),
                      (repository_path,))

        row = dbcur.fetchone()
        if not row:
            return

        repo.ui.setconfig('web', 'name', row[0])
        repo.ui.setconfig('web', 'description', row[0])
        repo.ui.setconfig('web', 'contact', 'Project Owner')

    def _project_info_from_repo_path(self, db, repository_path):
        dbcur = db.cursor()
        dbcur.execute('SELECT repositories.project_id, projects.user_id FROM repositories, projects '
                            'WHERE repositories.path=%s AND repositories.project_id = projects.id' % (self.placeholder,),
                      (repository_path,))

        row = dbcur.fetchone()
        if not row:
            return

        return (row[0], row[1])


    def run_wsgi(self, req):
        try:
            try:
                db, self.placeholder = connect(self.dsn)

                self.refresh()
                self.findrepos(db)

                virtual = req.env.get("PATH_INFO", "").strip('/')
                tmpl = self.templater(req)
                ctype = tmpl('mimetype', encoding=encoding.encoding)
                ctype = templater.stringify(ctype)

                # a static file
                if virtual.startswith('static/') or 'static' in req.form:
                    if virtual.startswith('static/'):
                        fname = virtual[7:]
                    else:
                        fname = req.form['static'][0]
                    static = templater.templatepath('static')
                    return (staticfile(static, fname, req),)

                self._user_login(db, req)

                # top-level index
                if not virtual:
                    # nobody can list repositories
                    self._send_challenge(req)

                # navigate to hgweb
                repository_path = '/'.join(virtual.split('/')[0:2])

                repos = dict(self.repos)
                real = repos.get(repository_path)

                if real:
                    req.env['REPO_NAME'] = repository_path
                    req.env['PROJECT_ID'], req.env['PROJECT_OWNER_ID'] = self._project_info_from_repo_path(db, repository_path)

                    try:
                        repo = hg.repository(self.ui, real)
                        self._setup_repo(db, repo, repository_path)
                        return HgwebWide(db, self.placeholder, self.realm, repo).run_wsgi(req)
                    except IOError, inst:
                        msg = inst.strerror
                        raise ErrorResponse(HTTP_SERVER_ERROR, msg)
                    except error.RepoError, inst:
                        raise ErrorResponse(HTTP_SERVER_ERROR, str(inst))

                # prefixes not found
                req.respond(HTTP_NOT_FOUND, ctype)
                return tmpl("notfound", repo=virtual)

            except ErrorResponse, err:
                req.respond(err, ctype)
                return tmpl('error', error=err.message or '')
        finally:
            if vars().has_key('db'):
                db.close()

            db = None
            tmpl = None


perms = {
    'lookup': 'pull',
    'heads': 'pull',
    'branches': 'pull',
    'between': 'pull',
    'capabilities': 'pull',
    'branchmap': 'pull',

    'changegroup': 'pull',
    'changegroupsubset': 'pull',
    'unbundle': 'push',
    'stream_out': 'pull',
}
hgweb_mod.perms = perms

class HgwebWide(hgweb):
    def __init__(self, dbconn, placeholder, realm, repo, name=None):
        self.db = dbconn
        self.realm = realm
        self.placeholder = placeholder

        hgweb.__init__(self, repo, name)

    def _send_challenge(self, req, msg):
        req.header([('WWW-Authenticate', 'Basic realm="%s"' % self.realm)])
        raise ErrorResponse(HTTP_UNAUTHORIZED, msg)

    def _get_perms(self, user_id, project_id, project_owner_id):
        """
        Find member permissions from wIDE database.

        wIDE repository relate permissions:
            allow_read - :browse_repository
            allow_pull - :view_changesets
            allow_push - :commit_access

        @return (allow_read, allow_pull, allow_push) tuple
        """
        is_public = self._is_public_project(project_id)

        if not user_id: # anonymous user
            if is_public:
                return (True, True, False)
            return (False, False, False)

        if project_owner_id == user_id: # project owner
          return (True, True, True)

        # wIDE member
        dbcur = self.db.cursor()
        dbcur.execute('SELECT project_collaborators.id FROM project_collaborators '
                            'WHERE project_collaborators.user_id=%(ph)s '
                            'AND project_collaborators.project_id=%(ph)s' % {'ph':self.placeholder},
                      (user_id, project_id))

        row = dbcur.fetchone()
        if not row:
            # user doesn't have any permits
            return (False, False, False)

        return (True, True, True)

    def _is_public_project(self, project_id):
        dbcur = self.db.cursor()
        dbcur.execute('SELECT projects.public FROM projects '
                            'WHERE projects.id=%s' % (self.placeholder,),
                      (project_id, )
                     )

        row = dbcur.fetchone()
        if not row:
            return False

        return row[0] == 't'

    def check_perm(self, req, op):
        '''Check permission for operation based on request data (including
        authentication info). Return if op allowed, else raise an ErrorResponse
        exception.'''

        user_id = req.env.get('USER_ID')
        project_id = req.env.get('PROJECT_ID')
        project_owner_id = req.env.get('PROJECT_OWNER_ID')

        allow_read, allow_pull, allow_push = self._get_perms(user_id, project_id, project_owner_id)

        if not allow_read:
            self._send_challenge(req, 'read not authorized')

        if op == 'pull' and not self.allowpull:
            raise ErrorResponse(HTTP_UNAUTHORIZED, 'pull not authorized')
        elif op == 'pull' and not allow_pull :
            self._send_challenge(req, 'pull not authorized')
        elif op == 'pull' or op is None: # op is None for interface requests
            return

        # enforce that you can only push using POST requests
        if req.env['REQUEST_METHOD'] != 'POST':
            msg = 'push requires POST request'
            raise ErrorResponse(HTTP_METHOD_NOT_ALLOWED, msg)

        # require ssl by default for pushing, auth info cannot be sniffed
        # and replayed
        scheme = req.env.get('wsgi.url_scheme')
        if self.configbool('web', 'push_ssl', True) and scheme != 'https':
            raise ErrorResponse(HTTP_OK, 'ssl required')

        if not allow_push:
            self._send_challenge(req, 'push not authorized')


def connect(dsn):
    """
    Connect to database parsing dsn.

    @param dsn Database specification.
    @return Database object.
    """

    driver = dsn['ENGINE']
    host = dsn['HOST']
    user = dsn['USER']
    password = dsn['PASSWORD']
    dbname = dsn['NAME']
    port = dsn['PORT']

    # Try to import database driver
    if driver == 'mysql':
        import MySQLdb

        # Create database
        db = MySQLdb.connect(
            user=user, passwd=password, host=host,
            port=port, db=dbname, use_unicode=True
        )
        placeholder = "%s"

    elif driver == 'postgresql':
        import psycopg2, psycopg2.extras, psycopg2.extensions
        psycopg2.extensions.register_type(psycopg2.extensions.UNICODE)

        if not port:
            port = '5432'

        dsn = "dbname='%s' user='%s' host='%s' password='%s' port=%s" % (
                dbname, user, host, password, port
        )

        db = psycopg2.connect(dsn)
        db.set_client_encoding('UTF-8')
        placeholder = "%s" #not so sure ;)

    elif driver == 'sqlite3':
        import sqlite3

        # Create database
        db = sqlite3.connect(dbname)
        placeholder = "?"
    else:
        raise ValueError('Unknown database type %s' % (driver, ))

    return [db, placeholder]
