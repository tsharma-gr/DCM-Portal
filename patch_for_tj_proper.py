import sys
file_path_main = '/root/estimator_cv_automation/main.py'
with open(file_path_main, 'r') as f:
    lines = f.readlines()
if not lines[54].strip().startswith('#'):
    lines[54] = '                    # ' + lines[54].lstrip()
with open(file_path_main, 'w') as f:
    f.writelines(lines)

env_path = '/root/estimator_cv_automation/.env'
with open(env_path, 'a') as f:
    f.write('\nRUN_TOTALJOBS=true\n')
