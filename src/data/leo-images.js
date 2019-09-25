export default {
  Default: { // TODO: these names will include some installed packages
    version: 'FINAL',
    updated: '2019-08-26',
    packages: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-base-0.0.1-python-packages.txt', // TODO: not the real URL
    image: 'us.gcr.io/broad-dsp-gcr-public/leonardo-jupyter:5c51ce6935da'
  },
  Bioconductor: {
    version: '0.0.2',
    updated: '2019-09-06',
    packages: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-bioconductor-0.0.2-python-packages.txt',
    image: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-bioconductor:0.0.2'
  }
}
