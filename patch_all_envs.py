import glob
import os

env_files = glob.glob('/root/*_cv_automation/.env')
for env_file in env_files:
    with open(env_file, 'r') as f:
        content = f.read()
    
    if 'RUN_TOTALJOBS=true' not in content:
        with open(env_file, 'a') as f:
            f.write('\nRUN_TOTALJOBS=true\n')
        print(f"Patched {env_file}")
    else:
        print(f"Already patched {env_file}")
