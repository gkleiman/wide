require 'spec_helper'

describe Constant do
  before(:each) do
    @constant = Factory.build(:constant)
  end

  it "should accept valid constant names" do
   @constant.should accept_values_for(:name, 'test', 'test1', 'test1_-',
                                      'foo1')
  end

  it "should not accept invalid constant names" do
    @constant.should_not accept_values_for(:name, 'test!', 'test ',
                                           'test/', '/test', '.', '..',
                                           '../hey', '.hola', nil)
  end

  it "should be case sensitive when validating the uniqueness of the constant name" do
    @constant.save

    constant1 = Factory.build(:constant, :name => @constant.name.upcase)

    constant1.should be_valid
  end

  it "should validate that the constant name is unique" do
    @constant.save

    Factory.build(:constant, :name => @constant.name, :project_id => @constant.project_id).valid?.should == false
  end

  it "should accept valid constant values" do
    @constant.should accept_values_for(:value, 'test', 'test1',
                                       '"test1_-,."', 'foo1', nil)
  end

  it "should not accept invalid constant values" do
    @constant.should_not accept_values_for(:value, 'test!', 'test ')
  end
end
