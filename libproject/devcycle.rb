require_relative "common/common"

def dev_up(*args)
  unless Dir.exist?("node_modules")
    Common.new.error "Missing node_modules. Run `npm install` to install project dependencies."
    exit 1
  end
  Common.new.run_inline_swallowing_interrupt %W{npm start}
end

Common.register_command({
  :invocation => "dev-up",
  :description => "Starts the development environment.",
  :fn => :dev_up
})
