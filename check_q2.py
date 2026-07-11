def check_queues():
    with open('/root/queue2_scheduler.py', 'r') as f:
        code = f.read()
    
    # We will just print lines that have 'dir' or 'run_tj'
    for line in code.split('\n'):
        if '"dir"' in line or "'dir'" in line or '"run_tj"' in line or "'run_tj'" in line:
            print(line.strip())

check_queues()
