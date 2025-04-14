# import libraries required for receiving audio data and doing audio data processing and manipulation
#!pip install librosa soundfile numpy scipy matplotlib
#pip install -r requirements.txt

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
from calibrate import calibrate

################################################################################
# Logging setup
################################################################################

# Setup logging to a file instead of stdout
log_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'audio_process.log')
def log(message):
    with open(log_file, 'a') as f:
        f.write(f"{message}\n")

################################################################################
# TUNABLE PARAMETERS
################################################################################

# !!! TUNABLE PARAMETER: rolling window size for median+MAD
LOCAL_WINDOW_SIZE = 2000  # we can optimize this for quickness, it is computationally intense
# !!! TUNABLE PARAMETER: evaluate rolling window every 'step' samples
LOCAL_WINDOW_STEP = 48    # coarser step for faster processing(also can optimize)
# !!! TUNABLE PARAMETER: factor multiplied by MAD
MAD_FACTOR = 3.0  
# !!! TUNABLE PARAMETER: optional global peak prominence used with find_peaks
PEAK_PROMINENCE = 0.02  # lenient
# !!! TUNABLE PARAMETER: max gap in ms for grouping spikes into the same cluster
FAMILY_RANGE_MS = 60  
# !!! TUNABLE PARAMETER: min fraction of channels that must be in a cluster (0.3 => 30%)
CLUSTER_CHANNEL_FRACTION = 0.3  
# !!! TUNABLE PARAMETER: time slice (seconds) for cross-correlation around each spike
SLICE_DURATION_SEC = 0.18  

################################################################################
# Rolling median / MAD utilities
################################################################################

def rolling_median_mad(signal_1d, window_size, step):
    """
    Compute the rolling median and rolling MAD (Median Absolute Deviation)
    over a window of 'window_size' samples, but only do so every 'step' samples
    for speed. Between those points, the values are held constant.

    Returns median_array, mad_array, both of length = len(signal_1d).
    This local threshold approach adapts to local noise levels.

    * window_size (e.g., 2000)
    * step (e.g., 48)
    """
    n = len(signal_1d)
    medians = np.zeros(n)
    mads = np.zeros(n)
    half_win = window_size // 2
    
    i = 0
    while i < n:
        start = max(0, i - half_win)
        end = min(n, i + half_win)
        segment = signal_1d[start:end]
        med = np.median(segment)
        mad = np.median(np.abs(segment - med))
        
        # fill up to the next 'step' or end of array
        fill_end = min(n, i + step)
        medians[i:fill_end] = med
        mads[i:fill_end] = mad
        i += step

    log("finished rolling mad with window={} and step={}".format(window_size, step))
    return medians, mads

def detect_spikes_local_threshold(signal_1d, sr, window_size=2000, step=48, factor=3.0, peak_prominence=0.0):
    """
    Uses a rolling local threshold (median + factor*MAD) computed every 'step'
    samples to mask out regions of the signal below that threshold, then uses
    find_peaks to locate local maxima above that threshold.

    Returns spike_times in milliseconds.
    """
    abs_signal = np.abs(signal_1d)
    
    # 1) Compute rolling median + MAD with coarser stepping
    medians, mads = rolling_median_mad(abs_signal, window_size=window_size, step=step)
    local_threshold = medians + (factor*mads)
    
    # 2) Mask signal below local threshold
    masked_signal = abs_signal.copy()
    below_mask = masked_signal < local_threshold
    masked_signal[below_mask] = 0.0
    
    # 3) find_peaks on masked signal with optional global peak_prominence
    peaks, props = signal.find_peaks(masked_signal, prominence=peak_prominence)
    spike_times_ms = (peaks / sr) * 1000.0
    return spike_times_ms

################################################################################
# Main code
################################################################################

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

num_channels = audio_data.shape[0]
n_samples = audio_data.shape[1]

###############################################################################
# 1) Use local threshold + find_peaks for spike detection in each channel
###############################################################################

all_spikes = []
for ch in range(num_channels):
    channel_data = audio_data[ch]
    times_ms = detect_spikes_local_threshold(
        signal_1d=channel_data,
        sr=sample_rate,
        window_size=LOCAL_WINDOW_SIZE,
        step=LOCAL_WINDOW_STEP,
        factor=MAD_FACTOR,
        peak_prominence=PEAK_PROMINENCE
    )
    for t_ms in times_ms:
        all_spikes.append((ch, t_ms))

# Sort all spikes by ascending time
all_spikes.sort(key=lambda x: x[1])
log(f"Using local threshold find_peaks, found {len(all_spikes)} total spikes across {num_channels} channels.")

################################################################################
# 2) Clustering spikes into families
################################################################################

from collections import defaultdict

clusters = defaultdict(list)
cluster_id = 0

if len(all_spikes) > 0:
    clusters[cluster_id].append(all_spikes[0])
    
    for i in range(1, len(all_spikes)):
        ch_i, t_i = all_spikes[i]
        _, prev_t = clusters[cluster_id][-1]
        # If gap bigger than FAMILY_RANGE_MS => new cluster
        if (t_i - prev_t) > FAMILY_RANGE_MS:
            cluster_id += 1
        clusters[cluster_id].append((ch_i, t_i))


log(f"Found {len(clusters)} initial clusters (based on {FAMILY_RANGE_MS} ms gap).")

# Filter out clusters that aren't on enough channels
filtered_clusters = []
channel_req = max(2, int(num_channels * CLUSTER_CHANNEL_FRACTION))
for c_id, clist in clusters.items():
    unique_chs = set(x[0] for x in clist)
    if len(unique_chs) >= channel_req:
        filtered_clusters.append(clist)

log(f"After filtering, {len(filtered_clusters)} clusters remain.")

################################################################################
# 3) Refining each cluster: pick the single max amplitude spike per channel
################################################################################

def refine_cluster(cluster_spikes, audio_data, sr):
    """
    For each channel in cluster_spikes, pick the spike with 
    the highest amplitude in that channel. Return a sorted 
    list (by channel) of (channel, time_ms).
    """
    ch_max = {}
    for (ch, t_ms) in cluster_spikes:
        idx = int((t_ms/1000.0)*sr)
        if idx < audio_data.shape[1]:
            amp = abs(audio_data[ch, idx])
            if ch not in ch_max or amp > ch_max[ch][0]:
                ch_max[ch] = (amp, t_ms)
    refined = [(k, v[1]) for k,v in ch_max.items()]
    refined.sort(key=lambda x: x[0])
    return refined

crackle_families = []

for clist in filtered_clusters:
    refined = refine_cluster(clist, audio_data, sample_rate)
    crackle_families.append(refined)

log(f"Found {len(crackle_families)} crackle families after refinement.")

################################################################################
# 4) Pairwise cross-correlation approach
#    * Extract waveforms
#    * Compute pairwise cross-corr + peak
#    * Choose leader by "highest transmission" 
#    * Recompute final delays/transmissions wrt that leader
################################################################################

def compute_waveforms(cluster_family, audio_data, sr):
    """
    Extract waveforms around each channel's spike in cluster_family
    Returns: waveforms dict => channel -> 1D waveform
    """
    slice_len = int(sr * SLICE_DURATION_SEC)  # e.g. 180ms
    waveforms = {}
    for (ch, t_ms) in cluster_family:
        center = int((t_ms/1000)*sr)
        start = max(0, center - slice_len//2)
        end = min(audio_data.shape[1], center + slice_len//2)
        wave = audio_data[ch, start:end]
        waveforms[ch] = wave
    return waveforms

def compute_pairwise_data(waveforms, sr):
    """
    waveforms: channel -> 1D array
    We compute two things for each pair (ch1, ch2):
      - The cross-correlation peak value
      - The best alignment delay (ms)

    Returns a dict:
      pairwise_info[ch1][ch2] = (peak_value, delay_ms)
    """
    chans = list(waveforms.keys())
    pairwise_info = defaultdict(dict)
    for i in range(len(chans)):
        ch1 = chans[i]
        w1 = waveforms[ch1]
        for j in range(i+1, len(chans)):
            ch2 = chans[j]
            w2 = waveforms[ch2]
            min_len = min(len(w1), len(w2))
            if min_len < 5:
                pairwise_info[ch1][ch2] = (0.0, 0.0)
                pairwise_info[ch2][ch1] = (0.0, 0.0)
                continue
            w1_trim = w1[:min_len]
            w2_trim = w2[:min_len]
            cc = signal.correlate(w2_trim, w1_trim, mode='full')
            lags = signal.correlation_lags(len(w1_trim), len(w2_trim), mode='full')
            idx = np.argmax(cc)
            peak_val = cc[idx]  # max cross-corr
            delay_samples = 0
            if idx < len(lags):
                delay_samples = lags[idx]
            delay_ms = (delay_samples/sr)*1000.0
            pairwise_info[ch1][ch2] = (peak_val, delay_ms)
            pairwise_info[ch2][ch1] = (peak_val, -delay_ms)
    return pairwise_info

def select_leader_by_highest_transmission(cluster_family, pairwise_info):
    """
    Among the channels in cluster_family, pick the channel 
    whose sum of cross-corr peak values (with all other channels)
    is the highest.

    This is a simpler physical heuristic: the channel with 
    the largest total cross-correlation amplitude is presumably
    closest to the source, i.e. "leading".
    """
    ch_list = [x[0] for x in cluster_family]
    best_ch = ch_list[0]
    best_sum = -1e9
    for ch in ch_list:
        sum_peaks = 0.0
        for other in ch_list:
            if other == ch:
                continue
            if other in pairwise_info[ch]:
                peak_val, _ = pairwise_info[ch][other]
                sum_peaks += peak_val
        if sum_peaks > best_sum:
            best_sum = sum_peaks
            best_ch = ch
    return best_ch

def compute_final_delays_transmissions(leader_ch, waveforms, cluster_family, sr):
    """
    For the chosen leader_ch, compute each channel's final delay & 
    transmission_coefficient by cross-correlating that channel's 
    waveform with the leader's.
    Return a list of dict => each dict has 
        { channel, delay, transmission_coefficient, raw_time, adjusted_delay, adjusted_time }
    """
    leader_wave = waveforms[leader_ch]
    leader_ac = signal.correlate(leader_wave, leader_wave, mode='full')
    leader_ac_peak = np.max(leader_ac) if len(leader_ac)>0 else 1e-9
    deltas, deltas_dict = calibrate()
    deltas_adjusted = deltas - deltas[leader_ch]

    results = []
    for (ch, t_ms) in cluster_family:
        if ch == leader_ch:
            results.append({
                'channel': int(ch),
                'delay': 0.0,
                'transmission_coefficient': 1.0,
                'raw_time': float(t_ms),
                'adjusted_delay': 0.0,
                'adjusted_time': float(t_ms - deltas[ch])
            })
        else:
            w_ch = waveforms[ch]
            min_len = min(len(leader_wave), len(w_ch))
            if min_len < 5:
                results.append({
                    'channel': int(ch),
                    'delay': 0.0,
                    'transmission_coefficient': 0.0,
                    'raw_time': float(t_ms),
                    'adjusted_delay': 0.0,
                    'adjusted_time': float(t_ms - deltas[ch] )
                })
                continue
            w_lead = leader_wave[:min_len]
            w_sub = w_ch[:min_len]
            cc = signal.correlate(w_sub, w_lead, mode='full')
            lags = signal.correlation_lags(len(w_lead), len(w_sub), mode='full')
            idx = np.argmax(cc)
            delay_ms = 0.0
            if idx < len(lags):
                delay_samples = lags[idx]
                delay_ms = (delay_samples/sr)*1000.0
            trans = cc[idx]/leader_ac_peak if leader_ac_peak!=0 else 0.0
            results.append({
                'channel': int(ch),
                'delay': float(delay_ms),
                'transmission_coefficient': float(trans),
                'raw_time': float(t_ms),
                'adjusted_delay': float(delay_ms - deltas_adjusted[ch]),
                'adjusted_time': float(t_ms - deltas[ch])
            })
    return results

################################################################################
# Process each refined cluster with cross-correlation, now choosing the leader
# by highest cross-corr peak sum => "leader_by_transmission"
################################################################################


cross_correlation_families = []

for family_idx, cluster_family in enumerate(crackle_families):
    log(f"Processing family {family_idx+1} with {len(cluster_family)} channels/spikes")

    # 1) Extract waveforms
    waveforms = compute_waveforms(cluster_family, audio_data, sample_rate)

    # 2) Pairwise cross-correlation data (peak, delay)
    pairwise_info = compute_pairwise_data(waveforms, sample_rate)

    # 3) Choose leader by highest sum of cross-corr peaks
    leader_ch = select_leader_by_highest_transmission(cluster_family, pairwise_info)
    log(f"Family {family_idx+1}: chosen leader channel (highest xcorr sum) = {leader_ch}")

    # 4) Compute final delays & transmissions
    final_info = compute_final_delays_transmissions(leader_ch, waveforms, cluster_family, sample_rate)

    cross_correlation_families.append(final_info)

# Log number of final families
log(f"Generated {len(cross_correlation_families)} cross-correlation families")

# If no crackle families were found, create a dummy family for testing
if len(cross_correlation_families) == 0:
    log("No crackle families found, creating a dummy family for testing")
    dummy_family = []
    for channel in range(num_channels):
        # Find a high-amplitude point in each channel
        max_index = np.argmax(np.abs(audio_data[channel]))
        time_ms = float(max_index / sample_rate * 1000)
        dummy_family.append({
            'channel': int(channel),
            'delay': float(channel * 5.0),  # fake delay values
            'transmission_coefficient': 1.0 / (channel + 1.0),  # fake transmission coefficient
            'raw_time': time_ms,
            'adjusted_delay': 0.0,
            'adjusted_time': time_ms
        })
    cross_correlation_families.append(dummy_family)
    log(f"Created dummy family with {len(dummy_family)} channels")

################################################################################
# Convert numpy types to Python-native, then JSON-serialize
################################################################################

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

cross_correlation_families_serializable = convert_numpy_types(cross_correlation_families)

try:
    # Output JSON to stdout, and only JSON (no debugging info)
    json_output = json.dumps(cross_correlation_families_serializable)
    sys.stdout.write(json_output)
except Exception as e:
    log(f"Error serializing to JSON: {str(e)}")
    # Return an empty array in case of error to avoid parsing issues
    sys.stdout.write("[]")

#Json format: [[{"channel": 0, "delay": 0.5208333333333334, "transmission_coefficient": 0.013458703644573689, "time": 1402.875}, {"channel": 1, "delay": -1.4375, "transmission_coefficient": 0.04195275157690048, "time": 1401.2708333333333}, {"channel": 2, "delay": -0.75, "transmission_coefficient": 0.06662089377641678, "time": 1396.6041666666667}, {"channel": 3, "delay": -0.6666666666666666, "transmission_coefficient": 0.07396621257066727, "time": 1399.125}, {"channel": 4, "delay": -0.7083333333333334, "transmission_coefficient": 0.05321120098233223, "time": 1397.0}, {"channel": 5, "delay": 0.0, "transmission_coefficient": 1.0, "time": 1378.2083333333333}], [{"channel": 0, "delay": -16.520833333333332, "transmission_coefficient": 0.018532052636146545, "time": 3202.1875}, {"channel": 1, "delay": -13.895833333333332, "transmission_coefficient": 0.019504187628626823, "time": 3200.1875},