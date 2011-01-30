class Admin::UsersController < Admin::ResourcesController
  def update
    params[@object_name].delete(:password) if params[@object_name][:password].blank?
    params[@object_name].delete(:password_confirmation) if params[@object_name][:password_confirmation].blank?

    @item.update_attribute(:active, params[@object_name][:active].to_i == 1)

    respond_to do |format|
      if @item.update_attributes(params[@object_name])
        set_attributes_on_update
        reload_locales
        format.html { redirect_on_success }
        format.json { render :json => @item }
      else
        format.html { render :edit }
        format.json { render :json => @item.errors.full_messages }
      end
    end
  end
end
