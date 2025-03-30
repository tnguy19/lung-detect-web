import sys
import numpy as np
import soundfile as sf
import librosa
import wave

def combine_wav_files(output_path, input_paths):
    """
    Combine multiple mono WAV files into a single multi-channel WAV file.
    
    Args:
        output_path (str): Path to save the combined WAV file
        input_paths (list): List of paths to the input WAV files
    """
    print(f"Combining {len(input_paths)} WAV files into {output_path}")
    
    # Read all input files
    audio_data = []
    sample_rates = []
    
    for path in input_paths:
        print(f"Reading file: {path}")
        data, sr = librosa.load(path, sr=None, mono=True)
        print(f"File loaded with shape: {data.shape}, sample rate: {sr}")
        audio_data.append(data)
        sample_rates.append(sr)
    
    # Check if all sample rates are the same
    if len(set(sample_rates)) > 1:
        print(f"Warning: Input files have different sample rates: {sample_rates}")
        print("Resampling to the highest sample rate.")
        max_sr = max(sample_rates)
        
        # Resample all audio to the highest sample rate
        for i in range(len(audio_data)):
            if sample_rates[i] != max_sr:
                audio_data[i] = librosa.resample(audio_data[i], orig_sr=sample_rates[i], target_sr=max_sr)
        
        sample_rate = max_sr
    else:
        sample_rate = sample_rates[0]
    
    # Find the length of the shortest file
    min_length = min(len(data) for data in audio_data)
    print(f"Minimum file length: {min_length} samples")
    
    # Trim or pad all audio data to the same length
    for i in range(len(audio_data)):
        if len(audio_data[i]) > min_length:
            print(f"Trimming file {i+1} from {len(audio_data[i])} to {min_length} samples")
            audio_data[i] = audio_data[i][:min_length]
        elif len(audio_data[i]) < min_length:
            print(f"Padding file {i+1} from {len(audio_data[i])} to {min_length} samples")
            padding = np.zeros(min_length - len(audio_data[i]))
            audio_data[i] = np.concatenate((audio_data[i], padding))
    
    # Stack the audio data to create a multi-channel array
    # Shape should be (num_channels, num_samples)
    combined = np.vstack(audio_data)
    print(f"Combined data shape: {combined.shape}")
    
    # Verify we have a multi-channel array
    if combined.ndim != 2:
        print("Error: Failed to create multi-channel array")
        return False
    
    # Write using soundfile for better multi-channel support
    # Note: soundfile expects (num_samples, num_channels) so we transpose
    sf.write(output_path, combined.T, sample_rate)
    
    # Double-check that the file was written with correct number of channels
    with wave.open(output_path, 'rb') as wf:
        channels = wf.getnchannels()
        print(f"Successfully wrote file with {channels} channels")
        if channels != len(input_paths):
            print("Warning: Number of channels in output file doesn't match number of input files!")
    
    print(f"Successfully combined {len(input_paths)} files into a multi-channel WAV file")
    return True

if __name__ == "__main__":
    # Check command-line arguments
    if len(sys.argv) < 3:
        print("Usage: python combine_wav.py <output_path> <input_path1> [input_path2] [input_path3] ...")
        sys.exit(1)
    
    output_path = sys.argv[1]
    input_paths = sys.argv[2:]
    
    combine_wav_files(output_path, input_paths)