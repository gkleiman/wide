class EntriesController < ApplicationController
  respond_to  :json, :html

  before_filter :authenticate_user!
  before_filter :load_repository

  around_filter :json_failable_action,
    :only => [ :create, :update, :destroy, :mv, :add, :forget, :revert,
      :mark_resolved, :mark_unresolved ]

  helper_method :path

  def index
    entries = @repository.directory_entries('/')

    # Initial loading of the tree
    entries = wrap_in_fake_root(entries) if params[:initial_load]

    render :json => entries
  end

  def show
    entry = @repository.directory_entry(path)

    if entry.directory?
      entries = @repository.directory_entries(path)

      render :json => entries
    else
      render :text => entry.get_content
    end
  end

  def create
    if params[:type] == 'file'
      @repository.create_file(path)
    elsif params[:type] == 'directory'
      @repository.make_dir(path)
    end

    render_success
  end

  def destroy
    @repository.remove_file(path)

    render_success
  end

  def changesets
    @changesets = @repository.changesets_for_entry(path).paginate(:per_page => 10, :page => params[:page])
  end

  def diff
    @diff_text = @repository.diff(path)

    render :layout => false
  end

  def update
    @repository.save_file(path, params[:content])

    render_success
  end

  def mark_resolved
    @repository.mark_resolved(path)

    render_success
  end

  def mark_unresolved
    @repository.mark_unresolved(path)

    render_success
  end

  def add
    @repository.add(path)

    render_success
  end

  def forget
    @repository.forget(path)

    render_success
  end

  def revert
    @repository.revert!(path, params[:revision])

    respond_to do |format|
      format.html { redirect_to project_path(@project) }
      format.json { render_success }
    end
  end

  def mv
    dest_path = extract_path_from_param(:dest_path)

    @repository.move_file(path, dest_path)

    render_success
  end

  private
  def path
    @path = extract_path_from_param(:id)
    @path ||= extract_path_from_param(:path)
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

  def extract_path_from_param(param_name)
    if params[param_name] == '/'
      path = '/'
    elsif !params[param_name].nil?
      path = File.join(params[param_name].split('/'))
    else
      path = nil
    end

    path
  end
end
