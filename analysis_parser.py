import re

# Define the keys to extract
KEYS_TO_EXTRACT = [
    "number_ of_syllables",
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

def parse_analysis_output(output):
    """Parses the output of the analysis and returns a dictionary of values."""
    parsed_data = {}
    for key in KEYS_TO_EXTRACT:
        match = re.search(rf"{key}\s+([\d\.]+)", output)
        if match:
            value = float(match.group(1)) if '.' in match.group(1) else int(match.group(1))
            parsed_data[key.replace(" ", "")] = value
    return parsed_data
