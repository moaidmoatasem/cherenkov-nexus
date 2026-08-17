import re

with open('src/components/JobSynthesizer.tsx', 'r') as f:
    code = f.read()

old_block = """      {/* Split-Screen Solver Section */}
      {synthesizedData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">"""

new_block = """      {/* Split-Screen Solver Section */}
      {synthesizedData ? (
        <div className="space-y-6">
          {/* 1. Instant Traffic Light Visa Badge */}
          <div className={`p-4 rounded-3xl border flex items-center justify-between shadow-xl transition-all ${
            synthesizedData.isLicensedSponsor 
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
              : 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                synthesizedData.isLicensedSponsor ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'
              }`}>
                <div className={`w-4 h-4 rounded-full shadow-[0_0_15px_currentColor] animate-pulse ${
                  synthesizedData.isLicensedSponsor ? 'bg-emerald-400 text-emerald-400' : 'bg-rose-400 text-rose-400'
                }`} />
              </div>
              <div>
                <h3 className={`text-lg font-black tracking-tight ${synthesizedData.isLicensedSponsor ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {synthesizedData.isLicensedSponsor ? 'Verified Visa Sponsor' : 'Warning: Unverified Sponsor'}
                </h3>
                <p className="text-sm font-bold text-slate-300">
                  {synthesizedData.isLicensedSponsor 
                    ? `Matches the minimum £41,700 salary threshold for UK Skilled Worker requirements.` 
                    : `This company does not currently hold an active EU Blue Card or UK Skilled Worker sponsorship license.`}
                </p>
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">"""

code = code.replace(old_block, new_block)

# Fix the closing tags at the end of the Synthesized Action Plan
old_close = """              </div>
            </div>
          </div>
        </div>
      ) : ("""

new_close = """              </div>
            </div>
          </div>
        </div>
        </div>
      ) : ("""

code = code.replace(old_close, new_close)

with open('src/components/JobSynthesizer.tsx', 'w') as f:
    f.write(code)

print("Traffic light patched.")
