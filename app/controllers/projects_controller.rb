class ProjectsController < ApplicationController
  respond_to  :json

  before_filter :authenticate_user!
  before_filter :load_project, :except => [ :new, :create, :index ]

  def index
    @projects = current_user.projects.all(:include => :repository)
  end

  def new
    @project = current_user.projects.new

    @project.build_repository
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

  def edit
  end

  def update
    params[:project][:collaborator_ids] ||= []
    params[:project][:collaborator_ids] = params[:project][:collaborator_ids].split(',')

    if @project.update_attributes(params[:project])
      flash[:notice] = 'The project was successfully updated.'
      redirect_to :back
    else
      render :action => "edit"
    end
  end

  def compile
    render :json => { :success => 1, :compile_status => @project.compile }
  end

  def compiler_output
    render :json => { :success => 1, :compile_status => @project.compiler_output }
  end

  def destroy
    @project.destroy

    redirect_to projects_path
  end

  def binary
    raise ActiveRecord::RecordNotFound unless @project.compiler_output[:status] == 'success'

    filename = @project.name

    # Add the project type extension
    filename << ".#{@project.project_type.binary_extension}" unless @project.project_type.binary_extension.blank?

    send_file("#{@project.bin_path}/binary", :filename => filename)
  end

  def makefile
    @project.write_makefile

    send_file(@project.makefile_path, :filename => 'Makefile')
  end

  private
  def load_project
    @project ||= current_user.projects.find_by_name(params[:id])

    raise ActiveRecord::RecordNotFound unless @project

    @project
  end

end
