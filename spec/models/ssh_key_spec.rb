require 'spec_helper'

describe SshKey do
  subject { Factory.build(:ssh_key) }

  it { should accept_values_for(:content, '1234abc+/= ') }
  it { should_not accept_values_for(:content, '1234a!bc+/') }
end
