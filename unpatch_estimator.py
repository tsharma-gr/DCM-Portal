import sys
file_path = '/root/estimator_cv_automation/main.py'
with open(file_path, 'r') as f:
    lines = f.readlines()
if lines[54].strip().startswith('#'):
    lines[54] = lines[54].replace('# ', '', 1)
with open(file_path, 'w') as f:
    f.writelines(lines)
