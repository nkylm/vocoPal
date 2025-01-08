# Eventually main.py will be converted into this. This will be for flask app

from flask import Flask, request, jsonify
import os
import io
from contextlib import redirect_stdout
import tempfile

mysp = __import__("my-voice-analysis")
from analysis_parser import parse_analysis_output

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    audio_file = request.files['audio']
    print(f"audio_file: {audio_file}")

    try:
        # Save the audio to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(audio_file.read())
            temp_audio_path = temp_audio.name

        print(f"temp_audio: {temp_audio}")
        print(f"temp_audio_path: {temp_audio_path}")


        if os.path.exists(temp_audio_path):
            print("Path exists!")
        else:
            print("Path does not exist!")
        
        file_name = os.path.splitext(os.path.basename(temp_audio_path))[0]
        print(f"file_name: {file_name}")

        # Get the directory path without the file name
        temp_audio_dir = os.path.dirname(temp_audio_path)
        print(f"Temporary directory path: {temp_audio_dir}")

        formatted_path = os.path.normpath(temp_audio_dir)
        print(f"formatted_path: {formatted_path}")

        test_path=r"/var/folders/tm/s06z31rs1094grxnbc04vmfc0000gn/T"

        # Run analysis with my-voice-analysis
        output_buffer = io.StringIO()
        with redirect_stdout(output_buffer):
            mysp.mysptotal(file_name, test_path)
        analysis_output = output_buffer.getvalue()

        print(f"analysis_output: {analysis_output}")

        # Parse the results
        audio_dict = parse_analysis_output(analysis_output)

        # Delete the temporary file
        os.remove(temp_audio_path)

        # Return the results
        return jsonify(audio_dict)

    except Exception as e:
        print(f"Error processing audio: {e}")
        return jsonify({"error": "Failed to process audio file"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001)
