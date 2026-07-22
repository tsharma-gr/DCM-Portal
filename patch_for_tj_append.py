import sys
env_path = '/root/estimator_cv_automation/.env'
with open(env_path, 'a') as f:
    f.write('\nRUN_TOTALJOBS=true\n')
