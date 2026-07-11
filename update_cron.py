import subprocess

def update_crontab():
    # Get current crontab
    result = subprocess.run(['crontab', '-l'], stdout=subprocess.PIPE, text=True)
    cron_jobs = result.stdout
    
    # Replace the specific cron schedule
    new_cron_jobs = cron_jobs.replace('0 2 * * *', '0 1 * * *')
    
    # Write the new crontab
    process = subprocess.Popen(['crontab', '-'], stdin=subprocess.PIPE, text=True)
    process.communicate(new_cron_jobs)
    
    print("Updated crontab successfully!")

if __name__ == '__main__':
    update_crontab()
