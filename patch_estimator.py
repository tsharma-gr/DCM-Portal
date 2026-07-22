import sys
file_path = '/root/estimator_cv_automation/main.py'
with open(file_path, 'r') as f:
    lines = f.readlines()
lines[54] = '                    # ' + lines[54].lstrip()
with open(file_path, 'w') as f:
    f.writelines(lines)
