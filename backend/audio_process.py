import json
import librosa
import numpy as np
from scipy import signal
import sys
from collections import defaultdict
from sklearn.cluster import DBSCAN

# Process input file from command line argument
input_file = sys.argv[1]
audio_data, sample_rate = librosa.load(input_file, sr=None, mono=False)

# Calculate the mean and standard deviation of each channel
channel_means = np.mean(audio_data, axis=1)
channel_stds = np.std(audio_data, axis=1)

# Set an adaptive threshold based on channel characteristics
threshold = 2.5 * channel_stds  # Slightly increased sensitivity

# Find the time points where the audio exceeds the threshold for each channel
spike_indices = np.where(np.abs(audio_data) > threshold[:, None])

# Get the channel and time indices of the spikes
spike_channels = spike_indices[0]
spike_times = spike_indices[1]
spike_times_ms = spike_times / sample_rate * 1000

# Convert to a format suitable for clustering
spike_data = np.column_stack((spike_times_ms, spike_channels))

# Use DBSCAN for more robust clustering of crackle families
eps = 500  # Maximum distance between two samples (in ms)
min_samples = max(2, audio_data.shape[0] // 2)  # Require at least half of channels to be present

if len(spike_data) > 0:
    clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(spike_data[:, 0].reshape(-1, 1))
    labels = clustering.labels_
else:
    labels = []

# Group spikes by cluster
clusters = defaultdict(list)
for i in range(len(labels)):
    if labels[i] != -1:  # -1 represents noise in DBSCAN
        clusters[labels[i]].append((spike_channels[i], spike_times_ms[i]))

# Filter clusters to ensure they have representation across multiple channels
num_channels = audio_data.shape[0]
channel_threshold = max(2, num_channels // 2)  # At least half the channels must be present

filtered_clusters = []
for cluster in clusters.values():
    channels_in_cluster = set(channel for channel, _ in cluster)
    if len(channels_in_cluster) >= channel_threshold:
        filtered_clusters.append(cluster)

# Refine clusters to find peak amplitude in each channel
crackle_families = []
for cluster in filtered_clusters:
    channel_max_amplitudes = {}  # Store max amplitude and time for each channel
    
    for channel, time in cluster:
        sample_index = int(time * sample_rate / 1000)
        if sample_index < len(audio_data[channel]):
            amplitude = abs(audio_data[channel, sample_index])
            if channel not in channel_max_amplitudes or amplitude > channel_max_amplitudes[channel][0]:
                channel_max_amplitudes[channel] = (amplitude, time)
    
    refined_cluster = [(channel, time) for channel, (amplitude, time) in channel_max_amplitudes.items()]
    if refined_cluster:  # Only add non-empty clusters
        crackle_families.append(refined_cluster)

# Calculate cross-correlation for each crackle family
families_data = []

for family_id, crackle_family in enumerate(crackle_families):
    # Find the mother crackle (earliest peak)
    mother_channel, mother_time = min(crackle_family, key=lambda x: x[1])
    # Convert time to sample index
    mother_sample = int(mother_time * sample_rate / 1000)
    
    slice_duration = 18  # Match original value
    
    # Extract slices around peaks for cross-correlation
    slice_length = int((sample_rate * slice_duration) / 1000)  # Convert ms to samples
    
    # Ensure we don't exceed array bounds
    start_idx = max(0, mother_sample - slice_length // 2)
    end_idx = min(audio_data.shape[1], mother_sample + slice_length // 2)
    
    if start_idx >= end_idx or end_idx - start_idx < 5:  # Ensure we have enough samples
        continue
        
    mother_slice = audio_data[mother_channel][start_idx:end_idx]
    
    # Calculate autocorrelation
    autocorrelation = signal.correlate(mother_slice, mother_slice, mode='full')
    autocorrelation_peak = np.max(autocorrelation)
    
    # Create family data structure
    family_correlations = []
    
    for channel, time in crackle_family:
        if channel == mother_channel:
            # Mother channel (reference channel)
            family_correlations.append({
                'channel': int(channel),
                'delay': 0.0,
                'transmission_coefficient': 1.0
            })
            continue
        
        daughter_sample = int(time * sample_rate / 1000)
        
        # Ensure consistent slice window relative to mother sample
        d_start_idx = max(0, start_idx)
        d_end_idx = min(audio_data.shape[1], start_idx + (end_idx - start_idx))
        
        if d_start_idx >= d_end_idx or d_end_idx - d_start_idx < 5:
            continue
            
        daughter_slice = audio_data[channel][d_start_idx:d_end_idx]
        
        # Handle case where slices have different lengths
        min_len = min(len(mother_slice), len(daughter_slice))
        if min_len < 5:  # Skip if slices are too short
            continue
            
        mother_slice_trimmed = mother_slice[:min_len]
        daughter_slice_trimmed = daughter_slice[:min_len]
        
        # Calculate cross-correlation
        cross_correlation = signal.correlate(daughter_slice_trimmed, mother_slice_trimmed, mode='full')
        cross_correlation_peak = np.max(cross_correlation)
        
        # Calculate delay
        lags = signal.correlation_lags(len(mother_slice_trimmed), len(daughter_slice_trimmed), mode="full")
        lag_index = np.argmax(cross_correlation)
        
        if lag_index < len(lags):
            lag = lags[lag_index]
            delay = lag / sample_rate * 1000
        else:
            delay = 0.0
        
        # Calculate transmission coefficient
        transmission_coefficient = float(cross_correlation_peak / autocorrelation_peak if autocorrelation_peak > 0 else 0)
        
        family_correlations.append({
            'channel': int(channel),
            'delay': float(delay),
            'transmission_coefficient': transmission_coefficient
        })
    
    # Add family only if it has data
    if family_correlations:
        families_data.append(family_correlations)

# Convert numpy types to Python native types for JSON serialization
def convert_numpy_types(data):
    """Recursively converts numpy types to Python native types"""
    if isinstance(data, (np.int32, np.int64)):
        return int(data)
    elif isinstance(data, (np.float32, np.float64)):
        return float(data)
    elif isinstance(data, list):
        return [convert_numpy_types(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_numpy_types(value) for key, value in data.items()}
    else:
        return data

# Convert families_data to a JSON-serializable format
families_data_serializable = convert_numpy_types(families_data)

try:
    # Output JSON response
    json_response = json.dumps(families_data_serializable)
    sys.stdout.write(json_response)
except Exception as e:
    error_response = json.dumps({"error": str(e)})
    sys.stdout.write(error_response)