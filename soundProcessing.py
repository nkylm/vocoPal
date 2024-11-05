import pyaudio
import wave
import time

mysp = __import__("my-voice-analysis")

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
WAVE_OUTPUT_FILENAME = "output.wav"

p = pyaudio.PyAudio()

stream = p.open(format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK)

print("Recording... Press Ctrl+C to stop")

try:
    while True:
        frames = []

        # Record for a fixed duration (e.g., 10 seconds) before analysis
        RECORD_SECONDS = 10
        for _ in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
            data = stream.read(CHUNK)
            frames.append(data)

        # Save the current recording to a WAV file
        wf = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(p.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b''.join(frames))
        wf.close()

        # Run analysis on the new WAV file
        audio_file = "output"
        path_to_file = r"C:\\Users\Shun\Documents\\4A\\CAPSTONE\\VocoPal"  # Update this path as needed
        mysp.mysptotal(audio_file, path_to_file)

        # Optionally, add a short sleep to control loop timing
        time.sleep(1)

except KeyboardInterrupt:
    print("\nStopped recording")

finally:
    stream.stop_stream()
    stream.close()
    p.terminate()
