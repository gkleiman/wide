class ProjectsController < ApplicationController
  respond_to  :json

  before_filter :authenticate_user!
  before_filter :load_project, :except => :new
  before_filter lambda { @path = extract_path_from_param(:path) },
    :only => [ :list_dir, :read_file, :save_file, :create_file,
      :create_directory, :remove_file ]

  around_filter :json_failable_action, :only => [ :save_file, :create_file,
    :create_directory, :remove_file, :move_file ]

  def show
    raise ActiveRecord::RecordNotFound unless @project
  end

  def list_dir
    entries = @project.repository.directory_entries(@path)

    if @path == '/'
      # Initial loading of the tree
      entries = wrap_in_fake_root entries
    end

    render :json => entries
  end

  def read_file
    render :text => @project.repository.file_contents(@path)
  end

  def save_file
    @project.repository.save_file(@path, params[:content])

    render :json => { :success => 1 }
  end

  def create_file
    @project.repository.create_file(@path)

    render :json => { :success => 1 }
  end

  def create_directory
    @project.repository.make_dir(@path)

    render :json => { :success => 1 }
  end

  def remove_file
    @project.repository.remove_file(@path)

    render :json => { :success => 1 }
  end

  def move_file
    src_path = extract_path_from_param :src_path
    dest_path = extract_path_from_param :dest_path

    @project.repository.move_file src_path, dest_path

    render :json => { :success => 1 }
  end

  private
  def load_project
    @project = current_user.projects.find_by_name params[:id]
  end

  def extract_path_from_param(param_name)
    params[param_name] ||= '-1'
    if params[param_name] == '-1'
      # Initial loading of the tree
      path = '/'
    end

    path = File.join(params[param_name].split('/')) unless path == '/'

    path
  end

  def wrap_in_fake_root(entries)
    {
      :attr => {
        :rel => 'root',
        :class => 'root'
      },
      :data => '/',
      :type => 'root',
      :state => 'open',
      :children => entries
    }
  end

  def json_failable_action
    begin
      yield
    rescue Exception => exception
      logger.error(exception.inspect + "\n" + exception.backtrace[0..5].join("\n"))
      render :json => { :success => 0 }
    end
  end
end
