#!/usr/bin/env ruby

PROJECT_SCRIPTS_DIR = "libproject"

unless Dir.exists? "#{PROJECT_SCRIPTS_DIR}/common"
  unless system(*%W{git submodule update --init #{PROJECT_SCRIPTS_DIR}/common})
    STDERR.puts "git submodule update failed."
    exit 1
  end
end

require_relative "#{PROJECT_SCRIPTS_DIR}/common/common"
Dir.foreach(PROJECT_SCRIPTS_DIR) do |item|
  unless item =~ /^\.\.?$/ || item == "common"
    require_relative "#{PROJECT_SCRIPTS_DIR}/#{item}"
  end
end

# Uncomment this line if using these tools as a submodule instead of a clone.
Common.unregister_upgrade_self_command

Common.new.handle_or_die(ARGV)
