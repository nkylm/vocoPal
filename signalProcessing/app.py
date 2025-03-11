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
    "speech_rate_fluctuation", "pitch_fluctuation"
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
    
    for i in range(0, len(y), chunk_size):
        chunk = y[i:i + chunk_size]
        
        # Skip chunks that are too short (less than 1 second)
        if len(chunk) < sr:
            continue
            
        # Save chunk temporarily
        chunk_path = os.path.join(root_folder, "audio/temp_chunk.wav")
        sf.write(chunk_path, chunk, sr)
        
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
            # Clean up temporary file
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

def analyze_audio_file():
    # Run main Praat analysis
    objects = run_file(praat_script, -20, 2, 0.3, 0, output_path, root_folder, 80, 400, 0.01, capture_output=True)
    z1=str(objects[1])
    z2=z1.strip().split()
    z3=np.array(z2)
    z4=np.array(z3)[np.newaxis]
    z5=z4.T
    z5_single = z5[:, 0]
    
    # Calculate speech rate fluctuation
    fluctuation, chunk_rates = calculate_speech_rate_fluctuation(output_path)
    
    # Create dictionary with original features
    json_dict = dict(zip(features[:-1], z5_single))  # Exclude the last feature (speech_rate_fluctuation)
    
    # Add speech rate fluctuation
    json_dict["speech_rate_fluctuation"] = float(fluctuation)
    
    # Calculate and add pitch fluctuation
    pitch_fluctuation = calculate_pitch_fluctuation(json_dict["f0_min"], json_dict["f0_max"])
    json_dict["pitch_fluctuation"] = pitch_fluctuation
    
    # Add chunk rates for detailed analysis if needed
    # json_dict["chunk_speech_rates"] = chunk_rates
    
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
