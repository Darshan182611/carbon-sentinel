import React, { useState, useEffect } from 'react';
import { Shield, Leaf, Activity, ChevronRight, Lock, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const App = () => {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(124500);

  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/credits')
      .then(res => res.json())
      .then(data => {
        setCredits(data);
        setLoading(false);
      })
      .catch(err => {
        setCredits([
          { id: 1, origin: 'Amazon Reforestation', amount: 500, price: 25.50, verified: true },
          { id: 2, origin: 'Solar Farm India', amount: 1200, price: 18.00, verified: true }
        ]);
        setLoading(false);
      });
  }, []);

  const handleBuy = async (credit) => {
    // Reveal Terminal & initialize start
    setAuditLogs([{ type: 'info', msg: `Initiating secure channel for ${credit.origin}...`, timestamp: new Date().toLocaleTimeString() }]);
    
    try {
      const response = await fetch('http://localhost:5000/api/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: "corporate_admin_1", 
          assetId: credit.id, 
          amount: credit.id === 1 ? 500000 : credit.price, // Item 1 triggers AI Fraud
          walletAddress: "MFLACU5D7ATDGRDA4B6Z3NBMZOCSNMT4JKSQ5MA2GDKRLWEXIOGJ4BACDE",
          ipAddress: "192.168.1.100"
        })
      });

      // Instead of parsing native JSON, we attach a reader to the live execution stream!
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              setAuditLogs(prev => [...prev, { 
                type: data.type, 
                msg: data.message, 
                hash: data.data?.txHash,
                timestamp: new Date().toLocaleTimeString() 
              }]);

              // Automatically deduct balance and allocate credits on completion!
              if (data.type === 'complete') {
                setBalance(prev => prev - (credit.price * 250));
                setCredits(prevCredits => 
                  prevCredits.map(c => 
                    c.id === credit.id ? { ...c, amount: c.amount - 250 } : c
                  )
                );
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      setAuditLogs(prev => [...prev, { type: 'error', msg: `Connection severed: ${err.message}`, timestamp: new Date().toLocaleTimeString() }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Shield className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Carbon Sentinel
          </h1>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <a href="#" className="hover:text-brand-400 transition-colors">Exchange</a>
          <a href="#" className="hover:text-brand-400 transition-colors">Portfolio</a>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
            <span>System Active</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dynamic Status Alert Pop-up removed - Replaced by Terminal */}

        {/* Left Column: Stats & Security Status */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-brand-500/20"></div>
            <h2 className="text-lg font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-400" />
              AI Fraud Shield
            </h2>
            <div className="text-4xl font-light mb-1">Active</div>
            <p className="text-sm text-slate-500">Zero anomalies detected in the last 24h.</p>
            <div className="mt-6 flex items-center gap-3 text-xs font-semibold text-emerald-400 bg-emerald-400/10 w-max px-3 py-1.5 rounded-lg border border-emerald-400/20">
              <Lock className="w-3 h-3" />
              ZKP Verification Online
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-semibold text-slate-300 mb-4">Your Wallet</h2>
            <div className="flex justify-between items-end mb-2">
              <div className="text-sm text-slate-400">Available Balance</div>
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 mb-4 overflow-hidden">
              <div className="bg-gradient-to-r from-brand-500 to-cyan-400 h-2 rounded-full w-3/4"></div>
            </div>
            <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-sm font-medium">
              Deposit Funds
            </button>
          </div>
        </div>

        {/* Right Column: Marketplace */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">Live Asset Exchange</h2>
              <p className="text-sm text-slate-400">Tokenized, verifiable carbon credits on Algorand.</p>
            </div>
            <button className="text-brand-400 hover:text-brand-300 text-sm font-medium flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {credits.map(credit => (
                <div key={credit.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg flex items-center gap-2">
                        {credit.origin}
                        {credit.verified && (
                          <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">Vol: {credit.amount} Tons Available</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-lg font-bold">${credit.price.toFixed(2)}</div>
                      <div className="text-xs text-slate-500">per ton</div>
                    </div>
                    <button 
                      onClick={() => handleBuy(credit)}
                      className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all shadow-lg shadow-brand-500/20 active:scale-95 flex items-center gap-2">
                       Buy ASA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Section: Live Audit Terminal */}
        {auditLogs.length > 0 && (
          <div className="lg:col-span-3 glass-panel rounded-2xl p-6 bg-[#0a0a0c] border border-brand-500/30 overflow-hidden font-mono text-sm shadow-2xl shadow-brand-500/20 mt-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
               <div className="flex items-center gap-3 text-brand-400 font-bold uppercase tracking-widest text-xs">
                 <Shield className="w-4 h-4 animate-pulse" />
                 Carbon Sentinel Execution Web-Terminal
               </div>
               <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
               </div>
            </div>
            <div className="space-y-3 h-72 overflow-y-auto whitespace-pre-wrap pr-4">
              {auditLogs.map((log, i) => (
                <div key={i} className={`flex items-start gap-3 animate-in fade-in slide-in-from-left-4 duration-300 ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-emerald-400' : 
                  log.type === 'complete' ? 'text-cyan-400 font-bold' :
                  'text-slate-400'
                }`}>
                  <span className="text-slate-600 opacity-50 shrink-0 text-xs mt-0.5">[{log.timestamp}]</span>
                  <div className="leading-relaxed flex-1">
                    <span className="opacity-70 mr-2">
                      {log.type === 'info' && '>'}
                      {log.type === 'error' && '[!]'}
                      {log.type === 'success' && '[+]'}
                      {log.type === 'complete' && '[*]'}
                    </span>
                    {log.msg}
                    {log.hash && (
                      <div className="mt-2 p-3 bg-brand-500/5 rounded border border-brand-500/20 text-brand-300/80 text-xs break-all break-words">
                        ↳ TxHash: {log.hash}
                      </div>
                    )}
                  </div>
                </div>
              ))}
               <div className="flex items-center gap-2 mt-4 text-slate-500">
                  <span>&gt;</span>
                  <div className="w-2.5 h-4 bg-brand-500 animate-pulse"></div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
