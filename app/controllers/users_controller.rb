class UsersController < ApplicationController
  respond_to :json

  before_filter :authenticate_user!

  def index
    search_term = "%#{params[:q]}%"
    users = User.where('LOWER(user_name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?)', search_term, search_term).
      where('id <> ?', current_user.id)

    result = users.map { |user| { :name => "#{user.user_name} <#{user.email}>", :id => user.id } }

    respond_with result
  end
end
