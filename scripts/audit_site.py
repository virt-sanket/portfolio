import os, glob, re

html_files = glob.glob(r'c:\website\*.html')
print(f'Auditing {len(html_files)} HTML files...')

required_checks = {
    'favicon.svg': re.compile(r'assets/favicon\.svg'),
    'apple-touch-icon': re.compile(r'assets/apple-touch-icon\.png'),
    'og:image': re.compile(r'og:image'),
    'twitter:card': re.compile(r'twitter:card'),
    'canonical': re.compile(r'rel=[\"\']canonical[\"\']'),
    'now.html nav': re.compile(r'href=[\"\']now\.html[\"\']'),
}

all_passed = True
for hf in sorted(html_files):
    name = os.path.basename(hf)
    with open(hf, 'r', encoding='utf-8') as f:
        content = f.read()
    
    missing = []
    for check_name, pattern in required_checks.items():
        if name == 'admin.html' and check_name in ['og:image', 'twitter:card', 'canonical', 'now.html nav']:
            continue
        if not pattern.search(content):
            missing.append(check_name)
    
    if missing:
        all_passed = False
        print(f'  {name:<16} : [FAIL] MISSING: {missing}')
    else:
        print(f'  {name:<16} : [OK] PASS')

print('Overall status:', 'ALL PASSED!' if all_passed else 'SOME FAILED')
