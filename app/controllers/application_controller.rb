class ApplicationController < ActionController::Base
  protect_from_forgery

  helper_method :current_project

  def current_project
    @project ||= current_user.projects.find_by_name(params[:id])
  end
end
