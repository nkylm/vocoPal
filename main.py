import io
from contextlib import redirect_stdout
from audio_recorder import record_audio
from analysis_parser import parse_analysis_output, print_analysis_history
import config

mysp = __import__("my-voice-analysis")

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
            print(audio_dict)

    except KeyboardInterrupt:
        print("\nStopped recording.")
        print(print_analysis_history())

if __name__ == "__main__":
    main()
