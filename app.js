(function(){
  var $=function(id){return document.getElementById(id);};
  var usd=function(n,d){return (n<0?"-":"")+"$"+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d});};
  var pct=function(n){return (n>0?"+":"")+n.toFixed(2)+"%";};
  var cls=function(n){return n>0.004?"up":n<-0.004?"down":"";};
  var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
  var rows=function(el,html){document.querySelector("#"+el+" tbody").innerHTML=html;};
  function card(l,v,c,s){return '<div class="card"><small>'+l+'</small><b class="'+c+'">'+v+'</b>'+(s?'<small>'+s+'</small>':'')+'</div>';}
  function useLedger(D,LG){   // real paper-trading ledger: positions bought so far, cash, and tomorrow's reinvestment
    var p=D.portfolios[0];p.cash=LG.cash;
    p.buys.forEach(function(b){var h=LG.positions[b.ticker];if(h&&h.shares>0){b.cost=h.cost;D.entry[b.ticker]=h.cost/h.shares;}});
    (LG.buys||[]).forEach(function(x,i){var px=D.prices[x.ticker]||x.price,y=new Date(x.date+"T12:00:00Z");y.setUTCFullYear(y.getUTCFullYear()+1);
      p.tax.lots.push({ticker:x.ticker,id:x.ticker+"-top"+(i+1),date:x.date,shares:x.shares,cost:x.dollars,price:x.price,value:x.shares*px,gain:x.shares*px-x.dollars,term:"short",long_term_on:y.toISOString().slice(0,10)});});
    D.pending=LG.pending||[];D.bench=LG.bench||null;
  }
  Promise.all([fetch("data/plan.json?"+Date.now()).then(function(r){return r.json();}),fetch("data/ledger.json?"+Date.now()).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;})]).then(function(R){var D=R[0],LG=R[1];if(LG)useLedger(D,LG);
    var cur=0,tabs=$("tabs");if(D.portfolios.length<2)tabs.style.display="none";
    D.portfolios.forEach(function(p,i){var b=document.createElement("button");b.textContent=usd(p.budget,0)+" portfolio";b.setAttribute("role","tab");b.onclick=function(){cur=i;draw();};tabs.appendChild(b);});
    $("srcnote").textContent="Copying: "+D.source+".";
    $("status").textContent=D.market+" Plan generated "+new Date(D.generated).toUTCString().replace(" GMT"," UTC")+".";
    var ran=[["trader-copycat","Read Berkshire's 13F and made the target weights","ran"],["trader-budget","Sized each buy to the budget, cash buffer and 25% cap","ran"],["trader-risk","Checked every order against the limits","ran"],["trader-alerts","Fetched delayed prices and the NYSE clock","ran"],["trader-rebalance","Checked drift from the targets","ran"],["trader-tax","Tracked cost-basis lots and looked for loss-harvest sells","ran"],["trader-pelosi","Listed new Congress trade filings","ran"],["trader-broker","Shows each order as a ticket. Never connected, so no order can be sent","off"],["trader-analyst","Read revenue, margins and EPS from SEC filings",D.sec_skills?"ran":"off"],["trader-screener","Tested each stock against the rules below",D.sec_skills?"ran":"off"],["trader-news","Checked recent headlines on the holdings",D.sec_skills?"ran":"off"]];
    $("skills").innerHTML=ran.map(function(s){return "<li><b>"+s[0]+'<span class="tag '+s[2]+'">'+(s[2]=="ran"?"ran":"not active")+"</span></b>"+s[1]+"</li>";}).join("");
    $("congress").innerHTML=(D.congress||[]).map(function(c){return "<li><span>"+esc(c.name)+" ("+esc(c.district)+")</span><span><a href=\""+esc(c.url)+"\" rel=\"noopener\">filed "+esc(c.filed)+"</a></span></li>";}).join("")||"<li>No filings found.</li>";
    var M=function(n){return n==null?"n/a":"$"+(n/1e9).toFixed(1)+"B";};
    var P=function(n){return n==null?"n/a":n.toFixed(1)+"%";};
    rows("earn",(D.analyst||[]).map(function(c){return "<tr><td><b>"+esc(c.ticker)+"</b><small>"+esc(c.name||"")+"</small></td><td>"+esc(c.period_end||"")+"</td><td class=n>"+M(c.revenue_ttm)+"</td><td class='n "+cls(c.revenue_growth_yoy)+"'>"+P(c.revenue_growth_yoy)+"</td><td class=n>"+(c.eps_ttm==null?"n/a":usd(c.eps_ttm))+"</td><td class=n>"+P(c.operating_margin)+"</td></tr>";}).join("")||"<tr><td colspan=6>Not available.</td></tr>");
    if(D.screen){
      $("scrnote").textContent='Rules: "'+D.screen.name+'". '+D.screen.rules.map(function(r){return r.metric.replace(/_/g," ")+" "+r.op+" "+r.value;}).join(", ")+". A shortlist for study, not a recommendation.";
      rows("scr",D.screen.passed.map(function(x){return "<tr><td><b>"+esc(x.ticker)+'</b></td><td><span class="v PASS">PASS</span></td><td>'+esc(x.why.join("; "))+"</td></tr>";}).concat(D.screen.failed.map(function(x){return "<tr><td><b>"+esc(x.ticker)+'</b></td><td><span class="v BLOCK">FAIL</span></td><td>'+esc(x.why.join("; "))+"</td></tr>";})).join(""));
    }
    $("news").innerHTML=(D.news||[]).map(function(n){return "<li><span><b>"+esc(n.ticker||"")+"</b> "+(n.link?"<a href=\""+esc(n.link)+"\" rel=\"noopener\">"+esc(n.title)+"</a>":esc(n.title))+"<small>"+esc(n.source)+" · "+esc((n.time||"").slice(0,16).replace("T"," "))+" UTC</small></span></li>";}).join("")||"<li>No recent news.</li>";
    var anim=0;
    function showTotal(first){var id=++anim;
      var start=0,now=0;
      D.portfolios.forEach(function(p){start+=p.budget;var v=p.cash;p.buys.forEach(function(b){v+=(b.cost!=null?b.cost:b.dollars)/D.entry[b.ticker]*D.prices[b.ticker];});now+=v;});
      var g=now-start;
      var big=$("bigtotal"),calm=typeof window!=="undefined"&&window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
      if(!first||calm||typeof requestAnimationFrame==="undefined"||now<=0){big.textContent=usd(now);}
      else{var t0=null,from=now*0.9,dur=900;   // counts up from just below, easing out with no overshoot (critically damped feel)
        (function step(ts){if(id!==anim)return;if(t0===null)t0=ts;var k=Math.min(1,(ts-t0)/dur),e=1-Math.pow(1-k,4);big.textContent=usd(from+(now-from)*e);if(k<1)requestAnimationFrame(step);else big.textContent=usd(now);})(performance.now?performance.now():0);}
      $("bigsub").innerHTML='<span class="'+cls(g)+'">'+(g>=0?"+":"")+usd(g)+" ("+pct(g/start*100)+")</span> since the simulation started with "+usd(start,0)+(D.portfolios.length>1?" across "+D.portfolios.length+" portfolios":"")+". Pretend money."+(D.live_at?' <span class="livedot">Live</span> prices as of '+new Date(D.live_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit",second:"2-digit"})+".":"");
      (function(){   // today and since the start, next to the S&P 500
        var el=$("compare"),B=D.bench,P=D.prevs;if(!el||!B||D.spx==null||!P)return;
        var pv=0,nv=0,ok=true;D.portfolios.forEach(function(p){pv+=p.cash;nv+=p.cash;p.buys.forEach(function(b){var sh=(b.cost!=null?b.cost:b.dollars)/D.entry[b.ticker],pr=P[b.ticker];if(pr==null){ok=false;return;}pv+=sh*pr;nv+=sh*D.prices[b.ticker];});});
        if(!ok||!(pv>0)||!P["^GSPC"])return;
        var dg=nv-pv,dp=dg/pv*100,sd=(D.spx/P["^GSPC"]-1)*100,tp=g/start*100,st=(D.spx/B.start-1)*100;
        function row(label,me,mine,idx){var diff=me-idx;return '<div class="cmprow"><span class="cmplabel">'+label+'</span><span class="'+cls(me)+'">You '+(mine||pct(me))+'</span><span class="'+cls(idx)+'">S&amp;P 500 '+pct(idx)+'</span><span class="cmpdiff '+cls(diff)+'">'+(diff>=0?"ahead by ":"behind by ")+Math.abs(diff).toFixed(2)+" pts</span></div>";}
        el.innerHTML=row("Today",dp,(dg>=0?"+":"")+usd(dg)+" ("+pct(dp)+")",sd)+row("Since "+new Date(B.start_date+"T12:00:00Z").toLocaleDateString([],{month:"short",day:"numeric"}),tp,pct(tp),st);
      })();
    }
    showTotal(true);
    (function(){
      var when=D.next_open?D.next_open.replace(" ","  at ")+" (the next market open)":"";
      $("buytime").textContent=D.next_open?(D.market_open_now?"The market is open now, so these would go in right away.":"The market is closed, so these market orders would go in at "+D.next_open.replace(/^(\S+) (\S+) (.*)$/,"$1 at $2 $3")+", the next market open."):"";
    })();
    if(D.pending&&D.pending.length)$("buytime").textContent+=" Reinvesting gains: at the next open the model would also add "+D.pending.map(function(x){return usd(x.dollars,0)+" of "+x.ticker;}).join(", ")+" (the account's new money, kept within the 10% cash buffer).";
    (function(){
      var O=D.outlook,p=D.portfolios[0];if(!O)return;var c=p.cash;
      $("ocards").innerHTML=card("12-month range, whole account",usd(O.portfolio.low+c,0)+" to "+usd(O.portfolio.high+c,0),"","A simple model using last year's price swings plus an assumed 8% a year of growth (about the long-run market average) puts about 8 in 10 outcomes here. A spread, not a forecast.")+card("Same mix, past 12 months",pct(O.portfolio.last_year_pct),cls(O.portfolio.last_year_pct),"what happened last year, not next")+card("Next review",O.next_13f.deadline,"","Berkshire's Q3 13F is due by this date");
      rows("exit",O.stocks.map(function(s){return "<tr><td><b>"+esc(s.ticker)+"</b></td><td class=n>"+usd(s.entry)+"</td><td class=n data-now=\""+esc(s.ticker)+"\"></td><td class='n up'>"+usd(s.take_profit_price)+"<small>+"+O.rules.take_profit_pct+"%</small></td><td class='n down'>"+usd(s.stop_price)+"<small>-"+O.rules.stop_loss_pct+"%</small></td><td class=n>"+usd(s.low,0)+" to "+usd(s.high,0)+"<small>yearly swing ±"+s.vol_pct+"%</small></td><td class='n "+cls(s.last_year_pct)+"'>"+pct(s.last_year_pct)+"</td></tr>";}).join(""));
      var pc=function(n){return n<1?"under 1%":n+"%";};
      rows("odds",O.stocks.map(function(s){return "<tr><td rowspan=2><b>"+esc(s.ticker)+"</b></td><td class=up>Profit price "+usd(s.take_profit_price)+"</td>"+s.odds.profit.map(function(n){return "<td class=n>"+pc(n)+"</td>";}).join("")+"</tr><tr><td class=down>Stop price "+usd(s.stop_price)+"</td>"+s.odds.stop.map(function(n){return "<td class=n>"+pc(n)+"</td>";}).join("")+"</tr>";}).join(""));
      var lt=(p.tax.lots[0]||{}).long_term_on;
      var auto=O.auto_exit!==false,w=[];
      if(!auto)w.push("<b>Following Berkshire.</b> This is the plan's real sell trigger. When a new 13F drops a stock or cuts its share, the plan rebalances to match. Ten years of testing found this beat selling on price rules.");
      w.push("<b>Profit "+(auto?"target":"alert")+".</b> If a stock reaches its profit price (+"+O.rules.take_profit_pct+"% from the buy), "+(auto?"a price alert would ring once and a sell would be proposed for review.":"an alert would ring once for you to review. The plan itself would not sell."));
      w.push("<b>"+(auto?"Stop":"Stop alert")+".</b> If a stock falls to its stop price (-"+O.rules.stop_loss_pct+"%), "+(auto?"an alert would ring and a sell would be proposed to limit the loss.":"an alert would ring for you to review. The plan itself would not sell.")+" The odds table above shows how likely each is; no one can name the exact time.");
      if(auto)w.push("<b>Drift.</b> If a stock grows more than "+p.rebalance.band+" percentage points past its target share of the account, the rebalancer would propose selling the excess. Sells are listed before buys.");
      if(auto)w.push("<b>New filing.</b> Berkshire's next 13F is due by "+esc(O.next_13f.deadline)+". If it trims or exits a stock, the targets change and the rebalancer may propose sells.");
      else w.push("<b>Next filing.</b> Berkshire's next 13F is due by "+esc(O.next_13f.deadline)+". That is the date the plan could change.");
      w.push("<b>Taxes.</b> Gains sold before "+esc(lt||"a year")+" are short term. Losses can be harvested only if the wash sale rule allows it.");
      w.push("<b>Always a proposal.</b> A real account would need a person's yes for every sell. Here nothing is placed.");
      $("when").innerHTML=w.map(function(x){return "<li>"+x+"</li>";}).join("");
      var th=document.querySelectorAll?document.querySelectorAll("#exit th"):[];if(!auto&&th.length>4){th[3].textContent="Profit alert at";th[4].textContent="Stop alert at";}
    })();
    function draw(){
      var p=D.portfolios[cur];
      [].forEach.call(tabs.children,function(b,i){b.setAttribute("aria-selected",i===cur);});
      var inv=p.buys.reduce(function(a,b){return a+b.dollars;},0);
      var pos=p.buys.map(function(b){var e=D.entry[b.ticker],px=D.prices[b.ticker],cb=b.cost!=null?b.cost:b.dollars,sh=cb/e,v=sh*px;return{t:b.ticker,n:b.name,s:sh,e:e,px:px,v:v,g:v-cb,gp:(v/cb-1)*100};});
      var val=pos.reduce(function(a,r){return a+r.v;},0),total=val+p.cash,gain=val-inv,nsell=p.rebalance.trades.length+p.harvest.orders.length;
      $("cards").innerHTML=card("Budget",usd(p.budget,0),"")+card("Planned buys",p.buys.length+" orders","",usd(inv,0)+" invested")+card("Planned sells",nsell+" orders","",nsell?"":"nothing to sell")+card("Risk check",p.risk_summary.passed+" of "+(p.risk_summary.passed+p.risk_summary.blocked)+" pass","",p.risk_summary.blocked+" blocked")+card("Cash kept",usd(p.cash,0),"",p.cash_buffer_pct+"% buffer");
      rows("buys",p.buys.map(function(b){return '<tr><td class="act">BUY</td><td><b>'+b.ticker+"</b><small>"+esc(b.name)+"</small></td><td class=n>"+usd(b.dollars,0)+"</td><td class=n>"+(b.dollars/b.price).toFixed(2)+" sh @ "+usd(b.price)+"</td><td class=n>"+b.weight.toFixed(1)+'%</td><td><span class="v '+b.verdict+'">'+b.verdict+"</span>"+(b.reasons.length?"<small>"+esc(b.reasons.join("; "))+"</small>":"")+"</td><td>"+(b.capped?"Capped at "+p.cap_pct+"% of budget":"")+"</td></tr>";}).join(""));
      var sells=[];
      p.rebalance.trades.forEach(function(t){sells.push("<li>"+esc(JSON.stringify(t))+"</li>");});
      var auto=D.auto_exit!==false;
      $("sells").innerHTML=nsell?"<ul class=list>"+sells.join("")+"</ul>":!auto?'<div class="empty"><b>No sells planned.</b> This plan only sells when Berkshire\'s next filing drops a stock or cuts its share. Testing on ten years of history showed that selling on price rules lowered returns, so the profit and stop prices below are alerts to review, not automatic sells.</div>':'<div class="empty"><b>No sells planned.</b> The rebalancer found every stock within '+p.rebalance.band+' points of its target, and the tax skill found no losses worth harvesting. The first step is buying, so there is nothing to sell yet.</div>';
      var cols=["var(--bar1)","var(--bar2)","var(--bar3)","var(--bar4)","var(--bar5)"];
      $("alloc").innerHTML=pos.map(function(r,i){return '<span style="width:'+(r.v/total*100)+'%;background:'+cols[i%5]+'" title="'+r.t+'"></span>';}).join("");
      rows("holdings",pos.map(function(r){return "<tr><td><b>"+r.t+"</b><small>"+esc(r.n)+"</small></td><td class=n>"+r.s.toFixed(4)+"</td><td class=n>"+usd(r.e)+"</td><td class=n>"+usd(r.px)+"</td><td class=n>"+usd(r.v)+"</td><td class='n "+cls(r.g)+"'>"+usd(r.g)+"<small>"+pct(r.gp)+"</small></td><td class=n>"+(r.v/total*100).toFixed(1)+"%</td></tr>";}).join(""));
      $("stamp").textContent=D.entry_note+". Prices as of "+new Date(D.prices_as_of).toUTCString().replace(" GMT"," UTC")+" (delayed). Simulated money only.";
      $("rebnote").textContent="Trades only if a stock drifts more than "+p.rebalance.band+" percentage points from its target. Sells are listed before buys.";
      rows("reb",p.rebalance.rows.map(function(r){var q=pos.filter(function(x){return x.t===r.ticker;})[0];if(q){r=Object.assign({},r);r.current_pct=q.v/total*100;r.drift=r.current_pct-r.target_pct;r.action=Math.abs(r.drift)>p.rebalance.band?(r.drift>0?"over the band: would trim":"under the band: would add"):"hold";}return "<tr><td><b>"+r.ticker+"</b></td><td class=n>"+r.current_pct.toFixed(2)+"%</td><td class=n>"+r.target_pct.toFixed(2)+"%</td><td class='n "+cls(r.drift)+"'>"+(r.drift>0?"+":"")+r.drift.toFixed(2)+"</td><td>"+esc(r.action)+"</td></tr>";}).join(""));
      rows("lots",p.tax.lots.map(function(l){var px=D.prices[l.ticker];if(px!=null){l=Object.assign({},l);l.value=l.shares*px;l.gain=l.value-l.cost;}return "<tr><td>"+esc(l.id)+"</td><td>"+esc(l.date)+"</td><td class=n>"+l.shares.toFixed(4)+"</td><td class=n>"+usd(l.cost)+"</td><td class=n>"+usd(l.value)+"</td><td class='n "+cls(l.gain)+"'>"+usd(l.gain)+"</td><td>"+esc(l.term)+" (long term on "+esc(l.long_term_on)+")</td></tr>";}).join(""));
      [].forEach.call(document.querySelectorAll("#exit [data-now]"),function(c){var t=c.getAttribute("data-now"),px=D.prices[t],e=D.entry[t];if(px!=null&&e)c.innerHTML=usd(px)+"<small class=\""+cls(px-e)+"\">"+pct((px/e-1)*100)+"</small>";});
      $("taxnote").textContent="Realized gains this year: "+usd(p.tax.realized_ytd.short)+" short term, "+usd(p.tax.realized_ytd.long)+" long term. Not tax advice: arithmetic on the lots only.";
    }
    draw();
    (function(){   // live prices: a Cloudflare Worker serves Yahoo quotes; the total refreshes every second
      var API="https://powerband-quotes.benjaminwald11.workers.dev/?s="+encodeURIComponent(Object.keys(D.entry).sort().concat("^GSPC").join(","));
      var SLOW="https://raw.githubusercontent.com/benjaminwald1/PowerBand/live/live.json";
      var busy=false,fails=0;
      function apply(L){
        var tq=Date.parse(L.quote_time||L.updated)||0;if(D.live_at&&tq<Date.parse(D.live_at))return;   // never step back to an older quote
        var ch=false;Object.keys(L.prices||{}).forEach(function(k){if(D.entry[k]!=null&&D.prices[k]!==L.prices[k]){D.prices[k]=L.prices[k];ch=true;}});
        if(L.prevs)D.prevs=L.prevs;if(L.prices&&L.prices["^GSPC"]!=null&&D.spx!==L.prices["^GSPC"]){D.spx=L.prices["^GSPC"];ch=true;}
        var t=L.quote_time||L.updated;
        if(ch||!D.live_at||D.live_at!==t){D.live_at=t;D.prices_as_of=t;if(ch)draw();showTotal(false);}
      }
      function get(url){return fetch(url,{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});}
      function poll(){
        if(busy||document.hidden)return;busy=true;
        get(API).then(function(L){fails=0;apply(L);}).catch(function(){
          fails++;   // the quote server is down: fall back to the slower published file, once a minute
          if(fails%60===1)return get(SLOW+"?"+Date.now()).then(apply).catch(function(){});
        }).then(function(){busy=false;});
      }
      poll();setInterval(poll,1000);
      document.addEventListener("visibilitychange",function(){if(!document.hidden)poll();});
    })();
    fetch("data/learning.json?"+Date.now()).then(function(r){return r.json();}).then(function(L){
      var o=L.walk_forward.out_of_sample,f=function(n){return (n>0?"+":"")+n.toFixed(1)+"%";};
      $("ldecision").innerHTML=L.decision.adopted?"<b>The plan changed.</b> "+esc(L.decision.reason):"<b>The plan stayed the same this time.</b> "+esc(L.decision.reason)+(L.last_change?"<br><br><b>Last change ("+esc(L.last_change.date)+").</b> "+esc(L.last_change.reason):"");
      $("lcards").innerHTML=card("History used",L.data.filings+" filings","",L.data.first.slice(0,4)+" to "+L.data.last.slice(0,4)+", "+L.data.tickers.length+" stocks")+card("Rule sets tried",String(L.data.combos_tested),"","profit, stop, rebalance and P/E limits")+card("Unseen years, per year",f(o.none.cagr),cls(o.none.cagr),"hold only; earlier rules "+f(o.default.cagr))+card("S&P 500, same years",f(o.spy.cagr),cls(o.spy.cagr),"a plain index fund");
      document.querySelector("#lfolds tbody").innerHTML=L.walk_forward.folds.map(function(r){var c=function(n){return "<td class='n "+cls(n)+"'>"+f(n)+"</td>";};return "<tr><td><b>"+r.year+(r.year==new Date(L.generated).getUTCFullYear()?" (so far)":"")+"</b></td>"+c(r.learned)+c(r.default)+c(r.none)+c(r.spy)+"</tr>";}).join("")+"<tr><td><b>Per year, all</b></td>"+[o.learned,o.default,o.none,o.spy].map(function(x){return "<td class='n "+cls(x.cagr)+"'><b>"+f(x.cagr)+"</b></td>";}).join("")+"</tr>";
      $("ltake").textContent=o.spy.cagr>Math.max(o.learned.cagr,o.default.cagr,o.none.cagr)?"Honest takeaway: in this test, a plain S&P 500 index fund did better than every version of copying Berkshire, and copying with no selling rules beat the rules that sell on price.":"Honest takeaway: the learned approach did well here, but ten years is a short test and the result may not repeat.";
      var m=L.calibration.matured,ks=Object.keys(m);
      $("lcal").innerHTML=ks.length?"<b>Scoring its own odds so far.</b> "+ks.map(function(k){var x=m[k];return "Within "+k.replace("m"," months")+": it said "+x.predicted_pct+"% on average and "+x.happened_pct+"% happened ("+x.n+" checks)";}).join(". ")+".":"<b>Scoring its own odds.</b> "+L.calibration.entries+" predictions are saved so far, and none are old enough to grade. The first grades appear after about a month of daily refreshes.";
      $("lcav").innerHTML=L.caveats.map(function(c){return "<li>"+esc(c)+"</li>";}).join("");
    }).catch(function(){});
  }).catch(function(){$("cards").textContent="Couldn't load the plan.";});
})();
