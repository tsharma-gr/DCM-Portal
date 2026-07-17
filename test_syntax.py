import py_compile
import glob
import sys

files = glob.glob('/root/*_cv_automation/totaljobs_searcher.py')
success = True
for f in files:
    try:
        py_compile.compile(f, doraise=True)
    except Exception as e:
        print(f"SYNTAX ERROR IN {f}: {e}")
        success = False

if success:
    print(f"All syntax checks passed for {len(files)} files!")
else:
    sys.exit(1)
