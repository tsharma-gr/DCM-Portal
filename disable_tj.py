import sys

def disable_health_safety_tj():
    with open('/root/queue1_scheduler.py', 'r') as f:
        lines = f.readlines()

    in_health_safety = False
    for i, line in enumerate(lines):
        if '"/root/health_safety_cv_automation"' in line:
            in_health_safety = True
        
        if in_health_safety and '"run_tj"' in line and 'True' in line:
            lines[i] = line.replace('True', 'False')
            break
            
    with open('/root/queue1_scheduler.py', 'w') as f:
        f.writelines(lines)
        
    print("Disabled Totaljobs for Health & Safety!")

if __name__ == '__main__':
    disable_health_safety_tj()
