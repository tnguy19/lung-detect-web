# import libraries required for receiving  audio data and doing audio data processing and manipulation
#!pip install librosa soundfile numpy scipy matplotlib
import librosa
import soundfile as sf
import numpy as np
from scipy.io import wavfile
import matplotlib.pyplot as plt
from collections import defaultdict
from scipy import signal

#Code to create crackle families

audio_data, sample_rate = librosa.load('test4peaks.wav', sr=None, mono=False)
print(sample_rate)
print(audio_data.shape)

# Calculate the mean and standard deviation of each channel
#channel_means = np.mean(audio_data, axis=1)
#channel_stds = np.std(audio_data, axis=1)
channel_maximums = np.max(np.abs(audio_data), axis=1)

print("channel metrics:")
print(channel_maximums)
#print(channel_means)
#print(channel_stds)

# Set a threshold
threshold = 0.4 * channel_maximums #20 * channel_stds #perhaps make threshold narrower and find way to filter out false positives

# Find the time points where the audio exceeds the threshold for each channel
spike_indices = np.where((np.abs(audio_data) > threshold[:, None]).T)

# Sort spike_indices based on spike_indices[1] (time indices)
# sorted_indices = np.argsort(spike_indices[1])
# spike_indices = (spike_indices[0][sorted_indices], spike_indices[1][sorted_indices])

print("Index of instances of crackles:")
print(spike_indices)

# Get the channel and time indices of the spikes

def is_increasing(arr):
  """Checks if an array is in increasing order.

  Args:
    arr: The NumPy array to check.

  Returns:
    True if the array is in increasing order, False otherwise.
  """
  return np.all(np.diff(arr) >= 0)

spike_channels = spike_indices[1]
print("channels:")
print(spike_channels)
print(is_increasing(spike_channels))

spike_times = spike_indices[0]
spike_times_ms = spike_times / sample_rate * 1000
print(is_increasing(spike_times_ms))

print("Crackle instances milliseconds:")
print(spike_times_ms)

#initalize cluster dict for holding crackle families
clusters = defaultdict(list)
cluster_id = 0
family_range = 40 #how many milliseconds are considered family (big for testing purposes, should be 5ms)

for i in range(len(spike_times_ms)):
    if clusters and spike_times_ms[i] - clusters[cluster_id][-1][1] > family_range:
        cluster_id += 1  # Create a new cluster if current spike is out of range
    clusters[cluster_id].append((spike_channels[i], spike_times_ms[i]))  # Append to the current cluster

print("Pre-filtered clusters:")
print(clusters)
print(cluster_id)

for cluster_id, cluster_data in clusters.items():
    channel_numbers = [channel for channel, _ in cluster_data]
    times_ms = [time for _, time in cluster_data]

    max_channel = max(channel_numbers)
    min_channel = min(channel_numbers)
    max_time = max(times_ms)
    min_time = min(times_ms)
    
    # Calculate unique channels and total elements
    unique_channels = len(set(channel_numbers))  
    total_elements = len(cluster_data)  

    print(f"Cluster {cluster_id}:")
    print(f"  Max Channel: {max_channel}")
    print(f"  Min Channel: {min_channel}")
    print(f"  Max Time (ms): {max_time}")
    print(f"  Min Time (ms): {min_time}")
    print(f"  Unique Channels: {unique_channels}")
    print(f"  Total Elements: {total_elements}")
    print("-" * 20)  # Separator between clusters


#remove clusters that arent represented on enough channels (likely noise not a sound)
num_channels = audio_data.shape[0]  # Get total number of channels
filtered_clusters = []
for cluster in clusters.values():
    channels_in_cluster = set(channel for channel, _ in cluster)
    if len(channels_in_cluster) >= (num_channels * 0.6):#3/5 of channels should alert
        filtered_clusters.append(cluster)

print("Filtered:")
for cluster_id, cluster_data in enumerate(filtered_clusters): #use enumerate to provide cluster_id
    channel_numbers = [channel for channel, _ in cluster_data]
    times_ms = [time for _, time in cluster_data]

    max_channel = max(channel_numbers)
    min_channel = min(channel_numbers)
    max_time = max(times_ms)
    min_time = min(times_ms)
    
    # Calculate unique channels and total elements
    unique_channels = len(set(channel_numbers))  
    total_elements = len(cluster_data)  

    print(f"Cluster {cluster_id}:")
    print(f"  Max Channel: {max_channel}")
    print(f"  Min Channel: {min_channel}")
    print(f"  Max Time (ms): {max_time}")
    print(f"  Min Time (ms): {min_time}")
    print(f"  Unique Channels: {unique_channels}")
    print(f"  Total Elements: {total_elements}")
    print("-" * 20)  # Separator between clusters

#filter for peak in each channel

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

print("crackle families:")
print(crackle_families)
print("Crackle Families Metrics:")
for family_id, crackle_family in enumerate(crackle_families):  # Enumerate for family ID
    channel_numbers = [channel for channel, _ in crackle_family]
    times_ms = [time for _, time in crackle_family]

    max_channel = max(channel_numbers)
    min_channel = min(channel_numbers)
    max_time = max(times_ms)
    min_time = min(times_ms)
    unique_channels = len(set(channel_numbers))
    total_elements = len(crackle_family)

    print(f"Family {family_id}:")
    print(f"  Max Channel: {max_channel}")
    print(f"  Min Channel: {min_channel}")
    print(f"  Max Time (ms): {max_time}")
    print(f"  Min Time (ms): {min_time}")
    print(f"  Unique Channels: {unique_channels}")
    print(f"  Total Elements: {total_elements}")
    print("-" * 20)


cross_correlation_families = []

for family_id, crackle_family in enumerate(crackle_families):
    # Find the mother crackle (earliest peak)
    mother_channel, mother_time = min(crackle_family, key=lambda x: x[1])
    # Convert time to sample index
    mother_sample = int(mother_time * sample_rate / 1000)

    print(f"Cluster {family_id +1}: Mother crackle at channel {mother_channel}, time {mother_time} ms")

    # Extract slices around peaks for cross-correlation
    slice_length = int(sample_rate) * (0.18)   #slice(180ms)
    #slice is centered at mother peak

    #print(audio_data[0, int(max(0, mother_sample - slice_length // 2)):int(min(len(audio_data[mother_channel]), mother_sample + slice_length // 2))])
    mother_slice = audio_data[mother_channel][int(max(0, mother_sample - slice_length // 2)):int(min(len(audio_data[mother_channel]), mother_sample + slice_length // 2))]


    autocorrelation = signal.correlate(mother_slice, mother_slice, mode='full')
    autocorrelation_peak = np.max(autocorrelation)

    one_family_cross_correlation = []

    for channel, time in crackle_family:
      if channel == mother_channel:
          print(f"  Channel {channel}, Delay: 0 ms, Transmission Coefficient: 1, Time: {time:.2f} ms")  # Add time
          one_family_cross_correlation.append({'channel': channel, 'delay': 0, 'transmission_coefficient': 1, 'time': time})  # Add time to dictionary
          continue  # Skip autocorrelation (already computed)

      daughter_sample = int(time * sample_rate / 1000)
      daughter_slice = audio_data[channel][int(max(0, mother_sample - slice_length // 2)):int(min(len(audio_data[channel]), mother_sample + slice_length / 2))]

      cross_correlation = signal.correlate(daughter_slice, mother_slice, mode='full')
      cross_correlation_peak = np.max(cross_correlation)

      lags = signal.correlation_lags(len(mother_slice), len(daughter_slice), mode="full")
      lag = lags[np.argmax(cross_correlation)]
      delay = lag / sample_rate * 1000

      transmission_coefficient = cross_correlation_peak / autocorrelation_peak if autocorrelation_peak else 0

      one_family_cross_correlation.append({'channel': channel, 'delay': delay, 'transmission_coefficient': transmission_coefficient, 'time': time})  # Add time to dictionary

      print(f"  Channel {channel}, Delay: {delay:.2f} ms, Transmission Coefficient: {transmission_coefficient:.4f}, Time: {time:.2f} ms")  # Add time to print statement
    print("-" * 20)

    cross_correlation_families.append(one_family_cross_correlation)
print(cross_correlation_families)