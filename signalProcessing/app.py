from flask import Flask, request, jsonify
from flask_cors import CORS
import contextlib
import subprocess
import io
import os
import re
import glob
import logging
import sys

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
CORS(app)  # Enable CORS for all routes

# Configure logging to both file and console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

root_folder = os.path.abspath("./")
praat_script = root_folder + "/myspsolution.praat"
output_path = root_folder + "/audio/output.wav"
# Feature names
features = [
    "number_of_syllables", "number_of_pauses", "rate_of_speech", "articulation_rate",
    "speaking_duration", "original_duration", "balance", "f0_mean", "f0_std",
    "f0_median", "f0_min", "f0_max", "f0_quantile25", "f0_quan75",
    "speech_rate_fluctuation", "pitch_fluctuation", "relative_volume", "ambient_noise"
]

def split_audio_into_chunks(y, sr, chunk_duration=5.0):
    """
    Split audio into chunks of specified duration.
    
    Args:
        y: Audio signal
        sr: Sample rate
        chunk_duration: Duration of each chunk in seconds
    
    Returns:
        list: List of chunk paths
    """
    # Calculate chunk size in samples
    chunk_size = int(chunk_duration * sr)
    
    # Create chunks and save them
    chunk_paths = []
    for i in range(0, len(y), chunk_size):
        chunk = y[i:i + chunk_size]
        # Skip chunks that are too short (less than 1 second)
        if len(chunk) < sr:
            continue
        chunk_path = os.path.join(root_folder, f"audio/temp_chunk_{i}.wav")
        chunk_paths.append(chunk_path)
        sf.write(chunk_path, chunk, sr)
    
    return chunk_paths

def calculate_chunk_volume(chunk_path, frame_length=2048):
    """
    Calculate volume difference for a single chunk.
    
    Args:
        chunk_path: Path to the audio chunk
        frame_length: Frame length for analysis
    
    Returns:
        tuple: (volume_difference, noise_db)
    """
    y, sr = librosa.load(chunk_path, sr=None)
    return calculate_relative_volume(y, sr, frame_length)

def calculate_speech_rate_fluctuation(audio_path, chunk_duration=5.0):
    """
    Calculate speech rate and volume fluctuations by analyzing chunks of audio.
    
    Args:
        audio_path: Path to the audio file
        chunk_duration: Duration of each chunk in seconds
    
    Returns:
        tuple: (speech_rate_fluctuation, volume_fluctuation, chunk_rates, chunk_volumes)
    """
    # Load audio
    y, sr = librosa.load(audio_path, sr=None)
    
    # Split audio into chunks
    chunk_paths = split_audio_into_chunks(y, sr, chunk_duration)
    
    chunk_rates = []
    chunk_volumes = []
    
    try:
        # Analyze all chunks
        for i, chunk_path in enumerate(chunk_paths):
            try:
                # Analyze chunk using Praat for speech rate
                objects = run_file(praat_script, -20, 2, 0.3, 0, chunk_path, root_folder, 80, 400, 0.01, capture_output=True)
                chunk_data = str(objects[1]).strip().split()
                
                # Get speech rate (syllables per second) - index 2 in the Praat output
                if len(chunk_data) >= 3:  # Ensure we have enough data
                    speech_rate = float(chunk_data[2])
                    chunk_rates.append(speech_rate)
                
                # Calculate volume difference for this chunk
                volume_diff, noise_db = calculate_chunk_volume(chunk_path)  # Get both values
                chunk_volumes.append(volume_diff)
                
            except Exception as e:
                print(f"Error processing chunk {chunk_path}: {str(e)}")
                continue
    finally:
        # Clean up all temporary files at once
        for chunk_path in chunk_paths:
            if os.path.exists(chunk_path):
                os.remove(chunk_path)
    
    # Calculate fluctuations
    if chunk_rates:
        speech_rate_fluctuation = max(chunk_rates) - min(chunk_rates)  # Difference between max and min
    else:
        speech_rate_fluctuation = 0.0
        
    volume_fluctuation = np.std(chunk_volumes) if chunk_volumes else 0.0
    
    # print("\nSummary:")
    # print(f"Number of chunks analyzed: {len(chunk_volumes)}")
    # print(f"Volume fluctuation (std dev): {volume_fluctuation:.2f} dB")
    # print(f"Speech rate fluctuation (max-min): {speech_rate_fluctuation:.2f} syllables/sec")
    # print(f"Max speech rate: {max(chunk_rates):.2f if chunk_rates else 0} syllables/sec")
    # print(f"Min speech rate: {min(chunk_rates):.2f if chunk_rates else 0} syllables/sec")
    # print(f"Average volume difference: {np.mean(chunk_volumes):.2f if chunk_volumes else 0} dB")
    # print(f"Average speech rate: {np.mean(chunk_rates):.2f if chunk_rates else 0} syllables/sec")
        
    return speech_rate_fluctuation, volume_fluctuation, chunk_rates, chunk_volumes

def calculate_pitch_fluctuation(f0_min, f0_max):
    """
    Calculate pitch fluctuation as the difference between maximum and minimum f0.
    
    Args:
        f0_min: Minimum fundamental frequency
        f0_max: Maximum fundamental frequency
    
    Returns:
        float: Pitch fluctuation (f0_max - f0_min)
    """
    try:
        # Convert to float and handle potential string values
        f0_min = float(f0_min) if f0_min is not None else 0.0
        f0_max = float(f0_max) if f0_max is not None else 0.0
        
        # Return 0 if either value is 0 or invalid
        if f0_min <= 0 or f0_max <= 0:
            return 0.0
            
        return f0_max - f0_min
    except (ValueError, TypeError):
        return 0.0

def classify_ambient_noise(noise_db):
    """
    Classify ambient noise level based on dB value.
    
    Args:
        noise_db: Noise level in dB
    
    Returns:
        str: Classification of ambient noise ("muted", "quiet", or "noisy")
    """
    if noise_db < -50:  # Very quiet background
        return "muted"
    elif noise_db < -30:  # Moderate background noise
        return "quiet"
    else:  # High background noise
        return "noisy"

def calculate_relative_volume(y, sr, frame_length=2048):
    """
    Calculate the volume difference between speech and noise segments.
    
    Args:
        y: Audio signal
        sr: Sample rate
        frame_length: Frame length for analysis
    
    Returns:
        tuple: (volume_difference, noise_db)
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
    
    return speech_vol_db - noise_vol_db, noise_vol_db

def analyze_audio_file():
    """Analyze audio file and return metrics including speech rate and volume fluctuations"""
    
    logger.info('analyze_audio_file')
    
    logger.info(f'output_path: {output_path}')

    try:
        if not os.path.exists(output_path):
            logger.error(f"File not found: {output_path}")
        else:
            logger.info(f"File found: {output_path}, attempting to load...")

        y, sr = sf.read(output_path)
        logger.info(f"Audio loaded successfully: {y.shape}, {sr}")

    except Exception as e:
        logger.error(f"Error loading audio file {output_path}: {e}")
        y, sr = None, None  # Assign None to avoid undefined variables
        logger.info(f'y, sr: {y, sr}')
        
    # Run main Praat analysis first to get all metrics
    objects = run_file(praat_script, -20, 2, 0.3, 0, output_path, root_folder, 80, 400, 0.01, capture_output=True)
    z1=str(objects[1])

    logger.info(f'objects: {object}')

    if z1 == "A noisy background or unnatural-sounding speech detected. No result try again\n":
        return {"error": "Noisy background or unnatural-sounding speech detected, analysis failed"}
    
    z2=z1.strip().split()
    z3=np.array(z2)
    z4=np.array(z3)[np.newaxis]
    z5=z4.T
    z5_single = z5[:, 0]
    
    # Create dictionary with original features
    json_dict = dict(zip(features, z5_single))  # Exclude the last three features

    logger.info(f'json_dict: {json_dict}')
    
    # Calculate speech rate and volume fluctuations last (slower calculation)
    speech_rate_fluctuation, volume_fluctuation, chunk_rates, chunk_volumes = calculate_speech_rate_fluctuation(output_path)
    json_dict["speech_rate_fluctuation"] = float(speech_rate_fluctuation)
    json_dict["volume_fluctuation"] = float(volume_fluctuation)
    
    logger.info(f'speech_rate_fluctuation: {speech_rate_fluctuation, volume_fluctuation, chunk_rates, chunk_volumes}')

    # Calculate and add overall relative volume and ambient noise
    relative_volume, noise_db = calculate_relative_volume(y, sr)
    json_dict["relative_volume"] = float(relative_volume)
    json_dict["ambient_noise"] = classify_ambient_noise(noise_db)
    
    logger.info(f'relative_volume, noise_db: {relative_volume, noise_db}')

    return json_dict

@app.route('/process', methods=['POST'])
def process_audio():
    logger.info('Received audio processing request')
    
    if 'audio' not in request.files:
        logger.warning('No audio file in request')
        return jsonify({"error": "No audio file uploaded"}), 400

    audio_file = request.files['audio']
    logger.info('Processing audio file')

    try:
        # Save with fixed filename
        with open(output_path, 'wb') as output_file:
            logger.info(f'Output path: {output_path}')
            logger.info(f'Output file: {output_file}')
            audio_file.save(output_file) 
            output_file.flush()

            # Pass explicit path to analysis function
            analysis_result = analyze_audio_file()
            logger.info('Analysis completed successfully')
            logger.info(f'Analysis result: {analysis_result}')

            # Check if the result contains an error
            if "error" in analysis_result:
                logger.warning(f'Analysis failed: {analysis_result["error"]}')
                return jsonify(analysis_result), 400

        return jsonify(analysis_result)

    except Exception as e:
        logger.error(f'Error processing audio: {str(e)}', exc_info=True)
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    logger.info('Health check requested')
    return jsonify({"status": "healthy"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    logger.info(f'Starting server on port {port}')
    app.run(host="0.0.0.0", port=port)
