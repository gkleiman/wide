require 'spec_helper'

describe Wide::CompilerOutputParser do
  it 'should correctly parse gcc output with info, warning and error lines' do
    result = Wide::CompilerOutputParser.parse_file(Rails.root.join('spec', 'fixtures', 'compiler_output'))

    result[0].should == Wide::CompilerOutput.new(:type => 'info', :resource => 'prueba.c', :description => 'In function "main":')
    result[1].should == Wide::CompilerOutput.new(:type => 'warning', :resource => 'prueba.c', :description => 'missing terminating " character', :line => 6)
    result[2].should == Wide::CompilerOutput.new(:type => 'error', :resource => 'prueba.c', :description => 'missing terminating " character', :line => 6)
    result[3].should == Wide::CompilerOutput.new(:type => 'error', :resource => 'prueba.c', :description => 'expected expression before "}" token', :line => 7)
    result[4].should == Wide::CompilerOutput.new(:type => 'error', :resource => 'prueba.c', :description => 'expected ";" before "}" token', :line => 7)
  end
end
