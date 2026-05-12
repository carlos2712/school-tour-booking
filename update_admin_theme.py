import os

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Text colors
    content = content.replace('text-white', 'text-foreground')
    content = content.replace('text-gray-200', 'text-gray-700')
    content = content.replace('text-gray-300', 'text-gray-600')
    content = content.replace('text-gray-400', 'text-gray-500')
    content = content.replace('text-gray-500', 'text-gray-400') # Wait, this might cause double replacement.
    
    # Fix double replacements by doing it via regex or carefully.
    pass

import re

def update_file_regex(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Carefully replace classes using word boundaries to avoid partial matches
    replacements = {
        r'\btext-white\b': 'text-foreground',
        r'\btext-gray-200\b': 'text-gray-700',
        r'\btext-gray-300\b': 'text-gray-600',
        r'\btext-gray-400\b': 'text-gray-500',
        r'\bbg-navy-light\b': 'bg-gray-100',
        r'\bbg-navy-card\b': 'bg-gray-50',
        r'\bborder-navy-light\b': 'border-gray-200',
        r'\bbg-navy\b': 'bg-white',
        r'\btext-amber-300\b': 'text-amber-700',
        r'\bbg-amber-900/20\b': 'bg-amber-100',
        r'\bborder-amber-700\b': 'border-amber-300',
    }

    new_content = content
    for old, new in replacements.items():
        new_content = re.sub(old, new, new_content)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

def main():
    admin_dir = "/Users/carlosorjuela/repos/school-tour-booking/app/admin"
    for root, dirs, files in os.walk(admin_dir):
        for file in files:
            if file.endswith(".tsx"):
                update_file_regex(os.path.join(root, file))

if __name__ == "__main__":
    main()
