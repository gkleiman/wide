class RepositoriesController < ApplicationController
  respond_to  :json

  before_filter :authenticate_user!
  before_filter :load_repository
  before_filter lambda { @path = extract_path_from_param(:path) },
    :only => [ :ls, :cat, :save_file, :create_file, :create_directory, :rm,
      :add, :forget, :mark_resolved, :mark_unresolved, :diff ]

  around_filter :json_failable_action,
    :only => [ :save_file, :create_file, :create_directory, :rm, :mv, :summary,
      :commit, :add, :forget, :revert, :mark_resolved, :mark_unresolved, :pull,
      :async_op_status ]

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

  def diff
    render :layout => false
  end

  def save_file
    @repository.save_file(@path, params[:content])

    render_success
  end

  def create_file
    @repository.create_file(@path)

    render_success
  end

  def create_directory
    @repository.make_dir(@path)

    render_success
  end

  def rm
    @repository.remove_file(@path)

    render_success
  end

  def add
    @repository.add(@path)

    render_success
  end

  def forget
    @repository.forget(@path)

    render_success
  end

  def revert
    params[:files] ||= []
    params[:path] ||= ''

    raise "Can't revert no files" if params[:files].empty? && params[:path].blank?

    # If only one path is specified
    unless params[:path].blank?
      if params[:path] != '/'
        files = File.join(params[:path].split('/')).to_a
      else
        files = %w(/)
      end
    end

    # If more than just one path is specified
    files ||= params[:files]

    @repository.revert!(files)

    render_success
  end

  def mv
    src_path = extract_path_from_param :src_path
    dest_path = extract_path_from_param :dest_path

    @repository.move_file src_path, dest_path

    render_success
  end

  def summary
    render :json  => { :success => 1, :summary => @repository.summary }
  end

  def commit
    params[:files] ||= []

    raise "Can't commit no files" if params[:files].empty?

    @repository.commit(current_user.email, params[:message], params[:files])

    render_success
  end

  def status
    @repository.update_entries_status

    @status = @repository.entries_status
    @diffstat = @repository.diff_stat

    render :status, :layout => false
  end

  def mark_resolved
    @repository.mark_resolved(@path)

    render_success
  end

  def mark_unresolved
    @repository.mark_unresolved(@path)

    render_success
  end

  def pull
    op_status = @repository.pull(params[:url])

    render_success({ :async_op_status => op_status })
  end

  def async_op_status
    render_success({ :async_op_status => @repository.async_op_status })
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

  def render_success(extra = {})
    result = { :success => 1}
    result.merge!(extra)

    render :json => result
  end
end
