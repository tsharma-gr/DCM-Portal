def check():
    with open('/root/health_safety_cv_automation/main.py', 'r') as f:
        print("--- Health Safety main.py ---")
        for i, line in enumerate(f):
            if 'BID' in line or 'bot_name' in line:
                print(f"{i+1}: {line.strip()}")
                
    with open('/root/waste_management_cv_automation/main.py', 'r') as f:
        print("--- Waste Management main.py ---")
        for i, line in enumerate(f):
            if 'BID' in line or 'bot_name' in line:
                print(f"{i+1}: {line.strip()}")

check()
