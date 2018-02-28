require_relative "common/common"

def build_image(*args)
  Common.new.run_inline %W{docker build . -t gcr.io/bvdp-saturn-dev/ui}
end

Common.register_command({
  :invocation => "build-circle-image",
  :description => "Builds the docker image used by CircleCI.",
  :fn => :build_image
})

def push_image(*args)
  Common.new.run_inline %W{gcloud docker -- push gcr.io/bvdp-saturn-dev/ui}
end

Common.register_command({
  :invocation => "push-circle-image",
  :description => "Pushes the CircleCI image to Google Container Registry.",
  :fn => :push_image
})
