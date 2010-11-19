require 'spec_helper'

describe User do
  before(:each) do
    @user = Factory.build(:user)
  end

  it "should accept valid values for user_name" do
   @user.should accept_values_for(:user_name, 'test', 'test1', 'test1-',
                                  'test1_')
  end

  it "should not accept invalid values for user_name" do
    @user.should_not accept_values_for(:user_name, 'test!', 'test ', '.test',
                                       '..test', '/test')
  end
end
