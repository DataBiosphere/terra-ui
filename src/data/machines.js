export const machineTypes = [
  { name: 'n1-standard-1', cpu: 1, memory: 3.75 },
  { name: 'n1-standard-2', cpu: 2, memory: 7.50 },
  { name: 'n1-standard-4', cpu: 4, memory: 15 },
  { name: 'n1-standard-8', cpu: 8, memory: 30 },
  { name: 'n1-standard-16', cpu: 16, memory: 60 },
  { name: 'n1-standard-32', cpu: 32, memory: 120 },
  { name: 'n1-standard-64', cpu: 64, memory: 240 },
  { name: 'n1-standard-96', cpu: 96, memory: 360 },
  { name: 'n1-highmem-2', cpu: 2, memory: 13 },
  { name: 'n1-highmem-4', cpu: 4, memory: 26 },
  { name: 'n1-highmem-8', cpu: 8, memory: 52 },
  { name: 'n1-highmem-16', cpu: 16, memory: 104 },
  { name: 'n1-highmem-32', cpu: 32, memory: 208 },
  { name: 'n1-highmem-64', cpu: 64, memory: 416 },
  { name: 'n1-highmem-96', cpu: 96, memory: 624 },
  { name: 'n1-highcpu-2', cpu: 2, memory: 1.8 },
  { name: 'n1-highcpu-4', cpu: 4, memory: 3.6 },
  { name: 'n1-highcpu-8', cpu: 8, memory: 7.2 },
  { name: 'n1-highcpu-16', cpu: 16, memory: 14.4 },
  { name: 'n1-highcpu-32', cpu: 32, memory: 28.8 },
  { name: 'n1-highcpu-64', cpu: 64, memory: 57.6 },
  { name: 'n1-highcpu-96', cpu: 96, memory: 86.4 }
]

// As of June 21, 2021:
// GPUs are only supported with general-purpose N1 or accelerator-optimized A2 machine types.
// (https://cloud.google.com/compute/docs/gpus#restrictions)
// Instances with GPUs also have limitations on maximum number of CPUs and memory they can have.
// (https://cloud.google.com/compute/docs/gpus#other_available_nvidia_gpu_models)
// NVIDIA Tesla P100 is not available within the zone 'us-central1-a`.
// (https://cloud.google.com/compute/docs/gpus/gpu-regions-zones)
// The limitations don't vary perfectly linearly so it seemed easier and less brittle to enumerate them.
export const gpuTypes = [
  { name: 'NVIDIA Tesla T4', type: 'nvidia-tesla-t4', numGpus: 1, maxNumCpus: 24, maxMem: 156 },
  { name: 'NVIDIA Tesla T4', type: 'nvidia-tesla-t4', numGpus: 2, maxNumCpus: 48, maxMem: 312 },
  { name: 'NVIDIA Tesla T4', type: 'nvidia-tesla-t4', numGpus: 4, maxNumCpus: 96, maxMem: 624 },
  { name: 'NVIDIA Tesla K80', type: 'nvidia-tesla-k80', numGpus: 1, maxNumCpus: 8, maxMem: 52 },
  { name: 'NVIDIA Tesla K80', type: 'nvidia-tesla-k80', numGpus: 2, maxNumCpus: 16, maxMem: 104 },
  { name: 'NVIDIA Tesla K80', type: 'nvidia-tesla-k80', numGpus: 4, maxNumCpus: 32, maxMem: 208 },
  { name: 'NVIDIA Tesla K80', type: 'nvidia-tesla-k80', numGpus: 8, maxNumCpus: 64, maxMem: 208 },
  { name: 'NVIDIA Tesla P4', type: 'nvidia-tesla-p4', numGpus: 1, maxNumCpus: 24, maxMem: 156 },
  { name: 'NVIDIA Tesla P4', type: 'nvidia-tesla-p4', numGpus: 2, maxNumCpus: 48, maxMem: 312 },
  { name: 'NVIDIA Tesla P4', type: 'nvidia-tesla-p4', numGpus: 4, maxNumCpus: 96, maxMem: 624 },
  { name: 'NVIDIA Tesla V100', type: 'nvidia-tesla-v100', numGpus: 1, maxNumCpus: 12, maxMem: 78 },
  { name: 'NVIDIA Tesla V100', type: 'nvidia-tesla-v100', numGpus: 2, maxNumCpus: 24, maxMem: 156 },
  { name: 'NVIDIA Tesla V100', type: 'nvidia-tesla-v100', numGpus: 4, maxNumCpus: 48, maxMem: 312 },
  { name: 'NVIDIA Tesla V100', type: 'nvidia-tesla-v100', numGpus: 8, maxNumCpus: 96, maxMem: 624 },
  { name: 'NVIDIA Tesla P100', type: 'nvidia-tesla-p100', numGpus: 1, maxNumCpus: 16, maxMem: 104 },
  { name: 'NVIDIA Tesla P100', type: 'nvidia-tesla-p100', numGpus: 2, maxNumCpus: 32, maxMem: 208 },
  { name: 'NVIDIA Tesla P100', type: 'nvidia-tesla-p100', numGpus: 4, maxNumCpus: 96, maxMem: 624 }
]

export const zonesToGpus = [
  { name: 'ASIA-EAST1-A', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-p100', 'nvidia-tesla-k80'] },
  { name: 'ASIA-EAST1-B', validTypes: ['nvidia-tesla-k80'] },
  { name: 'ASIA-EAST1-C', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-v100', 'nvidia-tesla-p100'] },
  { name: 'ASIA-EAST2-A', validTypes: [] },
  { name: 'ASIA-EAST2-B', validTypes: [] },
  { name: 'ASIA-EAST2-C', validTypes: [] },
  { name: 'ASIA-NORTHEAST1-A', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-NORTHEAST1-B', validTypes: [] },
  { name: 'ASIA-NORTHEAST1-C', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-NORTHEAST2-A', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-NORTHEAST2-B', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-NORTHEAST2-C', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-NORTHEAST3-A', validTypes: [] },
  { name: 'ASIA-NORTHEAST3-B', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-NORTHEAST3-C', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-SOUTH1-A', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-SOUTH1-B', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-SOUTH1-C', validTypes: [] },
  { name: 'ASIA-SOUTHEAST1-A', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-SOUTHEAST1-B', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-p4'] },
  { name: 'ASIA-SOUTHEAST1-C', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-p4'] },
  { name: 'ASIA-SOUTHEAST2-A', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-SOUTHEAST2-B', validTypes: ['nvidia-tesla-t4'] },
  { name: 'ASIA-SOUTHEAST2-C', validTypes: [] },
  { name: 'AUSTRALIA-SOUTHEAST1-A', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-p4'] },
  { name: 'AUSTRALIA-SOUTHEAST1-B', validTypes: ['nvidia-tesla-p4'] },
  { name: 'AUSTRALIA-SOUTHEAST1-C', validTypes: ['nvidia-tesla-p100'] },
  { name: 'EUROPE-NORTH1-A', validTypes: [] },
  { name: 'EUROPE-NORTH1-B', validTypes: [] },
  { name: 'EUROPE-NORTH1-C', validTypes: [] },
  { name: 'EUROPE-WEST1-B', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-p100', 'nvidia-tesla-k80'] },
  { name: 'EUROPE-WEST1-C', validTypes: ['nvidia-tesla-t4'] },
  { name: 'EUROPE-WEST1-D', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-p100', 'nvidia-tesla-k80'] },
  { name: 'EUROPE-WEST2-A', validTypes: ['nvidia-tesla-t4'] },
  { name: 'EUROPE-WEST2-B', validTypes: ['nvidia-tesla-t4'] },
  { name: 'EUROPE-WEST2-C', validTypes: [] },
  { name: 'EUROPE-WEST3-A', validTypes: [] },
  { name: 'EUROPE-WEST3-B', validTypes: ['nvidia-tesla-t4'] },
  { name: 'EUROPE-WEST3-C', validTypes: [] },
  { name: 'EUROPE-WEST4-A', validTypes: ['nvidia-tesla-v100', 'nvidia-tesla-p100'] },
  { name: 'EUROPE-WEST4-B', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-v100', 'nvidia-tesla-p4'] },
  { name: 'EUROPE-WEST4-C', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-v100', 'nvidia-tesla-p4'] },
  { name: 'EUROPE-WEST6-A', validTypes: [] },
  { name: 'EUROPE-WEST6-B', validTypes: [] },
  { name: 'EUROPE-WEST6-C', validTypes: [] },
  { name: 'NORTHAMERICA-NORTHEAST1-A', validTypes: ['nvidia-tesla-p4'] },
  { name: 'NORTHAMERICA-NORTHEAST1-B', validTypes: ['nvidia-tesla-p4'] },
  { name: 'NORTHAMERICA-NORTHEAST1-C', validTypes: ['nvidia-tesla-p4'] },
  { name: 'SOUTHAMERICA-EAST1-A', validTypes: [] },
  { name: 'SOUTHAMERICA-EAST1-B', validTypes: [] },
  { name: 'SOUTHAMERICA-EAST1-C', validTypes: ['nvidia-tesla-t4'] },
  { name: 'US-CENTRAL1-A', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-v100', 'nvidia-tesla-p4', 'nvidia-tesla-k80'] },
  { name: 'US-CENTRAL1-B', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-v100'] },
  { name: 'US-CENTRAL1-C', validTypes: ['nvidia-tesla-v100', 'nvidia-tesla-p100', 'nvidia-tesla-p4', 'nvidia-tesla-k80'] },
  { name: 'US-CENTRAL1-F', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-v100', 'nvidia-tesla-p100'] },
  { name: 'US-EAST1-B', validTypes: ['nvidia-tesla-p100'] },
  { name: 'US-EAST1-C', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-v100', 'nvidia-tesla-p100', 'nvidia-tesla-k80'] },
  { name: 'US-EAST1-D', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-k80'] },
  { name: 'US-EAST4-A', validTypes: ['nvidia-tesla-p4'] },
  { name: 'US-EAST4-B', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-p4'] },
  { name: 'US-EAST4-C', validTypes: ['nvidia-tesla-p4'] },
  { name: 'US-WEST1-A', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-v100', 'nvidia-tesla-p100'] },
  { name: 'US-WEST1-B', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-v100', 'nvidia-tesla-p100', 'nvidia-tesla-k80'] },
  { name: 'US-WEST1-C', validTypes: [] },
  { name: 'US-WEST2-A', validTypes: [] },
  { name: 'US-WEST2-B', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-p4'] },
  { name: 'US-WEST2-C', validTypes: ['nvidia-tesla-t4', 'nvidia-tesla-p4'] },
  { name: 'US-WEST3-A', validTypes: [] },
  { name: 'US-WEST3-B', validTypes: [] },
  { name: 'US-WEST3-C', validTypes: [] },
  { name: 'US-WEST4-A', validTypes: ['nvidia-tesla-t4'] },
  { name: 'US-WEST4-B', validTypes: ['nvidia-tesla-t4'] },
  { name: 'US-WEST4-C', validTypes: [] }
]

export const cloudServices = {
  GCE: 'GCE',
  DATAPROC: 'DATAPROC'
}

export const dataprocCpuPrice = 0.01 // dataproc costs $0.01 per cpu per hour
export const ephemeralExternalIpAddressPrice = { // per hour in dollars for all regions per https://cloud.google.com/vpc/network-pricing#ipaddress
  standard: 0.004,
  preemptible: 0.002
}

// Disk prices below are per GB per https://cloud.google.com/compute/all-pricing#disk
// GPU prices below are hourly and per GPU (https://cloud.google.com/compute/gpus-pricing).
// The data below comes from Google's pricing API: https://cloud.google.com/billing/v1/how-tos/caltalog-api
// There is a script available in https://gist.github.com/wnojopra/be5be3ab7e6a09a351b89085992a940d
// that parses the API and outputs this data.
// TODO: Update the above URL in the comment to the proper script location
export const regionToPrices = [
  {
    name: 'ASIA-EAST1', monthlyDiskPrice: 0.04,
    n1HourlyGBRamPrice: 0.004906, n1HourlyCpuPrice: 0.036602, preemptibleN1HourlyGBRamPrice: 0.000981, preemptibleN1HourlyCpuPrice: 0.00732,
    t4HourlyPrice: 0.35, p4HourlyPrice: NaN, k80HourlyPrice: 0.49, v100HourlyPrice: 2.48, p100HourlyPrice: 1.6,
    preemptibleT4HourlyPrice: 0.069841, preemptibleP4HourlyPrice: NaN, preemptibleK80HourlyPrice: 0.135,
    preemptibleV100HourlyPrice: 0.74, preemptibleP100HourlyPrice: 0.43
  },
  {
    name: 'ASIA-EAST2', monthlyDiskPrice: 0.0498,
    n1HourlyGBRamPrice: 0.005928, n1HourlyCpuPrice: 0.044231, preemptibleN1HourlyGBRamPrice: 0.000597, preemptibleN1HourlyCpuPrice: 0.004433,
    t4HourlyPrice: NaN, p4HourlyPrice: NaN, k80HourlyPrice: NaN, v100HourlyPrice: NaN, p100HourlyPrice: NaN,
    preemptibleT4HourlyPrice: NaN, preemptibleP4HourlyPrice: NaN, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: NaN
  },
  {
    name: 'ASIA-NORTHEAST1', monthlyDiskPrice: 0.052,
    n1HourlyGBRamPrice: 0.005419, n1HourlyCpuPrice: 0.040618, preemptibleN1HourlyGBRamPrice: 0.001178, preemptibleN1HourlyCpuPrice: 0.00883,
    t4HourlyPrice: 0.37, p4HourlyPrice: NaN, k80HourlyPrice: NaN, v100HourlyPrice: NaN, p100HourlyPrice: NaN,
    preemptibleT4HourlyPrice: 0.069841, preemptibleP4HourlyPrice: NaN, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: NaN
  },
  {
    name: 'ASIA-NORTHEAST2', monthlyDiskPrice: 0.052,
    n1HourlyGBRamPrice: 0.005419, n1HourlyCpuPrice: 0.040618, preemptibleN1HourlyGBRamPrice: 0.001178, preemptibleN1HourlyCpuPrice: 0.00883,
    t4HourlyPrice: 0.37, p4HourlyPrice: 0.65, k80HourlyPrice: 0.0, v100HourlyPrice: 0.0, p100HourlyPrice: 1.6,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.216, preemptibleK80HourlyPrice: 0.135,
    preemptibleV100HourlyPrice: 0.74, preemptibleP100HourlyPrice: 0.43
  },
  {
    name: 'ASIA-NORTHEAST3', monthlyDiskPrice: 0.052,
    n1HourlyGBRamPrice: 0.005419, n1HourlyCpuPrice: 0.040618, preemptibleN1HourlyGBRamPrice: 0.001178, preemptibleN1HourlyCpuPrice: 0.00883,
    t4HourlyPrice: 0.37, p4HourlyPrice: 0.65, k80HourlyPrice: 0.0, v100HourlyPrice: 0.0, p100HourlyPrice: 1.6,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.216, preemptibleK80HourlyPrice: 0.135,
    preemptibleV100HourlyPrice: 0.74, preemptibleP100HourlyPrice: 0.43
  },
  {
    name: 'ASIA-SOUTH1', monthlyDiskPrice: 0.048,
    n1HourlyGBRamPrice: 0.005088, n1HourlyCpuPrice: 0.03797, preemptibleN1HourlyGBRamPrice: 0.000892, preemptibleN1HourlyCpuPrice: 0.006655,
    t4HourlyPrice: 0.41, p4HourlyPrice: NaN, k80HourlyPrice: NaN, v100HourlyPrice: NaN, p100HourlyPrice: NaN,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: NaN, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: NaN
  },
  {
    name: 'ASIA-SOUTHEAST1', monthlyDiskPrice: 0.044,
    n1HourlyGBRamPrice: 0.005226, n1HourlyCpuPrice: 0.038999, preemptibleN1HourlyGBRamPrice: 0.00105, preemptibleN1HourlyCpuPrice: 0.0078,
    t4HourlyPrice: 0.37, p4HourlyPrice: 0.65, k80HourlyPrice: NaN, v100HourlyPrice: NaN, p100HourlyPrice: NaN,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.072, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: NaN
  },
  {
    name: 'ASIA-SOUTHEAST2', monthlyDiskPrice: 0.052,
    n1HourlyGBRamPrice: 0.00569634, n1HourlyCpuPrice: 0.04250891, preemptibleN1HourlyGBRamPrice: 0.0011445, preemptibleN1HourlyCpuPrice: 0.008502,
    t4HourlyPrice: 0.4033, p4HourlyPrice: 0.7085, k80HourlyPrice: 0.5559, v100HourlyPrice: 0.0, p100HourlyPrice: 1.744,
    preemptibleT4HourlyPrice: 0.1199, preemptibleP4HourlyPrice: 0.23544, preemptibleK80HourlyPrice: 0.14715,
    preemptibleV100HourlyPrice: 0.8066, preemptibleP100HourlyPrice: 0.4687
  },
  {
    name: 'AUSTRALIA-SOUTHEAST1', monthlyDiskPrice: 0.054,
    n1HourlyGBRamPrice: 0.006011, n1HourlyCpuPrice: 0.044856, preemptibleN1HourlyGBRamPrice: 0.0012, preemptibleN1HourlyCpuPrice: 0.00898,
    t4HourlyPrice: NaN, p4HourlyPrice: 0.65, k80HourlyPrice: NaN, v100HourlyPrice: NaN, p100HourlyPrice: 1.6,
    preemptibleT4HourlyPrice: 0.069841, preemptibleP4HourlyPrice: 0.216, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: 0.43
  },
  {
    name: 'EUROPE-NORTH1', monthlyDiskPrice: 0.044,
    n1HourlyGBRamPrice: 0.004664, n1HourlyCpuPrice: 0.034806, preemptibleN1HourlyGBRamPrice: 0.000981, preemptibleN1HourlyCpuPrice: 0.00732,
    t4HourlyPrice: NaN, p4HourlyPrice: NaN, k80HourlyPrice: NaN, v100HourlyPrice: NaN, p100HourlyPrice: NaN,
    preemptibleT4HourlyPrice: NaN, preemptibleP4HourlyPrice: NaN, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: NaN
  },
  {
    name: 'EUROPE-WEST1', monthlyDiskPrice: 0.04,
    n1HourlyGBRamPrice: 0.004661, n1HourlyCpuPrice: 0.034773, preemptibleN1HourlyGBRamPrice: 0.000981, preemptibleN1HourlyCpuPrice: 0.007321,
    t4HourlyPrice: 0.35, p4HourlyPrice: NaN, k80HourlyPrice: 0.49, v100HourlyPrice: NaN, p100HourlyPrice: 1.6,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: NaN, preemptibleK80HourlyPrice: 0.0375,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: 0.43
  },
  {
    name: 'EUROPE-WEST2', monthlyDiskPrice: 0.048,
    n1HourlyGBRamPrice: 0.005458, n1HourlyCpuPrice: 0.04073, preemptibleN1HourlyGBRamPrice: 0.00109, preemptibleN1HourlyCpuPrice: 0.00815,
    t4HourlyPrice: 0.41, p4HourlyPrice: NaN, k80HourlyPrice: NaN, v100HourlyPrice: NaN, p100HourlyPrice: NaN,
    preemptibleT4HourlyPrice: 0.069841, preemptibleP4HourlyPrice: NaN, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: NaN
  },
  {
    name: 'EUROPE-WEST3', monthlyDiskPrice: 0.048,
    n1HourlyGBRamPrice: 0.005458, n1HourlyCpuPrice: 0.04073, preemptibleN1HourlyGBRamPrice: 0.00109, preemptibleN1HourlyCpuPrice: 0.00815,
    t4HourlyPrice: 0.41, p4HourlyPrice: NaN, k80HourlyPrice: NaN, v100HourlyPrice: NaN, p100HourlyPrice: NaN,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: NaN, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: NaN
  },
  {
    name: 'EUROPE-WEST4', monthlyDiskPrice: 0.044,
    n1HourlyGBRamPrice: 0.004664, n1HourlyCpuPrice: 0.034802, preemptibleN1HourlyGBRamPrice: 0.000987, preemptibleN1HourlyCpuPrice: 0.007325,
    t4HourlyPrice: 0.35, p4HourlyPrice: 0.65, k80HourlyPrice: NaN, v100HourlyPrice: 2.55, p100HourlyPrice: 1.6,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.072, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: 0.74, preemptibleP100HourlyPrice: 0.43
  },
  {
    name: 'EUROPE-WEST6', monthlyDiskPrice: 0.052,
    n1HourlyGBRamPrice: 0.005928, n1HourlyCpuPrice: 0.044231, preemptibleN1HourlyGBRamPrice: 0.001254, preemptibleN1HourlyCpuPrice: 0.009309,
    t4HourlyPrice: 0.45, p4HourlyPrice: 0.84, k80HourlyPrice: 0.63, v100HourlyPrice: 3.472, p100HourlyPrice: 2.044,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.2808, preemptibleK80HourlyPrice: 0.1755,
    preemptibleV100HourlyPrice: 0.962, preemptibleP100HourlyPrice: 0.559
  },
  {
    name: 'NORTHAMERICA-NORTHEAST1', monthlyDiskPrice: 0.044,
    n1HourlyGBRamPrice: 0.004664, n1HourlyCpuPrice: 0.034802, preemptibleN1HourlyGBRamPrice: 0.000987, preemptibleN1HourlyCpuPrice: 0.007325,
    t4HourlyPrice: NaN, p4HourlyPrice: 0.65, k80HourlyPrice: NaN, v100HourlyPrice: NaN, p100HourlyPrice: NaN,
    preemptibleT4HourlyPrice: NaN, preemptibleP4HourlyPrice: 0.072, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: NaN
  },
  {
    name: 'SOUTHAMERICA-EAST1', monthlyDiskPrice: 0.06,
    n1HourlyGBRamPrice: 0.006725, n1HourlyCpuPrice: 0.05018, preemptibleN1HourlyGBRamPrice: 0.000641, preemptibleN1HourlyCpuPrice: 0.00478,
    t4HourlyPrice: 0.48, p4HourlyPrice: NaN, k80HourlyPrice: NaN, v100HourlyPrice: NaN, p100HourlyPrice: NaN,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: NaN, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: NaN
  },
  {
    name: 'US-CENTRAL1', monthlyDiskPrice: 0.04,
    n1HourlyGBRamPrice: 0.004237, n1HourlyCpuPrice: 0.031611, preemptibleN1HourlyGBRamPrice: 0.000892, preemptibleN1HourlyCpuPrice: 0.006655,
    t4HourlyPrice: 0.35, p4HourlyPrice: 0.6, k80HourlyPrice: 0.45, v100HourlyPrice: 2.48, p100HourlyPrice: 1.46,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.216, preemptibleK80HourlyPrice: 0.0375,
    preemptibleV100HourlyPrice: 0.74, preemptibleP100HourlyPrice: 0.43
  },
  {
    name: 'US-EAST1', monthlyDiskPrice: 0.04,
    n1HourlyGBRamPrice: 0.004237, n1HourlyCpuPrice: 0.031611, preemptibleN1HourlyGBRamPrice: 0.000892, preemptibleN1HourlyCpuPrice: 0.006655,
    t4HourlyPrice: 0.35, p4HourlyPrice: 0.6, k80HourlyPrice: 0.45, v100HourlyPrice: 2.48, p100HourlyPrice: 1.46,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.216, preemptibleK80HourlyPrice: 0.0375,
    preemptibleV100HourlyPrice: 0.74, preemptibleP100HourlyPrice: 0.43
  },
  {
    name: 'US-EAST4', monthlyDiskPrice: 0.044,
    n1HourlyGBRamPrice: 0.004771, n1HourlyCpuPrice: 0.035605, preemptibleN1HourlyGBRamPrice: 0.00095444, preemptibleN1HourlyCpuPrice: 0.00712085,
    t4HourlyPrice: 0.35, p4HourlyPrice: 0.6, k80HourlyPrice: NaN, v100HourlyPrice: NaN, p100HourlyPrice: NaN,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.216, preemptibleK80HourlyPrice: NaN,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: NaN
  },
  {
    name: 'US-WEST1', monthlyDiskPrice: 0.04,
    n1HourlyGBRamPrice: 0.004237, n1HourlyCpuPrice: 0.031611, preemptibleN1HourlyGBRamPrice: 0.000892, preemptibleN1HourlyCpuPrice: 0.006655,
    t4HourlyPrice: 0.35, p4HourlyPrice: 0.6, k80HourlyPrice: 0.45, v100HourlyPrice: 2.48, p100HourlyPrice: 1.46,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.216, preemptibleK80HourlyPrice: 0.0375,
    preemptibleV100HourlyPrice: 0.74, preemptibleP100HourlyPrice: 0.43
  },
  {
    name: 'US-WEST2', monthlyDiskPrice: 0.048,
    n1HourlyGBRamPrice: 0.005089, n1HourlyCpuPrice: 0.03797, preemptibleN1HourlyGBRamPrice: 0.001076, preemptibleN1HourlyCpuPrice: 0.007986,
    t4HourlyPrice: 0.41, p4HourlyPrice: 0.72, k80HourlyPrice: 0.54, v100HourlyPrice: NaN, p100HourlyPrice: NaN,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.2592, preemptibleK80HourlyPrice: 0.162,
    preemptibleV100HourlyPrice: NaN, preemptibleP100HourlyPrice: NaN
  },
  {
    name: 'US-WEST3', monthlyDiskPrice: 0.048,
    n1HourlyGBRamPrice: 0.005089, n1HourlyCpuPrice: 0.03797, preemptibleN1HourlyGBRamPrice: 0.001076, preemptibleN1HourlyCpuPrice: 0.007986,
    t4HourlyPrice: 0.41, p4HourlyPrice: 0.72, k80HourlyPrice: 0.54, v100HourlyPrice: 2.976, p100HourlyPrice: 1.752,
    preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.2592, preemptibleK80HourlyPrice: 0.162,
    preemptibleV100HourlyPrice: 0.888, preemptibleP100HourlyPrice: 0.516
  },
  {
    name: 'US-WEST4', monthlyDiskPrice: 0.044,
    n1HourlyGBRamPrice: 0.004771, n1HourlyCpuPrice: 0.035605, preemptibleN1HourlyGBRamPrice: 0.000454, preemptibleN1HourlyCpuPrice: 0.003391,
    t4HourlyPrice: 0.37, p4HourlyPrice: 0.6, k80HourlyPrice: 0.48, v100HourlyPrice: 2.48, p100HourlyPrice: 1.46,
    preemptibleT4HourlyPrice: 0.069841, preemptibleP4HourlyPrice: 0.216, preemptibleK80HourlyPrice: 0.135,
    preemptibleV100HourlyPrice: 0.74, preemptibleP100HourlyPrice: 0.43
  }
]

export const version = '6' // updated jupyter-iframe-extension.js

export const dataSyncingDocUrl = 'https://support.terra.bio/hc/en-us/articles/360034505132--Lock-and-Playground-Notebook-Modes'
