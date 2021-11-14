"""Script that parses pricing data from Google's API.

Intended to be run periodically for the terra-ui's estimated price UI. The
output is something you could copy and paste into a javascript file.
See https://cloud.google.com/billing/v1/how-tos/catalog-api for more detail
on Google Cloud pricing information.

Usage:
1) Follow the instructions at the above URL to create an API key
2) Run `python3 parse_pricing_api.py ${API_KEY}`
3) Copy and paste the output to the appropriate Javascript file.
"""
import sys
import requests

# See https://cloud.google.com/billing/v1/how-tos/catalog-api on
# using API keys
if len(sys.argv) < 2:
  print('Usage: `python3 parse_pricing_api.py ${API_KEY}`')
  sys.exit()
API_KEY = sys.argv[1]

# See https://cloud.google.com/skus/sku-groups/on-demand-vms,
# https://cloud.google.com/skus/sku-groups/on-demand-persistent-disk-hdd
# on SKU groups
GCE_SERVICE = '6F81-5844-456A'

N1_STANDARD_GROUP = 'N1Standard'
PD_STANDARD_GROUP = 'PDStandard'
GPU_STANDARD_GROUP = 'GPU'

NVIDIA_TESTLA_T4 = 'Nvidia Tesla T4'
NVIDIA_TESTLA_K80 = 'Nvidia Tesla K80'
NVIDIA_TESTLA_P4 = 'Nvidia Tesla P4'
NVIDIA_TESTLA_V100 = 'Nvidia Tesla V100'
NVIDIA_TESTLA_P100 = 'Nvidia Tesla P100'
PREEMPTIBLE_NVIDIA_TESTLA_T4 = f'Preemptible {NVIDIA_TESTLA_T4}'
PREEMPTIBLE_NVIDIA_TESTLA_K80 = f'Preemptible {NVIDIA_TESTLA_K80}'
PREEMPTIBLE_NVIDIA_TESTLA_P4 = f'Preemptible {NVIDIA_TESTLA_P4}'
PREEMPTIBLE_NVIDIA_TESTLA_V100 = f'Preemptible {NVIDIA_TESTLA_V100}'
PREEMPTIBLE_NVIDIA_TESTLA_P100 = f'Preemptible {NVIDIA_TESTLA_P100}'

GPUS = [
    NVIDIA_TESTLA_T4,
    NVIDIA_TESTLA_K80,
    NVIDIA_TESTLA_P4,
    NVIDIA_TESTLA_V100,
    NVIDIA_TESTLA_P100,
]

REGIONS = [
    'ASIA-EAST1',
    'ASIA-EAST2',
    'ASIA-NORTHEAST1',
    'ASIA-NORTHEAST2',
    'ASIA-NORTHEAST3',
    'ASIA-SOUTH1',
    'ASIA-SOUTHEAST1',
    'ASIA-SOUTHEAST2',
    'AUSTRALIA-SOUTHEAST1',
    'EUROPE-NORTH1',
    'EUROPE-WEST1',
    'EUROPE-WEST2',
    'EUROPE-WEST3',
    'EUROPE-WEST4',
    'EUROPE-WEST6',
    'NORTHAMERICA-NORTHEAST1',
    'SOUTHAMERICA-EAST1',
    'US-CENTRAL1',
    'US-EAST1',
    'US-EAST4',
    'US-WEST1',
    'US-WEST2',
    'US-WEST3',
    'US-WEST4',
]

GPU_FIXUPS = {
    # There are some places where the API is missing a documented price.
    # Source is https://cloud.google.com/compute/docs/gpus/gpu-regions-zones
    # and https://cloud.google.com/compute/gpus-pricing
    # I filed a bug to GCP in b/206136541
    'ASIA-EAST1': {
        NVIDIA_TESTLA_T4: 0.35,
        PREEMPTIBLE_NVIDIA_TESTLA_T4: 0.069841
    },
    'ASIA-NORTHEAST1': {
        PREEMPTIBLE_NVIDIA_TESTLA_T4: 0.069841
    },
    'AUSTRALIA-SOUTHEAST1': {
        NVIDIA_TESTLA_P100: 1.60,
        PREEMPTIBLE_NVIDIA_TESTLA_T4: 0.069841,
        PREEMPTIBLE_NVIDIA_TESTLA_P100: 0.43
    },
    'EUROPE-WEST1': {
        NVIDIA_TESTLA_T4: 0.35,
        PREEMPTIBLE_NVIDIA_TESTLA_T4: 0.11
    },
    'EUROPE-WEST2': {
        NVIDIA_TESTLA_T4: 0.41,
        PREEMPTIBLE_NVIDIA_TESTLA_T4: 0.069841
    },
    'EUROPE-WEST4': {
        NVIDIA_TESTLA_P100: 1.60,
        PREEMPTIBLE_NVIDIA_TESTLA_P100: 0.43
    },
    'US-EAST4': {
        NVIDIA_TESTLA_T4: 0.35,
        PREEMPTIBLE_NVIDIA_TESTLA_T4: 0.11
    },
    'US-WEST2': {
        NVIDIA_TESTLA_T4: 0.41,
        PREEMPTIBLE_NVIDIA_TESTLA_T4: 0.11
    }
}


def get_json_price_data(service_sku_id):
  """Calls Google's API and returns the json data."""
  params = {'key': API_KEY}
  url = f'https://cloudbilling.googleapis.com/v1/services/{service_sku_id}/skus'
  response = requests.get(url, params=params)
  if response.status_code != 200:
    print(response.text)
    sys.exit()
  page_token = response.json().get('nextPageToken')
  json_data = response.json()
  skus = json_data['skus']  # This is a list of sku objects
  while page_token:
    params = {'key': API_KEY, 'pageToken': page_token}
    response = requests.get(url, params=params)
    json_data = response.json()
    skus += json_data['skus']
    page_token = json_data.get('nextPageToken')
  return skus


def filter_sku_list_by_category(skus, category_key, category_value):
  return [
      sku for sku in skus if sku['category'][category_key] == category_value
  ]


def filter_sku_list_by_description(skus, filter_func):
  return [sku for sku in skus if filter_func(sku['description'])]


def get_sku_for_region(skus, region):
  # Assumes that skus are a pre-filtered list containing one ram sku
  # for each region.
  sku = next((sku for sku in skus if region.lower() in sku['serviceRegions']),
             None)
  return sku


def get_price_from_sku(sku):
  unit_price = sku['pricingInfo'][0]['pricingExpression']['tieredRates'][
      -1]['unitPrice']
  units = unit_price['units']
  nano_unit_price = unit_price['nanos']
  return int(units) + (nano_unit_price / 10**9)


def get_n1_prices_per_region(skus):
  """Returns a dict containing price data per region."""
  skus = filter_sku_list_by_category(skus, 'resourceGroup', N1_STANDARD_GROUP)

  non_preemptible_skus = filter_sku_list_by_category(skus, 'usageType',
                                                     'OnDemand')
  preemptible_skus = filter_sku_list_by_category(skus, 'usageType',
                                                 'Preemptible')

  ram_skus = filter_sku_list_by_description(non_preemptible_skus,
                                            lambda desc: 'Ram' in desc)
  cpu_skus = filter_sku_list_by_description(non_preemptible_skus,
                                            lambda desc: 'Core' in desc)
  preemptible_ram_skus = filter_sku_list_by_description(
      preemptible_skus, lambda desc: 'Ram' in desc)
  preemptible_cpu_skus = filter_sku_list_by_description(
      preemptible_skus, lambda desc: 'Core' in desc)
  n1_prices_per_region = {region: {} for region in REGIONS}
  for region in REGIONS:
    # Non-preemptible RAM
    ram_sku_for_region = get_sku_for_region(ram_skus, region)
    ram_price = get_price_from_sku(ram_sku_for_region)
    # Non-preemptible CPU
    cpu_sku_for_region = get_sku_for_region(cpu_skus, region)
    cpu_price = get_price_from_sku(cpu_sku_for_region)
    # Preemptible RAM
    preemptible_ram_sku_for_region = get_sku_for_region(preemptible_ram_skus,
                                                        region)
    preemptible_ram_price = get_price_from_sku(preemptible_ram_sku_for_region)
    # Preemptible CPU
    preemptible_cpu_sku_for_region = get_sku_for_region(preemptible_cpu_skus,
                                                        region)
    preemptible_cpu_price = get_price_from_sku(preemptible_cpu_sku_for_region)
    n1_prices_per_region[region] = {
        'ram_price': ram_price,
        'cpu_price': cpu_price,
        'preemptible_ram_price': preemptible_ram_price,
        'preemptible_cpu_price': preemptible_cpu_price
    }
  return n1_prices_per_region


def get_disk_price_per_region(skus):
  """Returns a dict containing disk price data per region."""
  skus = filter_sku_list_by_category(skus, 'resourceGroup', PD_STANDARD_GROUP)
  skus = filter_sku_list_by_description(
      skus, lambda desc: desc.startswith('Storage PD Capacity'))
  disk_price_per_region = {}
  for region in REGIONS:
    sku = get_sku_for_region(skus, region)
    price = get_price_from_sku(sku)
    disk_price_per_region[region] = {'monthly_disk_price': price}
  return disk_price_per_region


def get_gpu_prices_per_region(skus):
  """Returns a dict containing gpu price data per region."""
  skus = filter_sku_list_by_category(skus, 'resourceGroup', GPU_STANDARD_GROUP)
  gpu_prices_per_region = {region: {} for region in REGIONS}
  for gpu_type in GPUS:
    # pylint: disable=cell-var-from-loop,g-long-lambda
    standard_skus_for_gpu_type = filter_sku_list_by_description(
        skus, lambda desc: desc.startswith(f'{gpu_type} GPU running in'))
    preemptible_skus_for_gpu_type = filter_sku_list_by_description(
        skus, lambda desc: desc.startswith(
            f'{gpu_type} GPU attached to Spot Preemptible VMs running in'))
    # pylint: enable=cell-var-from-loop,g-long-lambda
    for region in REGIONS:
      standard_sku = get_sku_for_region(standard_skus_for_gpu_type, region)
      if standard_sku:
        standard_price = get_price_from_sku(standard_sku)
      else:
        standard_price = -1  # Some regions don't have the GPU available.
      gpu_prices_per_region[region][gpu_type] = standard_price

      preemptible_sku = get_sku_for_region(preemptible_skus_for_gpu_type,
                                           region)
      if preemptible_sku:
        preemptible_price = get_price_from_sku(preemptible_sku)
      else:
        preemptible_price = -1  # Some regions don't have the GPU available.
      gpu_prices_per_region[region][
          f'Preemptible {gpu_type}'] = preemptible_price

  for region in REGIONS:
    # There are some places where the API is missing a documented price.
    # I filed a bug to GCP in b/206136541
    if region in GPU_FIXUPS:
      gpu_prices_per_region[region].update(GPU_FIXUPS[region])
  return gpu_prices_per_region


def output_formatted_for_javascript_files(prices_per_region_dict):
  """Prints data in a format to copy-paste into a JS file."""
  def to_nan(n):
    if n == -1:
      return 'NaN'
    else:
      return n
  print('export const regionToPrices = [')
  for region, prices in prices_per_region_dict.items():
    # pylint: disable=line-too-long,g-inconsistent-quotes,f-string-without-interpolation
    ram, cpu, p_ram, p_cpu = prices['ram_price'], prices['cpu_price'], prices['preemptible_ram_price'], prices['preemptible_cpu_price']
    monthly_disk_price = prices['monthly_disk_price']
    try:
      t4, p4, k80, v100, p100 = prices['Nvidia Tesla T4'], prices['Nvidia Tesla P4'], prices['Nvidia Tesla K80'], prices['Nvidia Tesla V100'], prices['Nvidia Tesla P100']
    except KeyError:
      print(prices)
      raise
    p_t4, p_p4, p_k80, p_v100, p_p100 = prices['Preemptible Nvidia Tesla T4'], prices['Preemptible Nvidia Tesla P4'], prices['Preemptible Nvidia Tesla K80'], prices['Preemptible Nvidia Tesla V100'], prices['Preemptible Nvidia Tesla P100']
    print(f"  {{")
    print(f"    name: '{region}', monthlyDiskPrice: {monthly_disk_price},")
    print(f"    n1HourlyGBRamPrice: {ram}, n1HourlyCpuPrice: {cpu}, preemptibleN1HourlyGBRamPrice: {p_ram}, preemptibleN1HourlyCpuPrice: {p_cpu},")
    print(f"    t4HourlyPrice: {to_nan(t4)}, p4HourlyPrice: {to_nan(p4)}, k80HourlyPrice: {to_nan(k80)}, v100HourlyPrice: {to_nan(v100)}, p100HourlyPrice: {to_nan(p100)},")
    print(f"    preemptibleT4HourlyPrice: {to_nan(p_t4)}, preemptibleP4HourlyPrice: {to_nan(p_p4)}, preemptibleK80HourlyPrice: {to_nan(p_k80)},")
    print(f"    preemptibleV100HourlyPrice: {to_nan(p_v100)}, preemptibleP100HourlyPrice: {to_nan(p_p100)}")
    print(f"  }},")
    # pylint: enable=line-too-long,g-inconsistent-quotes,f-string-without-interpolation
  print(']')


def main():
  gce_skus = get_json_price_data(GCE_SERVICE)
  n1_prices_per_region = get_n1_prices_per_region(gce_skus)
  disk_price_per_region = get_disk_price_per_region(gce_skus)
  gpu_prices_per_region = get_gpu_prices_per_region(gce_skus)

  all_prices = {}
  for region in REGIONS:
    # This combines all the price dicts into one dict
    # e.g. {'ASIA-EAST1': {'monthly_disk_price': 100, 'Nvidia Tesla K80': 200}}
    all_prices[region] = {
        **n1_prices_per_region[region],
        **disk_price_per_region[region],
        **gpu_prices_per_region[region]
    }
  output_formatted_for_javascript_files(all_prices)

if __name__ == '__main__':
  main()
