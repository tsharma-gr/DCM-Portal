import glob

env_files = glob.glob('/root/*_cv_automation/.env')
for env_file in env_files:
    with open(env_file, 'r') as f:
        lines = f.readlines()
    
    with open(env_file, 'w') as f:
        for line in lines:
            if line.strip() != 'RUN_TOTALJOBS=true':
                f.write(line)
    print(f"Reverted {env_file}")
