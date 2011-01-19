if Rails.env == 'development'
  Wide::Scm::Scm.add_adapter('Mercurial')
  Wide::Scm::Scm.add_adapter('Filesystem')
end
