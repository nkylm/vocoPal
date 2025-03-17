from flask import Flask, request, jsonify
import contextlib
import subprocess
import io
import os
import re
import glob

import parselmouth
from parselmouth.praat import call, run_file
import numpy as np
import pandas as pd
import scipy
from scipy.stats import binom, ks_2samp, ttest_ind
import librosa
import soundfile as sf

from analysis_parser import parse_analysis_output, print_analysis_history

app = Flask(__name__)

root_folder = os.path.abspath("./")
praat_script = root_folder + "/myspsolution.praat"
output_path = root_folder + "/audio/output.wav"
# Feature names
features = [
    "number_of_syllables", "number_of_pauses", "rate_of_speech", "articulation_rate",
    "speaking_duration", "original_duration", "balance", "f0_mean", "f0_std",
    "f0_median", "f0_min", "f0_max", "f0_quantile25", "f0_quan75",
    "speech_rate_fluctuation", "pitch_fluctuation", "relative_volume"
]

def calculate_speech_rate_fluctuation(audio_path, chunk_duration=5.0):
    """
    Calculate speech rate fluctuation by analyzing chunks of audio.
    
    Args:
        audio_path: Path to the audio file
        chunk_duration: Duration of each chunk in seconds
    
    Returns:
        float: Standard deviation of speech rates across chunks
        list: List of speech rates for each chunk
    """
    # Load audio
    y, sr = librosa.load(audio_path, sr=None)
    
    # Calculate chunk size in samples
    chunk_size = int(chunk_duration * sr)
    
    # Split audio into chunks
    chunk_rates = []
    
    # Create all chunks first
    chunks = []
    chunk_paths = []
    for i in range(0, len(y), chunk_size):
        chunk = y[i:i + chunk_size]
        # Skip chunks that are too short (less than 1 second)
        if len(chunk) < sr:
            continue
        chunks.append(chunk)
        chunk_path = os.path.join(root_folder, f"audio/temp_chunk_{i}.wav")
        chunk_paths.append(chunk_path)
        sf.write(chunk_path, chunk, sr)
    
    try:
        # Analyze all chunks
        for chunk_path in chunk_paths:
            try:
                # Analyze chunk using Praat
                objects = run_file(praat_script, -20, 2, 0.3, 0, chunk_path, root_folder, 80, 400, 0.01, capture_output=True)
                chunk_data = str(objects[1]).strip().split()
                
                # Get speech rate (syllables per second) - index 2 in the Praat output
                if len(chunk_data) >= 3:  # Ensure we have enough data
                    speech_rate = float(chunk_data[2])
                    chunk_rates.append(speech_rate)
            except:
                # Skip chunks that can't be analyzed
                continue
    finally:
        # Clean up all temporary files at once
        for chunk_path in chunk_paths:
            if os.path.exists(chunk_path):
                os.remove(chunk_path)
    
    # Calculate fluctuation (standard deviation)
    if chunk_rates:
        fluctuation = np.std(chunk_rates)
    else:
        fluctuation = 0.0
        
    return fluctuation, chunk_rates

def calculate_pitch_fluctuation(f0_min, f0_max):
    """
    Calculate pitch fluctuation as the difference between maximum and minimum f0.
    
    Args:
        f0_min: Minimum fundamental frequency
        f0_max: Maximum fundamental frequency
    
    Returns:
        float: Pitch fluctuation (f0_max - f0_min)
    """
    return float(f0_max) - float(f0_min)
    "f0_median", "f0_min", "f0_max", "f0_quantile25", "f0_quan75"


def calculate_relative_volume(y, sr, frame_length=2048):
    """
    Calculate the volume difference between speech and noise segments.
    
    Args:
        y: Audio signal
        sr: Sample rate
        frame_length: Frame length for analysis
    
    Returns:
        float: Volume difference between speech and noise in dB
    """
    # Create preprocessed version for analysis
    y_processed = librosa.effects.preemphasis(y.copy())
    
    # Calculate features with 75% overlap
    hop_length = frame_length // 4
    rms = librosa.feature.rms(y=y_processed, frame_length=frame_length, hop_length=hop_length)[0]
    spectral_centroid = librosa.feature.spectral_centroid(y=y_processed, sr=sr, hop_length=hop_length)[0]
    zero_crossing = librosa.feature.zero_crossing_rate(y=y_processed, frame_length=frame_length, hop_length=hop_length)[0]
    
    # Adaptive threshold calculation
    noise_sample = y_processed[:int(0.5*sr)]
    noise_rms = librosa.feature.rms(y=noise_sample, frame_length=frame_length)[0]
    threshold_db = librosa.amplitude_to_db(np.percentile(noise_rms, 50)) + 2
    
    # Convert features to compatible dimensions
    rms_db = librosa.amplitude_to_db(rms)
    times = librosa.times_like(rms, sr=sr, hop_length=hop_length)
    
    # Speech detection
    speech_frames = (
        (rms_db > threshold_db) &
        ((spectral_centroid > 1100) |
         (zero_crossing < 0.15))
    )
    
    # Collect speech and noise samples
    speech_samples = []
    noise_samples = []
    
    for i in range(len(speech_frames)):
        start_sample = int(times[i] * sr)
        end_sample = int(min((times[i] + hop_length/sr) * sr, len(y)))
        frame = y[start_sample:end_sample]
        
        if speech_frames[i]:
            speech_samples.append(frame)
        else:
            noise_samples.append(frame)
    
    # Calculate RMS values
    if speech_samples:
        speech_concat = np.concatenate(speech_samples)
        speech_rms = np.sqrt(np.mean(speech_concat**2))
        speech_vol_db = 20 * np.log10(speech_rms)
    else:
        speech_vol_db = -np.inf
        
    if noise_samples:
        noise_concat = np.concatenate(noise_samples)
        noise_rms = np.sqrt(np.mean(noise_concat**2))
        noise_vol_db = 20 * np.log10(noise_rms)
    else:
        noise_vol_db = -np.inf
    
    return speech_vol_db - noise_vol_db

def analyze_audio_file():
    """Analyze audio file and return metrics including speech rate fluctuation"""
    # Load audio for volume analysis
    y, sr = librosa.load(output_path, sr=None)
    
    # Run main Praat analysis first to get all metrics
    objects = run_file(praat_script, -20, 2, 0.3, 0, output_path, root_folder, 80, 400, 0.01, capture_output=True)
    z1=str(objects[1])
    z2=z1.strip().split()
    z3=np.array(z2)
    z4=np.array(z3)[np.newaxis]
    z5=z4.T
    z5_single = z5[:, 0]
    
    # Create dictionary with original features
    json_dict = dict(zip(features, z5_single))  # Exclude the last two features (speech_rate_fluctuation and pitch_fluctuation)
    
    # Calculate and add pitch fluctuation first (faster calculation)
    pitch_fluctuation = calculate_pitch_fluctuation(json_dict["f0_min"], json_dict["f0_max"])
    json_dict["pitch_fluctuation"] = pitch_fluctuation
    
    # Calculate speech rate fluctuation last (slower calculation)
    fluctuation, chunk_rates = calculate_speech_rate_fluctuation(output_path)
    json_dict["speech_rate_fluctuation"] = float(fluctuation)
    
    # Calculate and add relative volume
    relative_volume = calculate_relative_volume(y, sr)
    json_dict["relative_volume"] = float(relative_volume)
    
    return json_dict

@app.route('/process', methods=['POST'])
def process_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    audio_file = request.files['audio']

    try:
        # Save with fixed filename
        with open(output_path, 'wb') as output_file:
            audio_file.save(output_file) 
            output_file.flush()

            # Pass explicit path to analysis function
            analysis_result = analyze_audio_file()
            print(analysis_result)           

        # os.remove(output_path)

        return analysis_result

    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001)
