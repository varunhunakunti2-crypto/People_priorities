import os
import re

files = [
    "main.py",
    "auth.py",
    "ranking.py",
    "nlp/cluster_themes.py"
]

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove the get_db_connection definition block
    # It usually looks like:
    # def get_db_connection():
    #     if not os.path.exists(DB_PATH): ...
    #     conn = get_db_connection()
    #         return conn
    # Since regex is hard for this, we can just replace the specific strings
    # Or find "def get_db_connection():" and remove it and the next 7-8 lines.
    
    lines = content.split('\n')
    new_lines = []
    skip = False
    for line in lines:
        if line.startswith('def get_db_connection():'):
            skip = True
            continue
        if skip:
            if line.strip() == 'return conn' or 'return conn' in line:
                skip = False
                continue
            if line.startswith('def '): # Oops we skipped too far
                skip = False
                new_lines.append(line)
                continue
            continue
        new_lines.append(line)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

for f in files:
    if os.path.exists(f):
        fix_file(f)
print("Fix done")
