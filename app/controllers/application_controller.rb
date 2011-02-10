class ApplicationController < ActionController::Base
  protect_from_forgery

  helper_method :current_project

  def handle_unverified_request
    super
    cookies.delete 'remember_user_token'
  end

  private
  def current_project
    @project
  end

  def load_repository
    @project = current_user.projects.find_by_name(params[:project_id])

    raise ActiveRecord::RecordNotFound if @project.nil?

    @repository = @project.repository
  end

  def json_failable_action
    begin
      yield
    rescue Exception => exception
      logger.error(exception.inspect + "\n" +
                   exception.backtrace[0..5].join("\n"))
      render :json => { :success => 0 }
    end
  end

  def render_success(extra = {})
    result = { :success => 1}
    result.merge!(extra)

    render :json => result
  end
end
