class ProjectsController < ApplicationController
  respond_to  :json

  before_filter :authenticate_user!
  before_filter :load_project, :except => [ :new, :create, :index ]

  def show
    raise ActiveRecord::RecordNotFound unless @project
  end

  private
  def load_project
    @project = current_user.projects.find_by_name params[:id]
  end

end
