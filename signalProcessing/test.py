from pyannote.audio import Pipeline
from dotenv import load_dotenv
import os

load_dotenv()

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token=os.getenv("HF_TOKEN")
)
diarization = pipeline(r"C:\Users\Shun\Documents\4A\CAPSTONE\vocoPal\signalProcessing\audio\long_output.wav")

# Extract speaker segments
speaker_segments = []
for segment, _, speaker in diarization.itertracks(yield_label=True):
    speaker_segments.append({
        "start": segment.start,
        "end": segment.end,
        "speaker": speaker
    })
