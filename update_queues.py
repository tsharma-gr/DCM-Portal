import ast
import pprint

def move_health_safety():
    # Load Queue 2
    with open('/root/queue2_scheduler.py', 'r') as f:
        q2_code = f.read()
    
    # We will do a robust string replacement to move it safely
    # In queue2, it is a dict like:
    #    {
    #        "dir": "/root/health_safety_cv_automation",
    #        "python": "./.venv/bin/python",
    #        "script": "main.py",
    #        "run_cv": True,
    #        "run_tj": True
    #    },
    
    # We will extract this chunk by reading lines
    with open('/root/queue2_scheduler.py', 'r') as f:
        q2_lines = f.readlines()
        
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(q2_lines):
        if '"/root/health_safety_cv_automation"' in line:
            # Found it, now find the start and end of this dict
            # Start is a few lines above where `{` is
            j = i
            while j >= 0 and '{' not in q2_lines[j]:
                j -= 1
            start_idx = j
            
            # End is a few lines below where `}` is
            k = i
            while k < len(q2_lines) and '}' not in q2_lines[k]:
                k += 1
            end_idx = k
            break
            
    if start_idx != -1 and end_idx != -1:
        # Extract the chunk
        extracted_chunk = q2_lines[start_idx:end_idx+1]
        
        # Remove from q2_lines
        # Handle trailing comma if present
        if end_idx+1 < len(q2_lines) and q2_lines[end_idx+1].strip() == ',':
            q2_lines = q2_lines[:start_idx] + q2_lines[end_idx+2:]
        else:
            # maybe the comma was on the same line as }
            if q2_lines[end_idx].strip().endswith(','):
                pass
            q2_lines = q2_lines[:start_idx] + q2_lines[end_idx+1:]
            
        with open('/root/queue2_scheduler.py', 'w') as f:
            f.writelines(q2_lines)
            
        # Now add it to queue1
        with open('/root/queue1_scheduler.py', 'r') as f:
            q1_lines = f.readlines()
            
        # Find the end of the QUEUE list
        insert_idx = -1
        for i, line in enumerate(q1_lines):
            if line.strip() == ']':
                insert_idx = i
                break
                
        if insert_idx != -1:
            # Check if previous line needs a comma
            prev_line = q1_lines[insert_idx-1]
            if prev_line.strip() == '}':
                q1_lines[insert_idx-1] = prev_line.replace('}', '},\n')
                
            q1_lines = q1_lines[:insert_idx] + extracted_chunk + q1_lines[insert_idx:]
            
            with open('/root/queue1_scheduler.py', 'w') as f:
                f.writelines(q1_lines)
                
            print("Successfully moved Health & Safety to Queue 1")
    else:
        print("Could not find Health & Safety in Queue 2")

if __name__ == '__main__':
    move_health_safety()
