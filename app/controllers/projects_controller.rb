class ProjectsController < ApplicationController
  respond_to  :json

  before_filter :authenticate_user!
  before_filter :load_project, :except => [ :new, :create, :index ]

  def index
    @projects = current_user.projects.all(:include => :repository)
  end

  def new
    @project = current_user.projects.new
  end

  def create
    @project = current_user.projects.new(params[:project])

    if(@project.save)
      redirect_to projects_path, :notice => 'Project was sucessfully created.'
    else
      render :action => 'new'
    end
  end

  def show
  end

  def compile
    compile_status = @project.compile

    render :json => { :success => 1, :compile_status => compile_status }
  end

  def compiler_output
    render :json => { :success => 1, :compile_status => @project.compiler_output }
  end

  def destroy
    @project.destroy

    redirect_to projects_path
  end

  private
  def load_project
    @project = current_user.projects.find_by_name params[:id]

    raise ActiveRecord::RecordNotFound unless @project
  end

end
