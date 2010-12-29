require 'bundler/capistrano'
require 'delayed/recipes'

set :application, "wIDE"
set :repository,  "https://github.com/gkleiman/wide.git"

set :deploy_to, "/home/wide/application"
set :user, "wide"
set :use_sudo, false
set :scm, :git
set :deploy_via, :remote_cache
#set :branch, 'version-2.0.13'

role :web, "192.168.0.102"                          # Your HTTP server, Apache/etc
role :app, "192.168.0.102"                          # This may be the same as your `Web` server
role :db,  "192.168.0.102", :primary => true # This is where Rails migrations will run

# If you are using Passenger mod_rails uncomment this:
# if you're still using the script/reapear helper you will need
# these http://github.com/rails/irs_process_scripts

namespace :customs do
  task :symlinks, :roles => :app do
    run <<-CMD
      mkdir -p #{deploy_to}/#{shared_dir}/repositories
    CMD
    run <<-CMD
      ln -nfs #{deploy_to}/#{shared_dir}/repositories #{deploy_to}/#{current_dir}/public/repositories
    CMD
    run <<-CMD
      mkdir -p #{deploy_to}/#{shared_dir}/compiled
    CMD
    run <<-CMD
      ln -nfs #{deploy_to}/#{shared_dir}/compiled #{deploy_to}/#{current_dir}/public/compiled
    CMD
    run <<-CMD
      mkdir -p #{deploy_to}/#{shared_dir}/db && touch #{deploy_to}/#{shared_dir}/db/production.sqlite3
    CMD
    run <<-CMD
      ln -nfs #{deploy_to}/#{shared_dir}/db/production.sqlite3 #{deploy_to}/#{current_dir}/db/production.sqlite3
    CMD
  end
end

namespace :deploy do
  task :start do ; end
  task :stop do ; end
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} touch #{File.join(current_path,'tmp','restart.txt')}"
  end
end

after "deploy:symlink", "customs:symlinks"
after "deploy:stop", "delayed_job:stop"
after "deploy:start", "delayed_job:start"
after "deploy:restart", "delayed_job:restart"
