import io
from contextlib import redirect_stdout
from audio_recorder import record_audio
from analysis_parser import parse_analysis_output
from utils import check_params_against_threshold
import config

mysp = __import__("my-voice-analysis")
THRESHOLDS = {'f0_mean': [100, 200], 'rate_of_speech': [2, 5]}

def main():
    print("Press Ctrl+C to stop recording.")
    try:
        while True:
            # Record audio
            record_audio(config.WAVE_OUTPUT_FILENAME, record_seconds=config.RECORD_SECONDS, 
                         chunk=config.CHUNK, format=config.FORMAT, 
                         channels=config.CHANNELS, rate=config.RATE)

            # Run analysis
            output_buffer = io.StringIO()
            with redirect_stdout(output_buffer):
                mysp.mysptotal(config.AUDIO_FILE, config.PATH_TO_FILE)
            analysis_output = output_buffer.getvalue()

            # Parse and print results
            audio_dict = parse_analysis_output(analysis_output)
            threshold_results = {}
            if audio_dict:
                threshold_results = check_params_against_threshold(audio_dict, THRESHOLDS)
            print(audio_dict)
            print(threshold_results)

    except KeyboardInterrupt:
        print("\nStopped recording.")

if __name__ == "__main__":
    main()
