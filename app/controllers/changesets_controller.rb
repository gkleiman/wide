class ChangesetsController < ApplicationController
  before_filter :load_repository

  def index
    @changesets = @repository.changesets.paginate(:per_page => 10, :page => params[:page])
  end

  def show
    @changeset = @repository.changesets.find_by_revision(params[:id])

    @status = @changeset.changes.inject({}) do |hash, change|
      hash[@repository.full_path(change.path)] = case change.action
                          when 'M' then :modified
                          when 'R' then :removed
                          when 'A' then :added
                          end
      hash
    end

    @diffstat = @repository.diff_stat(params[:id])
  end

  private
  def load_repository
    @project = current_user.projects.find_by_name params[:project_id]
    @repository = @project.try(:repository)

    raise ActiveRecord::RecordNotFound unless @repository.present?
  end
end
