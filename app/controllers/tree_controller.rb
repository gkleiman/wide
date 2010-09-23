class TreeController < ApplicationController
  respond_to  :json

  before_filter :extract_path, :only => [ :children, :edit, :update ]

  def children
    directory = Directory.new(@path)

    respond_with directory
  end

  def edit
    @file_content = DirectoryEntry.new(@path).get_content

    render :text => @file_content
  end

  def update
    @file_content = DirectoryEntry.new(@path).update_content(params[:content])

    render :text => "File saved."
  end

  private
  def extract_path
    if !params[:path] || %w(1 0 -1 /).include?(params[:path])
      @path = '/'
    else
      @path = File.join(params[:path].split('/'))
    end
  end
end
