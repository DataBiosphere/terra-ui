require_relative "common/common"

def dev_up(*args)
  Common.new.run_inline_swallowing_interrupt %W{npm start}
end

Common.register_command({
  :invocation => "dev-up",
  :description => "Starts the development environment.",
  :fn => :dev_up
})
