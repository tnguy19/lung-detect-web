import json
import librosa
import soundfile as sf
import numpy as np
from scipy.io import wavfile
import matplotlib.pyplot as plt
from collections import defaultdict
from scipy import signal
import sys

# Code to create crackle families
input_file = sys.argv[1]
audio_data, sample_rate = librosa.load(input_file, sr=None, mono=False)

#print(audio_data.shape)

# Calculate the mean and standard deviation of each channel
channel_means = np.mean(audio_data, axis=1)
channel_stds = np.std(audio_data, axis=1)

# Set a threshold
threshold = 2 * channel_stds # perhaps make threshold narrower and find a way to filter out false positives

# Find the time points where the audio exceeds the threshold for each channel
spike_indices = np.where(np.abs(audio_data) > threshold[:, None])

# Get the channel and time indices of the spikes
spike_channels = spike_indices[0]
spike_times = spike_indices[1]
spike_times_ms = spike_times / sample_rate * 1000
#print(spike_times_ms)

# Initialize cluster dict for holding crackle families
clusters = defaultdict(list)
cluster_id = 0
cluster_thresh = 9000

for i in range(len(spike_times_ms)):
    if not clusters or spike_times_ms[i] - clusters[cluster_id][-1][1] > cluster_thresh:  # Check if new cluster needed
        cluster_id += 1
    clusters[cluster_id].append((spike_channels[i], spike_times_ms[i]))

#print(clusters)

# Remove clusters that aren't on every channel
num_channels = audio_data.shape[0]  # Get total number of channels
filtered_clusters = []
for cluster in clusters.values():
    channels_in_cluster = set(channel for channel, _ in cluster)
    if len(channels_in_cluster) == num_channels:  # change to add tolerance to not all clusters flagging
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
    crackle_families.append(refined_cluster)

#print(crackle_families)

cross_correlation_families = []

for family_id, crackle_family in enumerate(crackle_families):
    # Find the mother crackle (earliest peak)
    mother_channel, mother_time = min(crackle_family, key=lambda x: x[1])
    # Convert time to sample index
    mother_sample = int(mother_time * sample_rate / 1000)

    #print(f"Cluster {family_id + 1}: Mother crackle at channel {mother_channel}, time {mother_time} ms")
    slice_duration = 0.5
    # Extract 1/2-second slices around peaks for cross-correlation
    slice_length = int(sample_rate) * slice_duration  # 1/2 second slice
    mother_slice = audio_data[mother_channel][int(max(0, mother_sample - slice_length // 2)):int(min(len(audio_data[mother_channel]), mother_sample + slice_length // 2))]

    autocorrelation = signal.correlate(mother_slice, mother_slice, mode='full')
    autocorrelation_peak = np.max(autocorrelation)

    one_family_cross_correlation = []

    for channel, time in crackle_family:
        if channel == mother_channel:
            continue  # Skip autocorrelation (already computed)

        daughter_sample = int(time * sample_rate / 1000)
        daughter_slice = audio_data[channel][int(max(0, mother_sample - slice_length // 2)):int(min(len(audio_data[channel]), daughter_sample + slice_length // 2))]

        cross_correlation = signal.correlate(mother_slice, daughter_slice, mode='full')
        cross_correlation_peak = np.max(cross_correlation)

        # Calculate delay
        lags = signal.correlation_lags(len(mother_slice), len(daughter_slice), mode="full")
        lag = lags[np.argmax(cross_correlation)]
        delay = lag / sample_rate * 1000

        transmission_coefficient = cross_correlation_peak / autocorrelation_peak if autocorrelation_peak else 0

        one_family_cross_correlation.append({'channel': channel, 'delay': delay, 'transmission_coefficient': transmission_coefficient})

    cross_correlation_families.append(one_family_cross_correlation)

def convert_numpy_types(data):
    """Recursively converts numpy.int64 and numpy.float32 to Python native types"""
    if isinstance(data, np.int64):
        return int(data)
    elif isinstance(data, np.float32):
        return float(data)
    elif isinstance(data, list):
        return [convert_numpy_types(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_numpy_types(value) for key, value in data.items()}
    else:
        return data

# Convert cross_correlation_families to a JSON-serializable format
cross_correlation_families_serializable = convert_numpy_types(cross_correlation_families)

try:
    # Convert to a JSON-serializable format
    
    response_data = json.dumps(cross_correlation_families_serializable)
    sys.stdout.write(response_data)
except Exception as e:
    error_response = json.dumps({"error": str(e)})
    sys.stdout.write(error_response)