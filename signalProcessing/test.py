import librosa
import numpy as np
from scipy import signal
from scipy.ndimage import binary_closing
import matplotlib.pyplot as plt
import soundfile as sf
import os

def analyze_audio(file_path, output_dir='output', frame_length=2048, min_speech_duration=0.2):
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Load audio without preprocessing first to keep original for output
    y_original, sr = librosa.load(file_path, sr=None)
    
    # Create preprocessed version for analysis
    y = librosa.effects.preemphasis(y_original.copy())  # Use copy for analysis
    
    # Calculate features with 75% overlap
    hop_length = frame_length // 4
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop_length)[0]
    zero_crossing = librosa.feature.zero_crossing_rate(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    
    # Adaptive threshold calculation - slightly less lenient
    noise_sample = y[:int(0.5*sr)]  # First 0.5s as noise reference
    noise_rms = librosa.feature.rms(y=noise_sample, frame_length=frame_length)[0]
    threshold_db = librosa.amplitude_to_db(np.percentile(noise_rms, 50)) + 2  # Very slightly higher threshold
    
    # Convert features to compatible dimensions
    rms_db = librosa.amplitude_to_db(rms)
    times = librosa.times_like(rms, sr=sr, hop_length=hop_length)
    
    # Multi-feature voice detection - less strict approach
    speech_frames = (
        (rms_db > threshold_db) &  # Volume check
        ((spectral_centroid > 1100) |  # Slightly lower threshold
         (zero_crossing < 0.15))    # Slightly higher threshold
    )
    
    # Minimal temporal smoothing
    speech_frames = binary_closing(speech_frames, structure=np.ones(2))
    
    # Add minimal padding around speech segments
    padding_frames = 3  # Minimal padding
    speech_frames_padded = np.copy(speech_frames)
    for i in range(len(speech_frames)):
        if speech_frames[i]:
            start_idx = max(0, i - padding_frames)
            end_idx = min(len(speech_frames), i + padding_frames + 1)
            speech_frames_padded[start_idx:end_idx] = True
    
    speech_frames = speech_frames_padded
    
    # Calculate harmonic-percussive separation for additional speech detection
    y_harmonic, y_percussive = librosa.effects.hpss(y)
    harmonic_rms = librosa.feature.rms(y=y_harmonic, frame_length=frame_length, hop_length=hop_length)[0]
    percussive_rms = librosa.feature.rms(y=y_percussive, frame_length=frame_length, hop_length=hop_length)[0]
    harmonic_ratio = harmonic_rms / (percussive_rms + 1e-6)  # Add small constant to avoid division by zero
    
    # Segment merging with duration filter
    segments = []
    current_label = None
    current_start = 0
    
    for i, (t, is_speech) in enumerate(zip(times, speech_frames)):
        label = 'speech' if is_speech else 'noise'
        
        if label != current_label:
            if current_label is not None:
                duration = t - current_start
                if current_label == 'speech' and duration < min_speech_duration:
                    # For short speech segments, still mark them as speech to be conservative
                    label = 'speech'
                    continue
                segments.append({
                    'start': current_start,
                    'end': t,
                    'label': current_label
                })
            current_label = label
            current_start = t
    
    # Add final segment
    if current_label is not None:
        segments.append({
            'start': current_start,
            'end': times[-1],
            'label': current_label
        })

    # Collect speech and noise samples from original audio
    speech_samples = []
    noise_samples = []
    
    for seg in segments:
        start_sample = int(seg['start'] * sr)
        end_sample = int(seg['end'] * sr)
        # Use original audio for output
        clip = y_original[start_sample:end_sample]
        
        if seg['label'] == 'speech':
            speech_samples.append(clip)
        else:
            # Use preprocessed audio for detection
            clip_processed = y[start_sample:end_sample]
            segment_rms = librosa.feature.rms(y=clip_processed)[0]
            segment_spectral = librosa.feature.spectral_centroid(y=clip_processed, sr=sr)[0]
            segment_zcr = librosa.feature.zero_crossing_rate(y=clip_processed)[0]
            
            # Get harmonic ratio for this segment
            segment_idx = int(seg['start'] * sr / hop_length)
            segment_harmonic_ratio = harmonic_ratio[segment_idx:int(seg['end'] * sr / hop_length)]
            
            # Much more lenient criteria for noise classification
            is_noise = (
                np.mean(segment_rms) < np.exp(threshold_db/20) or  # Keep OR conditions
                (np.mean(segment_spectral) < 1000 and  # Slightly stricter frequency threshold
                 np.mean(segment_zcr) > 0.15 and  # Slightly stricter zero crossing check
                 np.mean(segment_harmonic_ratio) < 1.9)  # Slightly stricter harmonic content check
            )
            
            if is_noise:
                # Minimal buffer check
                buffer_size = int(0.05 * sr)  # Reduced to 50ms buffer
                start_with_buffer = max(0, start_sample - buffer_size)
                end_with_buffer = min(len(y), end_sample + buffer_size)
                
                # Quick buffer check using processed audio
                buffer_clip = y[start_with_buffer:end_with_buffer]
                buffer_rms = librosa.feature.rms(y=buffer_clip)[0]
                
                # Very lenient buffer check
                if np.max(buffer_rms) < np.exp(threshold_db/20):
                    noise_samples.append(clip)  # Use original audio
                else:
                    speech_samples.append(clip)  # Use original audio
            else:
                speech_samples.append(clip)  # Use original audio

    # Save merged clips with original amplitude
    if speech_samples:
        speech_concat = np.concatenate(speech_samples)
        speech_path = os.path.join(output_dir, 'merged_speech.wav')
        # Normalize to prevent clipping while preserving relative amplitude
        max_amp = np.max(np.abs(speech_concat))
        if max_amp > 1.0:
            speech_concat = speech_concat / max_amp * 0.95
        sf.write(speech_path, speech_concat, sr)
        speech_rms = np.sqrt(np.mean(speech_concat**2))
        speech_vol_db = 20 * np.log10(speech_rms)
        print(f"Speech samples: {len(speech_concat)} samples, RMS: {speech_rms:.6f}")
        print(f"Saved speech to: {speech_path}")
    else:
        speech_vol_db = -np.inf
    
    if noise_samples:
        noise_concat = np.concatenate(noise_samples)
        noise_path = os.path.join(output_dir, 'merged_noise.wav')
        # Normalize to prevent clipping while preserving relative amplitude
        max_amp = np.max(np.abs(noise_concat))
        if max_amp > 1.0:
            noise_concat = noise_concat / max_amp * 0.95
        sf.write(noise_path, noise_concat, sr)
        noise_rms = np.sqrt(np.mean(noise_concat**2))
        noise_vol_db = 20 * np.log10(noise_rms)
        print(f"Noise samples: {len(noise_concat)} samples, RMS: {noise_rms:.6f}")
        print(f"Saved noise to: {noise_path}")
    else:
        noise_vol_db = -np.inf

    return {
        'speech_db': speech_vol_db,
        'noise_db': noise_vol_db,
        'volume_difference': speech_vol_db - noise_vol_db,
        'threshold_db': threshold_db,
        'diagnostics': {
            'rms_db': rms_db,
            'spectral_centroid': spectral_centroid,
            'zero_crossing': zero_crossing,
            'times': times
        }
    }

def plot_diagnostics(results):
    """Visualize detection features for verification"""
    plt.figure(figsize=(12, 8))
    
    # RMS plot
    plt.subplot(3, 1, 1)
    plt.plot(results['diagnostics']['times'], results['diagnostics']['rms_db'])
    plt.axhline(y=results['threshold_db'], color='r', linestyle='--')
    plt.title('RMS Energy (dB)')
    
    # Spectral Centroid
    plt.subplot(3, 1, 2)
    plt.plot(results['diagnostics']['times'], results['diagnostics']['spectral_centroid'])
    plt.axhline(y=1000, color='g', linestyle='--')
    plt.title('Spectral Centroid (Hz)')
    
    # Zero Crossing Rate
    plt.subplot(3, 1, 3)
    plt.plot(results['diagnostics']['times'], results['diagnostics']['zero_crossing'])
    plt.axhline(y=0.15, color='m', linestyle='--')
    plt.title('Zero Crossing Rate')
    
    plt.tight_layout()
    plt.show()

# Usage example
results = analyze_audio(r"C:\Users\Shun\Documents\4A\CAPSTONE\vocoPal\signalProcessing\audio\long_output.wav")
print(f"\nResults:")
print(f"Speech volume: {results['speech_db']:.2f} dB")
print(f"Noise volume: {results['noise_db']:.2f} dB")
print(f"Volume difference (Speech - Noise): {results['volume_difference']:.2f} dB")
