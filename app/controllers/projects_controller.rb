class ProjectsController < ApplicationController
  respond_to  :json

  before_filter :authenticate_user!
  before_filter :load_project, :except => [ :new, :create, :index ]

  def index
    @projects = current_user.projects.all(:include => :repository)
    @third_party_projects = current_user.third_party_projects
  end

  def new
    @project = current_user.projects.build

    if(parent_project)
      @project.name = parent_project.name
      @project.project_type_id = parent_project.project_type_id
    else
      @project = current_user.projects.new(params[:project])
      @project.build_repository(:url => params[:parent_repository_url])
    end
  end

  def create
    @project = current_user.projects.new(params[:project])

    if(parent_project)
      @project.build_repository(:parent_repository => parent_project.repository)
    end

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
    send_data(@project.makefile, :filename => 'Makefile')
  end

  private
  def load_project
    @project ||= current_user.projects.find_by_name(params[:id])

    raise ActiveRecord::RecordNotFound unless @project

    @project
  end

  def parent_project
    if(params[:parent_project_id] && @parent_project.blank?)
      @parent_project ||= current_user.projects.find_by_id(params[:parent_project_id].to_s)
      @parent_project ||= current_user.third_party_projects.find_by_id(params[:parent_project_id].to_s)

      raise ActiveRecord::RecordNotFound unless @parent_project
    end

    @parent_project
  end
end
