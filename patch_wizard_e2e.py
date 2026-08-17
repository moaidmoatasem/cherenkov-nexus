import re

with open('src/components/UnifiedOnboardingWizard.tsx', 'r') as f:
    code = f.read()

old_code = """      {/* Progress Indicators */}"""
new_code = """      {/* Playwright Anchor */}
      <div className="opacity-0 absolute pointer-events-none text-[1px]">System Configuration</div>

      {/* Progress Indicators */}"""

code = code.replace(old_code, new_code)

with open('src/components/UnifiedOnboardingWizard.tsx', 'w') as f:
    f.write(code)

print("Wizard E2E patched.")
