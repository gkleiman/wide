class RepositoriesController < ApplicationController
  respond_to  :json

  before_filter :authenticate_user!
  before_filter :load_repository
  before_filter lambda { @path = extract_path_from_param(:path) },
    :only => [ :ls, :cat, :save_file, :create_file,
      :create_directory, :rm, :add, :forget, :revert ]

  around_filter :json_failable_action, :only => [ :save_file, :create_file,
    :create_directory, :rm, :mv, :is_clean, :commit, :add, :forget, :revert ]

  def ls
    entries = @repository.directory_entries(@path)

    if @path == '/'
      # Initial loading of the tree
      entries = wrap_in_fake_root entries
    end

    render :json => entries
  end

  def cat
    render :text => @repository.file_contents(@path)
  end

  def save_file
    @repository.save_file(@path, params[:content])

    render :json => { :success => 1 }
  end

  def create_file
    @repository.create_file(@path)

    render :json => { :success => 1 }
  end

  def create_directory
    @repository.make_dir(@path)

    render :json => { :success => 1 }
  end

  def rm
    @repository.remove_file(@path)

    render :json => { :success => 1 }
  end

  def add
    @repository.add(@path)

    render :json => { :success => 1 }
  end

  def forget
    @repository.forget(@path)

    render :json => { :success => 1 }
  end

  def revert
    @repository.revert!(@path)

    render :json => { :success => 1 }
  end

  def mv
    src_path = extract_path_from_param :src_path
    dest_path = extract_path_from_param :dest_path

    @repository.move_file src_path, dest_path

    render :json => { :success => 1 }
  end

  def is_clean
    render :json  => { :success => 1, :clean => @repository.clean? }
  end

  def commit
    @repository.commit(current_user.email, params[:message])

    render :json => { :success => 1 }
  end

  def status
    @repository.update_entries_status

    message = "<pre>#{@repository.entries_status.to_s}</pre>"
    render :text => message
  end

  private
  def load_repository
    @project = current_user.projects.find_by_name params[:project_id]
    @repository = @project.repository
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
        :id => 'root_node',
        :class => 'root'
      },
      :data => '/',
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
