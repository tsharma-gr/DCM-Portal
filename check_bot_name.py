def check():
    with open('/root/health_safety_cv_automation/cv_parser.py', 'r') as f:
        print("--- Health Safety cv_parser.py ---")
        for line in f:
            if 'dcm' in line.lower() or 'bot' in line.lower() or 'bid' in line.lower():
                print(line.strip())
                
    with open('/root/health_safety_cv_automation/main.py', 'r') as f:
        print("--- Health Safety main.py ---")
        for line in f:
            if 'dcm' in line.lower() or 'bot' in line.lower() or 'bid' in line.lower():
                print(line.strip())
check()
