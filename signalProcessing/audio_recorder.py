import pyaudio
import wave

def record_audio(filename, record_seconds=20, chunk=1024, format=pyaudio.paInt16, channels=2, rate=44100):
    """Records audio for a specified duration and saves it to a WAV file."""
    p = pyaudio.PyAudio()
    stream = p.open(format=format,
                    channels=channels,
                    rate=rate,
                    input=True,
                    frames_per_buffer=chunk)

    print("Recording...")
    frames = []
    for _ in range(0, int(rate / chunk * record_seconds)):
        data = stream.read(chunk)
        frames.append(data)
    
    print("Finished recording.")

    # Save to WAV file
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(p.get_sample_size(format))
        wf.setframerate(rate)
        wf.writeframes(b''.join(frames))
    
    stream.stop_stream()
    stream.close()
    p.terminate()

record_audio(r'C:\Users\Shun\Documents\4A\CAPSTONE\vocoPal\signalProcessing\audio\test.wav', 20)