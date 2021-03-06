# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20110208194928) do

  create_table "admin_users", :force => true do |t|
    t.string   "first_name",       :default => "",    :null => false
    t.string   "last_name",        :default => "",    :null => false
    t.string   "role",                                :null => false
    t.string   "email",                               :null => false
    t.boolean  "status",           :default => false
    t.string   "token",                               :null => false
    t.string   "salt",                                :null => false
    t.string   "crypted_password",                    :null => false
    t.string   "preferences"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "admin_users", ["email"], :name => "index_admin_users_on_email", :unique => true

  create_table "changes", :force => true do |t|
    t.integer "changeset_id",                 :null => false
    t.string  "path",                         :null => false
    t.string  "action",       :default => "", :null => false
  end

  add_index "changes", ["changeset_id", "action"], :name => "index_changes_on_changeset_id_and_action"
  add_index "changes", ["changeset_id"], :name => "index_changes_on_changeset_id"
  add_index "changes", ["path"], :name => "index_changes_on_path"

  create_table "changesets", :force => true do |t|
    t.integer  "repository_id",                   :null => false
    t.integer  "revision",                        :null => false
    t.string   "scmid",                           :null => false
    t.string   "committer",                       :null => false
    t.string   "committer_email", :default => "", :null => false
    t.datetime "committed_on",                    :null => false
    t.text     "message"
  end

  add_index "changesets", ["committed_on"], :name => "index_changesets_on_committed_on"
  add_index "changesets", ["repository_id", "revision"], :name => "index_changesets_on_repository_id_and_revision", :unique => true
  add_index "changesets", ["repository_id"], :name => "index_changesets_on_repository_id"

  create_table "constants", :force => true do |t|
    t.integer  "container_id"
    t.string   "name",           :null => false
    t.string   "value",          :null => false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "container_type"
  end

  create_table "delayed_jobs", :force => true do |t|
    t.integer  "priority",   :default => 0
    t.integer  "attempts",   :default => 0
    t.text     "handler"
    t.text     "last_error"
    t.datetime "run_at"
    t.datetime "locked_at"
    t.datetime "failed_at"
    t.string   "locked_by"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "delayed_jobs", ["priority", "run_at"], :name => "delayed_jobs_priority"

  create_table "project_collaborators", :force => true do |t|
    t.integer  "project_id", :null => false
    t.integer  "user_id",    :null => false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "project_collaborators", ["project_id", "user_id"], :name => "index_project_collaborators_on_project_id_and_user_id", :unique => true

  create_table "project_types", :force => true do |t|
    t.string   "name"
    t.string   "description"
    t.text     "makefile_template"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "repository_template_file_name"
    t.string   "repository_template_content_type"
    t.integer  "repository_template_file_size"
    t.datetime "repository_template_updated_at"
    t.string   "binary_extension"
  end

  create_table "projects", :force => true do |t|
    t.integer  "user_id"
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "compilation_status"
    t.integer  "project_type_id"
    t.boolean  "public",             :default => false, :null => false
  end

  add_index "projects", ["name"], :name => "index_projects_on_name"
  add_index "projects", ["user_id"], :name => "index_projects_on_user_id"

  create_table "pull_urls", :force => true do |t|
    t.integer  "repository_id", :null => false
    t.string   "url",           :null => false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "pull_urls", ["repository_id", "url"], :name => "index_pull_urls_on_repository_id_and_url", :unique => true
  add_index "pull_urls", ["repository_id"], :name => "index_pull_urls_on_repository_id"

  create_table "repositories", :force => true do |t|
    t.integer  "project_id",           :null => false
    t.string   "path",                 :null => false
    t.string   "scm",                  :null => false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "async_op_status"
    t.text     "cached_status"
    t.text     "cached_summary"
    t.datetime "scm_cache_expired_at"
  end

  add_index "repositories", ["project_id"], :name => "index_repositories_on_project_id", :unique => true

  create_table "users", :force => true do |t|
    t.string   "email",                               :default => "",    :null => false
    t.string   "encrypted_password",   :limit => 128, :default => "",    :null => false
    t.string   "password_salt",                       :default => "",    :null => false
    t.string   "reset_password_token"
    t.string   "remember_token"
    t.datetime "remember_created_at"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "user_name",                           :default => "",    :null => false
    t.boolean  "active",                              :default => false, :null => false
    t.string   "ace_theme"
  end

  add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token", :unique => true
  add_index "users", ["user_name"], :name => "index_users_on_user_name", :unique => true

end
