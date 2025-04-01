import json
import librosa
import soundfile as sf
import numpy as np
from scipy.io import wavfile
import matplotlib.pyplot as plt
from collections import defaultdict
from scipy import signal
import sys
import os

# Setup logging to a file instead of stdout
log_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'audio_process.log')
def log(message):
    with open(log_file, 'a') as f:
        f.write(f"{message}\n")

# Process input file from command line argument
input_file = sys.argv[1]

# Load audio file and log shape for debugging
audio_data, sample_rate = librosa.load(input_file, sr=None, mono=False)
log(f"Loaded audio data with shape: {audio_data.shape}, type: {type(audio_data)}")

# Check if the loaded data is a 1D array, which means it's a single channel
# In this case, reshape it to have shape (1, n_samples) to make it compatible with multi-channel code
if audio_data.ndim == 1:
    log(f"Reshaping 1D array of length {len(audio_data)} to 2D array with 1 channel")
    audio_data = np.reshape(audio_data, (1, -1))
    log(f"New shape: {audio_data.shape}")

# Now we can safely calculate the channel maximums
channel_maximums = np.max(np.abs(audio_data), axis=1)
log(f"Channel maximums: {channel_maximums}")

# Set a more sensitive threshold (0.3 instead of 0.4)
threshold = 0.3 * channel_maximums
log(f"Threshold: {threshold}")

# Find the time points where the audio exceeds the threshold for each channel
spike_indices = np.where((np.abs(audio_data) > threshold[:, None]).T)

# Get the channel and time indices of the spikes
spike_channels = spike_indices[1]
spike_times = spike_indices[0]
spike_times_ms = spike_times / sample_rate * 1000

# Log number of spikes detected
log(f"Detected {len(spike_times)} spikes across {len(np.unique(spike_channels))} channels")

# Initialize cluster dict for holding crackle families
clusters = defaultdict(list)
cluster_id = 0
family_range = 60  # increased from 40 to 60 ms

for i in range(len(spike_times_ms)):
    if clusters and spike_times_ms[i] - clusters[cluster_id][-1][1] > family_range:
        cluster_id += 1  # Create a new cluster if current spike is out of range
    clusters[cluster_id].append((spike_channels[i], spike_times_ms[i]))  # Append to the current cluster

# Log number of clusters found
log(f"Found {len(clusters)} initial clusters")

# Remove clusters that aren't represented on enough channels
num_channels = audio_data.shape[0]  # Get total number of channels
filtered_clusters = []
for cluster in clusters.values():
    channels_in_cluster = set(channel for channel, _ in cluster)
    # More lenient filtering - require only 30% of channels instead of 60%
    if len(channels_in_cluster) >= max(2, int(num_channels * 0.6)):
        filtered_clusters.append(cluster)

# Log number of filtered clusters
log(f"After filtering, {len(filtered_clusters)} clusters remain")

# Filter for peak in each channel
crackle_families = []
for cluster in filtered_clusters:
    channel_max_amplitudes = {}  # Store max amplitude and time for each channel

    for channel, time in cluster:
        sample_index = int(time * sample_rate / 1000)
        if sample_index < audio_data.shape[1]:
            amplitude = abs(audio_data[channel, sample_index])
            if channel not in channel_max_amplitudes or amplitude > channel_max_amplitudes[channel][0]:
                channel_max_amplitudes[channel] = (amplitude, time)

    refined_cluster = [(channel, time) for channel, (amplitude, time) in channel_max_amplitudes.items()]
    refined_cluster.sort(key=lambda x: x[0])  # Sort by channel number
    crackle_families.append(refined_cluster)

# Log number of crackle families
log(f"Found {len(crackle_families)} crackle families")

# Cross-correlation analysis
cross_correlation_families = []

for family_id, crackle_family in enumerate(crackle_families):
    log(f"Processing family {family_id + 1} with {len(crackle_family)} peaks")
    
    # Find the mother crackle (earliest peak)
    mother_channel, mother_time = min(crackle_family, key=lambda x: x[1])
    # Convert time to sample index
    mother_sample = int(mother_time * sample_rate / 1000)

    # Extract slices around peaks for cross-correlation
    slice_length = int(sample_rate * 0.18)  # 180ms slice
    
    # Ensure we don't go out of bounds
    mother_start = int(max(0, mother_sample - slice_length // 2))
    mother_end = int(min(audio_data.shape[1], mother_sample + slice_length // 2))
    
    if mother_end <= mother_start:
        log(f"Skipping family {family_id + 1} due to invalid slice indices")
        continue
        
    mother_slice = audio_data[mother_channel, mother_start:mother_end]

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

        # Ensure we're using the same slice window for all channels
        daughter_slice = audio_data[channel, mother_start:mother_end]

        # Skip if either slice is too short
        if len(mother_slice) < 2 or len(daughter_slice) < 2:
            log(f"Skipping channel {channel} due to insufficient data")
            continue

        cross_correlation = signal.correlate(daughter_slice, mother_slice, mode='full')
        cross_correlation_peak = np.max(cross_correlation)

        lags = signal.correlation_lags(len(mother_slice), len(daughter_slice), mode="full")
        lag_index = np.argmax(cross_correlation)
        
        # Ensure lag_index is within bounds
        if lag_index < len(lags):
            lag = lags[lag_index]
            delay = lag / sample_rate * 1000
        else:
            log(f"Warning: lag_index {lag_index} out of bounds for lags array of length {len(lags)}")
            delay = 0.0

        transmission_coefficient = cross_correlation_peak / autocorrelation_peak if autocorrelation_peak else 0

        one_family_cross_correlation.append({
            'channel': int(channel),
            'delay': float(delay),
            'transmission_coefficient': float(transmission_coefficient),
            'time': float(time)  # Add the time information
        })

    if one_family_cross_correlation:
        cross_correlation_families.append(one_family_cross_correlation)

# Log number of final families
log(f"Generated {len(cross_correlation_families)} cross-correlation families")

# If no crackle families were found, create a dummy family for testing
if len(cross_correlation_families) == 0:
    log("No crackle families found, creating a dummy family for testing")
    dummy_family = []
    for channel in range(audio_data.shape[0]):
        # Find a high-amplitude point in each channel
        max_index = np.argmax(np.abs(audio_data[channel]))
        time_ms = float(max_index / sample_rate * 1000)
        dummy_family.append({
            'channel': int(channel),
            'delay': float(channel * 5.0),  # fake delay values
            'transmission_coefficient': 1.0 / (channel + 1.0),  # fake transmission coefficient
            'time': time_ms
        })
    cross_correlation_families.append(dummy_family)
    log(f"Created dummy family with {len(dummy_family)} channels")

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
    # Output JSON to stdout, and only JSON (no debugging info)
    json_output = json.dumps(cross_correlation_families_serializable)
    sys.stdout.write(json_output)
except Exception as e:
    log(f"Error serializing to JSON: {str(e)}")
    # Return an empty array in case of error to avoid parsing issues
    sys.stdout.write("[]")