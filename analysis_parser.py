import re
from datetime import datetime

# Define the keys to extract
KEYS_TO_EXTRACT = [
    "number_of_syllables",
    "number_of_pauses",
    "rate_of_speech",
    "articulation_rate",
    "speaking_duration",
    "original_duration",
    "balance",
    "f0_mean",
    "f0_std",
    "f0_median",
    "f0_min",
    "f0_max",
    "f0_quantile25",
    "f0_quan75"
]

# Define target ranges for analysis
TARGET_RANGES = {
    "f0_mean": (100, 150),
    "rate_of_speech": (3, 6),
    "articulation_rate": (4, 7),
    # Add more target ranges as needed
}

# Persistent hashmap to store data
speech_analysis_history = {}

def parse_analysis_output(output):
    """Parses the analysis output and updates the persistent hashmap."""
    parsed_data = {}
    target_evaluation = {}  # Will store whether the metric is below, within, or above

    for key in KEYS_TO_EXTRACT:
        # Extract the value for each key
        match = re.search(rf"{key}\s+([\d\.]+)", output)
        if match:
            value = float(match.group(1)) if '.' in match.group(1) else int(match.group(1))
            parsed_data[key] = value

            # Check if the key is in the target ranges
            if key in TARGET_RANGES:
                min_target, max_target = TARGET_RANGES[key]
                if value < min_target:
                    target_evaluation[key] = "below"
                elif min_target <= value <= max_target:
                    target_evaluation[key] = "within"
                else:
                    target_evaluation[key] = "above"

    # Generate a timestamp for this analysis
    timestamp = datetime.now().isoformat()

    # Store parsed_data and evaluation in the persistent hashmap
    speech_analysis_history[timestamp] = {
        "parsed_data": parsed_data,
        "evaluation": target_evaluation
    }

    return timestamp, speech_analysis_history[timestamp]

# Example Function to Display the Persistent History
def print_analysis_history():
    """Prints the entire analysis history."""
    for timestamp, analysis in speech_analysis_history.items():
        print(f"Timestamp: {timestamp}")
        print(f"Parsed Data: {analysis['parsed_data']}")
        print(f"Evaluation: {analysis['evaluation']}")
        print("---")
