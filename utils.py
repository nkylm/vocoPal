from datetime import datetime

def check_params_against_threshold(audio_dict, thresholds):
    timestamp = datetime.now().isoformat()
    results = {"timestamp": timestamp, "parameters": {}}
    
    total_params = len(audio_dict)
    out_of_threshold = False
    
    for param in thresholds:
        results["parameters"][param] = {
            "under": False,
            "over": False,
        }

        print(audio_dict)
        value = audio_dict[param]
        min_threshold, max_threshold = thresholds.get(param, [None, None])
        if min_threshold and max_threshold:
            within_threshold = min_threshold <= value <= max_threshold
            
            if not within_threshold:
                out_of_threshold = True

                if value < min_threshold:
                    results["parameters"][param]["under"] = True
                if value > max_threshold:
                    results["parameters"][param]["over"] = True

    if out_of_threshold:
        return results
    
    return None
    