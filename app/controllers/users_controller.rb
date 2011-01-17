class UsersController < ApplicationController
  respond_to :json

  before_filter :authenticate_user!

  def index
    users = User.where('LOWER(user_name) LIKE LOWER(?)', "%#{params[:q]}%").
      where('id <> ?', current_user.id)

    result = users.map { |user| { :name => user.user_name, :id => user.id } }

    respond_with result
  end
end
