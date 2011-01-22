# Load RVM only if it is installed
if(ENV['rvm_path'])
  $:.unshift(File.expand_path('./lib', ENV['rvm_path'])) # Add RVM's lib directory to the load path.
  require "rvm/capistrano"                  # Load RVM's capistrano plugin.
  set :rvm_ruby_string, '1.8.7@wide'        # Or whatever env you want it to run in.
end

load 'deploy' if respond_to?(:namespace) # cap2 differentiator
Dir['vendor/plugins/*/recipes/*.rb'].each { |plugin| load(plugin) }

load 'config/deploy' # remove this line to skip loading any of the default tasks
