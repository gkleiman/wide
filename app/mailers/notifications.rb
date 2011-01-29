class Notifications < ActionMailer::Base
  default :from => Settings.email_address

  def activated(user)
    @user = user

    mail(:to => user.email,
         :subject => 'Your wIDE user has been activated!')
  end

  def new_signup(admin, user)
    @admin = admin
    @user = user

    @url = url_for(
      :host => Settings.web_server_host,
      :controller => '/admin/users',
      :action => 'edit',
      :id => user.id)

    mail(:to => admin.email,
         :subject => 'A new user has signed up for wIDE and needs to be activated')
  end
end
