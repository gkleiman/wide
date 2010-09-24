class ProjectsController < ApplicationController
  respond_to  :json

  before_filter :authenticate_user!
  before_filter :load_project, :except => :new
  before_filter :extract_path, :only => [ :list_dir, :read_file, :save_file ]

  def show
  end

  def list_dir
    entries = @project.repository.directory_entries(@path)

    respond_with entries
  end

  def read_file
    render :text => @project.repository.file_contents(@path)
  end

  def save_file
    @project.repository.save_file(@path, params[:content])

    render :text => "File saved."
  end

  private
  def load_project
    @project = current_user.projects.find_by_name params[:id]
  end

  def extract_path
    if !params[:path] || %w(1 0 -1 /).include?(params[:path])
      @path = '/'
    else
      @path = File.join(params[:path].split('/'))
    end
  end
end
