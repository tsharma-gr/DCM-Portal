import json

def count_candidates(path):
    try:
        with open(path, 'r') as f:
            data = json.load(f)
            if isinstance(data, list):
                return len(data)
            elif isinstance(data, dict):
                return len(data.get("processed_cvs", data))
    except Exception as e:
        return f"Error: {e}"

h = count_candidates('/root/health_safety_cv_automation/processed_cvs.json')
w = count_candidates('/root/waste_management_cv_automation/processed_cvs.json')

print(f"Health & Safety Processed Total: {h}")
print(f"Waste Management Processed Total: {w}")
