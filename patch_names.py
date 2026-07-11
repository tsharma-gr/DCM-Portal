import re

def patch_bot(filepath, new_name):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace "BID DCM" with new_name
    content = content.replace('"BID DCM"', f'"{new_name}"')
    
    with open(filepath, 'w') as f:
        f.write(content)

patch_bot('/root/health_safety_cv_automation/main.py', 'Health & Safety DCM')
patch_bot('/root/waste_management_cv_automation/main.py', 'Waste Management DCM')

print("Patched bot names successfully!")
