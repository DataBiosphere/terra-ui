export const leoImages = [
  {
    label: 'Default (Python 3.6.8, R 3.5.2, Hail 0.2.11)',
    version: 'FINAL',
    updated: '2019-08-26',
    packages: {
      python: 'https://storage.googleapis.com/terra-docker-image-documentation/leonardo-jupyter-dev-python-packages.txt',
      r: 'https://storage.googleapis.com/terra-docker-image-documentation/leonardo-jupyter-dev-r-packages.txt',
      tools: 'https://storage.googleapis.com/terra-docker-image-documentation/leonardo-jupyter-dev-system-packages.txt'
    },
    image: 'us.gcr.io/broad-dsp-gcr-public/leonardo-jupyter:5c51ce6935da'
  },
  {
    label: 'Bioconductor (R 3.6.1, Bioconductor 3.9, Tidyverse 1.2.1)',
    version: '0.0.3',
    updated: '2019-10-25',
    packages: {
      python: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-bioconductor-0.0.3-python-packages.txt',
      r: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-bioconductor-0.0.3-r-packages.txt'
    },
    image: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-bioconductor:0.0.3'
  }
]

// distilled from https://github.com/docker/distribution/blob/95daa793b83a21656fe6c13e6d5cf1c3999108c7/reference/regexp.go
export const imageValidationRegexp = /^[A-Za-z0-9]+[\w./-]+(?::\w[\w.-]+)?(?:@[\w+.-]+:[A-Fa-f0-9]{32,})?$/
