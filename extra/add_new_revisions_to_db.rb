#!/usr/bin/env ruby

ENV['RAILS_ENV'] ||= 'production'

require '/home/wide/application/current/config/environment.rb'

repo_absolute_path = Dir.getwd

repo_path = Wide::PathUtils.relative_to_base(Settings.repositories_base, repo_absolute_path)

Repository.find_by_path(repo_path).add_new_revisions_to_db
