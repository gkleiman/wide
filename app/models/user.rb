class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable, :lockable and :timeoutable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Ugly hack to make the user inactive after sign up
  before_validation(:on => :create) do
    @active_was = self.active
    self.active = true
  end
  after_validation(:on => :create) do
    self.active = @active_was || false
  end

  validates_presence_of :user_name
  validates_format_of :user_name,
    :with => /\A[\w_-]+[\w._-]*\z/,
    :allow_blank => true,
    :message => "can only contain letters, numbers and the following " +
    "characters: '.', '_' and '-'. And it can't start with a dot."
  validates_uniqueness_of :user_name,
    :allow_blank => true,
    :case_sensitive => false

  has_many :projects, :dependent => :destroy
  has_many :project_collaborators, :dependent => :destroy
  has_many :third_party_projects, :through => :project_collaborators,
    :source => :project

  attr_accessible_on_create :user_name
  attr_accessible :email, :password, :password_confirmation, :remember_me,
    :current_password, :ace_theme

  before_save :set_default_ace_theme, :on => :create
  after_create :send_signup_email_to_admins
  after_save :send_activated_email

  def to_label
    "#{user_name} <#{email}>"
  end

  def active?
    super && active
  end

  def self.active
    where('active = ?', true)
  end

  # Make user name case insensitive for login
  def self.find_for_database_authentication(conditions = {})
    self.where("LOWER(user_name) = LOWER(?)", conditions[:user_name]).first ||
      super
  end

  private
  def set_default_ace_theme
    self.ace_theme ||= Settings.default_ace_theme
  end

  def send_activated_email
    if active_was == false && active == true
      Notifications.delay.activated(self)
    end
  end

  def send_signup_email_to_admins
    AdminUser.find_all_by_status(true).each do |admin|
      Notifications.delay.new_signup(admin, self)
    end
  end
end
