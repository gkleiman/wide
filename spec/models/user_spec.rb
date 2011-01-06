require 'spec_helper'

describe User do
  before(:each) do
    @user = Factory.build(:user)
  end

  it "should accept valid values for user_name" do
   @user.should accept_values_for(:user_name, 'test', 'test1', 'test1_-', 'foo.bar')
  end

  it "should not accept invalid values for user_name" do
    @user.should_not accept_values_for(:user_name, 'test!', 'test ', 'test/',
                                       '/test', '.', '..', '../hey', '.hola',
                                       nil)
  end

  it "should not be possible to modify the user name after the user has been created" do
    @user.save

    @user.update_attributes(:user_name => "lalala")

    @user.user_name.should_not == "lalala"
  end

  it "should validate that the user name is unique" do
    @user.save

    Factory.build(:user, :user_name => @user.user_name).valid?.should == false
  end

  it "should not be case sensitive when validating the uniqueness of the user name" do
    @user.save

    user1 = Factory.build(:user, :user_name => @user.user_name.upcase)

    user1.should_not be_valid
  end
end
