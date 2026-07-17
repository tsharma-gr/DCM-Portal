import os
import glob
import re

def patch_bot(bot_dir):
    print(f"\n--- Patching {bot_dir} ---")
    
    tj_file = os.path.join(bot_dir, "totaljobs_searcher.py")
    if not os.path.exists(tj_file):
        print(f"Skipping {bot_dir}, no totaljobs_searcher.py")
        return

    with open(tj_file, "r", encoding="utf-8") as f:
        content = f.read()

    original_content = content
    
    # Fix Memory Leak 1: Direct URL
    if "logger.warning(f\"Failed to load candidate URL directly in new tab: {e_direct}\")" in content:
        replacement1 = """logger.warning(f"Failed to load candidate URL directly in new tab: {e_direct}")
                        try:
                            if 'new_page' in locals() and new_page and not new_page.is_closed():
                                await new_page.close()
                                logger.info("Force-closed leaked new_page tab in except block.")
                        except: pass"""
        content = content.replace("logger.warning(f\"Failed to load candidate URL directly in new tab: {e_direct}\")", replacement1)

    # Fix Memory Leak 2: Name Link click
    # The original is:
    #                         logger.info("Extracted CV text from clicked name link in new tab.")
    #                     except Exception:
    #                         # Check if the main page navigated to a different URL (Case B)
    if "except Exception:\n                            # Check if the main page navigated to a different URL (Case B)" in content:
        replacement2 = """except Exception as e_case_a:
                            try:
                                if 'new_page' in locals() and new_page and not new_page.is_closed():
                                    await new_page.close()
                                    logger.info("Force-closed leaked new_page tab in Case A except block.")
                            except: pass
                            # Check if the main page navigated to a different URL (Case B)"""
        content = content.replace("except Exception:\n                            # Check if the main page navigated to a different URL (Case B)", replacement2)
        
    if content != original_content:
        with open(tj_file, "w", encoding="utf-8") as f:
            f.write(content)
        print("Patched totaljobs_searcher.py successfully!")
    else:
        print("totaljobs_searcher.py was already patched or regex did not match.")

if __name__ == "__main__":
    bot_dirs = glob.glob("/root/*_cv_automation")
    for b_dir in bot_dirs:
        patch_bot(b_dir)
