class RepositoriesController < ApplicationController
  respond_to  :json

  before_filter :authenticate_user!
  before_filter :load_repository

  around_filter :json_failable_action, :only => [ :summary, :commit, :pull,
    :async_op_status ]

  def summary
    render_success({ :summary => @repository.summary })
  end

  def commit
    params[:files] ||= []

    raise "Can't commit no files" if params[:files].empty?

    @repository.commit(current_user, params[:message], params[:files])

    render_success
  end

  def revert
    params[:files] ||= []

    raise "Can't revert no files" if params[:files].empty?

    @repository.revert!(params[:files])

    render_success
  end

  def update
    @repository.update!(params[:revision])

    flash[:notice] = "Repository updated to revision #{params[:revision]}"

    redirect_to @project
  end

  def diffstat
    @status = @repository.status
    @diffstat = @repository.diff_stat

    render :layout => false
  end

  def pull
    op_status = @repository.pull(params[:url])

    render_success({ :async_op_status => op_status })
  end

  def async_op_status
    render_success({ :async_op_status => @repository.async_op_status })
  end
end
