require 'bundler/capistrano'
require 'delayed/recipes'

set :application, "wIDE"
set :repository,  "https://github.com/gkleiman/wide.git"
set :rails_env, 'production'

set :deploy_to, "/home/wide/application"
set :user, "wide"
set :use_sudo, false
set :scm, :git
set :deploy_via, :remote_cache

role :web, "192.168.0.102"                          # Your HTTP server, Apache/etc
role :app, "192.168.0.102"                          # This may be the same as your `Web` server
role :db,  "192.168.0.102", :primary => true        # This is where Rails migrations will run

namespace :customs do
  task :setup, :except => { :no_release => true } do
    run "#{try_sudo} mkdir -p #{deploy_to}/#{shared_dir}/repositories"
    run "#{try_sudo} mkdir -p #{deploy_to}/#{shared_dir}/compiled"
    run "#{try_sudo} mkdir -p #{deploy_to}/#{shared_dir}/db && #{try_sudo} touch #{deploy_to}/#{shared_dir}/db/production.sqlite3"
  end

  task :symlink, :except => { :no_release => true } do
    run "ln -nfs #{deploy_to}/#{shared_dir}/repositories #{deploy_to}/#{current_dir}/repositories"
    run "ln -nfs #{deploy_to}/#{shared_dir}/compiled #{deploy_to}/#{current_dir}/compiled"
    run "ln -nfs #{deploy_to}/#{shared_dir}/db/production.sqlite3 #{deploy_to}/#{current_dir}/db/production.sqlite3"
    run "ln -nfs #{deploy_to}/#{current_dir}/extra #{deploy_to}/../hgwide"
  end
end

namespace :deploy do
  task :start do ; end
  task :stop do ; end
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} touch #{File.join(current_path,'tmp','restart.txt')}"
  end
end

after "deploy:setup", "customs:setup"
after "deploy:symlink", "customs:symlink"
after "deploy:stop", "delayed_job:stop"
after "deploy:start", "delayed_job:start"
after "deploy:restart", "delayed_job:restart"
