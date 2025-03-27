import json
import librosa
import soundfile as sf
import numpy as np
from scipy.io import wavfile
import matplotlib.pyplot as plt
from collections import defaultdict
from scipy import signal
import sys

# Process input file from command line argument
input_file = sys.argv[1]
audio_data, sample_rate = librosa.load(input_file, sr=None, mono=False)

# Calculate channel maximums
channel_maximums = np.max(np.abs(audio_data), axis=1)

# Set a threshold
threshold = 0.4 * channel_maximums

# Find the time points where the audio exceeds the threshold for each channel
spike_indices = np.where((np.abs(audio_data) > threshold[:, None]).T)

# Get the channel and time indices of the spikes
spike_channels = spike_indices[1]
spike_times = spike_indices[0]
spike_times_ms = spike_times / sample_rate * 1000

# Initialize cluster dict for holding crackle families
clusters = defaultdict(list)
cluster_id = 0
family_range = 40  # how many milliseconds are considered family

for i in range(len(spike_times_ms)):
    if clusters and spike_times_ms[i] - clusters[cluster_id][-1][1] > family_range:
        cluster_id += 1  # Create a new cluster if current spike is out of range
    clusters[cluster_id].append((spike_channels[i], spike_times_ms[i]))  # Append to the current cluster

# Remove clusters that aren't represented on enough channels
num_channels = audio_data.shape[0]  # Get total number of channels
filtered_clusters = []
for cluster in clusters.values():
    channels_in_cluster = set(channel for channel, _ in cluster)
    if len(channels_in_cluster) >= (num_channels * 0.6):  # 3/5 of channels should alert
        filtered_clusters.append(cluster)

# Filter for peak in each channel
crackle_families = []
for cluster in filtered_clusters:
    channel_max_amplitudes = {}  # Store max amplitude and time for each channel

    for channel, time in cluster:
        amplitude = abs(audio_data[channel, int(time * sample_rate / 1000)])
        if channel not in channel_max_amplitudes or amplitude > channel_max_amplitudes[channel][0]:
            channel_max_amplitudes[channel] = (amplitude, time)

    refined_cluster = [(channel, time) for channel, (amplitude, time) in channel_max_amplitudes.items()]
    refined_cluster.sort(key=lambda x: x[0])  # Sort by channel number
    crackle_families.append(refined_cluster)

# Cross-correlation analysis
cross_correlation_families = []

for family_id, crackle_family in enumerate(crackle_families):
    # Find the mother crackle (earliest peak)
    mother_channel, mother_time = min(crackle_family, key=lambda x: x[1])
    # Convert time to sample index
    mother_sample = int(mother_time * sample_rate / 1000)

    # Extract slices around peaks for cross-correlation
    slice_length = int(sample_rate * 0.18)  # 180ms slice
    mother_slice = audio_data[mother_channel][
                   int(max(0, mother_sample - slice_length // 2)):
                   int(min(len(audio_data[mother_channel]), mother_sample + slice_length // 2))
                   ]

    autocorrelation = signal.correlate(mother_slice, mother_slice, mode='full')
    autocorrelation_peak = np.max(autocorrelation)

    one_family_cross_correlation = []

    for channel, time in crackle_family:
        if channel == mother_channel:
            one_family_cross_correlation.append({
                'channel': int(channel),
                'delay': 0.0,
                'transmission_coefficient': 1.0,
                'time': float(time)  # Add the time information
            })
            continue  # Skip autocorrelation (already computed)

        daughter_sample = int(time * sample_rate / 1000)
        daughter_slice = audio_data[channel][
                         int(max(0, mother_sample - slice_length // 2)):
                         int(min(len(audio_data[channel]), mother_sample + slice_length // 2))
                         ]

        cross_correlation = signal.correlate(daughter_slice, mother_slice, mode='full')
        cross_correlation_peak = np.max(cross_correlation)

        lags = signal.correlation_lags(len(mother_slice), len(daughter_slice), mode="full")
        lag = lags[np.argmax(cross_correlation)]
        delay = lag / sample_rate * 1000

        transmission_coefficient = cross_correlation_peak / autocorrelation_peak if autocorrelation_peak else 0

        one_family_cross_correlation.append({
            'channel': int(channel),
            'delay': float(delay),
            'transmission_coefficient': float(transmission_coefficient),
            'time': float(time)  # Add the time information
        })

    cross_correlation_families.append(one_family_cross_correlation)

# Convert numpy values to standard Python types for JSON serialization
def convert_numpy_types(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    else:
        return obj

# Convert to JSON-serializable format and output
cross_correlation_families_serializable = convert_numpy_types(cross_correlation_families)

try:
    # Output JSON to stdout
    json_output = json.dumps(cross_correlation_families_serializable)
    sys.stdout.write(json_output)
except Exception as e:
    error_output = json.dumps({"error": str(e)})
    sys.stdout.write(error_output)