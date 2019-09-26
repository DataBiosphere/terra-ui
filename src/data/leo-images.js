export default {
  Default: { // TODO: these names will include some installed packages
    version: 'FINAL',
    updated: '2019-08-26',
    packages: {
      python: 'https://storage.googleapis.com/terra-docker-image-documentation/leonardo-jupyter-dev-python-packages.txt',
      r: 'https://storage.googleapis.com/terra-docker-image-documentation/leonardo-jupyter-dev-r-packages.txt'
    },
    image: 'us.gcr.io/broad-dsp-gcr-public/leonardo-jupyter:5c51ce6935da'
  },
  Bioconductor: {
    version: '0.0.2',
    updated: '2019-09-06',
    packages: {
      python: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-bioconductor-0.0.2-python-packages.txt',
      r: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-bioconductor-0.0.2-r-packages.txt'
    },
    image: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-bioconductor:0.0.2'
  }
}
