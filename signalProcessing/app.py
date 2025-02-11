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
    "f0_median", "f0_min", "f0_max", "f0_quantile25", "f0_quan75"
]

def analyze_audio_file():
    objects = run_file(praat_script, -20, 2, 0.3, 0, output_path, root_folder, 80, 400, 0.01, capture_output=True)
    z1=str(objects[1]) # This will print the info from the textgrid object, and objects[1] is a parselmouth.Data object with a TextGrid inside
    z2=z1.strip().split()
    z3=np.array(z2)
    z4=np.array(z3)[np.newaxis]
    z5=z4.T
    z5_single = z5[:, 0]

    # Create dictionary
    json_dict = dict(zip(features, z5_single))
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
