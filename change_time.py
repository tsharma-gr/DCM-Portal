def change_time(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace the hour condition
    content = content.replace('now.hour == 2 and now.minute == 0', 'now.hour == 1 and now.minute == 0')
    
    with open(filepath, 'w') as f:
        f.write(content)

change_time('/root/queue1_scheduler.py')
change_time('/root/queue2_scheduler.py')

print("Changed start time to 1 AM successfully!")
