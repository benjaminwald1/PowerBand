(function(){
  var $=function(id){return document.getElementById(id);};
  var usd=function(n,d){return (n<0?"-":"")+"$"+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d});};
  var pct=function(n){return (n>0?"+":"")+n.toFixed(2)+"%";};
  var cls=function(n){return n>0.004?"up":n<-0.004?"down":"";};
  var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
  var rows=function(el,html){document.querySelector("#"+el+" tbody").innerHTML=html;};
  function card(l,v,c,s){return '<div class="card"><small>'+l+'</small><b class="'+c+'">'+v+'</b>'+(s?'<small>'+s+'</small>':'')+'</div>';}
  fetch("data/plan.json?"+Date.now()).then(function(r){return r.json();}).then(function(D){
    var cur=0,tabs=$("tabs");
    D.portfolios.forEach(function(p,i){var b=document.createElement("button");b.textContent=usd(p.budget,0)+" portfolio";b.setAttribute("role","tab");b.onclick=function(){cur=i;draw();};tabs.appendChild(b);});
    $("srcnote").textContent="Copying: "+D.source+".";
    $("status").textContent=D.market+" Plan generated "+new Date(D.generated).toUTCString().replace(" GMT"," UTC")+".";
    var ran=[["trader-copycat","Read Berkshire's 13F and made the target weights","ran"],["trader-budget","Sized each buy to the budget, cash buffer and 25% cap","ran"],["trader-risk","Checked every order against the limits","ran"],["trader-alerts","Fetched delayed prices and the NYSE clock","ran"],["trader-rebalance","Checked drift from the targets","ran"],["trader-tax","Tracked cost-basis lots and looked for loss-harvest sells","ran"],["trader-pelosi","Listed new Congress trade filings","ran"],["trader-broker","Shows each order as a ticket. Never connected, so no order can be sent","off"],["trader-analyst","Earnings from SEC filings. Not run yet","off"],["trader-screener","Rule-based stock shortlist. Not run yet","off"],["trader-news","News and 8-K monitor. Not run yet","off"]];
    $("skills").innerHTML=ran.map(function(s){return "<li><b>"+s[0]+'<span class="tag '+s[2]+'">'+(s[2]=="ran"?"ran":"not active")+"</span></b>"+s[1]+"</li>";}).join("");
    $("congress").innerHTML=(D.congress||[]).map(function(c){return "<li><span>"+esc(c.name)+" ("+esc(c.district)+")</span><span><a href=\""+esc(c.url)+"\" rel=\"noopener\">filed "+esc(c.filed)+"</a></span></li>";}).join("")||"<li>No filings found.</li>";
    function draw(){
      var p=D.portfolios[cur];
      [].forEach.call(tabs.children,function(b,i){b.setAttribute("aria-selected",i===cur);});
      var inv=p.buys.reduce(function(a,b){return a+b.dollars;},0);
      var pos=p.buys.map(function(b){var e=D.entry[b.ticker],px=D.prices[b.ticker],sh=b.dollars/e,v=sh*px;return{t:b.ticker,n:b.name,s:sh,e:e,px:px,v:v,g:v-b.dollars,gp:(v/b.dollars-1)*100};});
      var val=pos.reduce(function(a,r){return a+r.v;},0),total=val+p.cash,gain=val-inv,nsell=p.rebalance.trades.length+p.harvest.orders.length;
      $("cards").innerHTML=card("Budget",usd(p.budget,0),"")+card("Planned buys",p.buys.length+" orders","",usd(inv,0)+" invested")+card("Planned sells",nsell+" orders","",nsell?"":"nothing to sell")+card("Risk check",p.risk_summary.passed+" pass · "+p.risk_summary.blocked+" blocked","")+card("Cash kept",usd(p.cash,0),"",p.cash_buffer_pct+"% buffer");
      rows("buys",p.buys.map(function(b){return '<tr><td class="act">BUY</td><td><b>'+b.ticker+"</b><small>"+esc(b.name)+"</small></td><td class=n>"+usd(b.dollars,0)+"</td><td class=n>"+(b.dollars/b.price).toFixed(2)+" sh @ "+usd(b.price)+"</td><td class=n>"+b.weight.toFixed(1)+'%</td><td><span class="v '+b.verdict+'">'+b.verdict+"</span>"+(b.reasons.length?"<small>"+esc(b.reasons.join("; "))+"</small>":"")+"</td><td>"+(b.capped?"Capped at "+p.cap_pct+"% of budget":"")+"</td></tr>";}).join(""));
      var sells=[];
      p.rebalance.trades.forEach(function(t){sells.push("<li>"+esc(JSON.stringify(t))+"</li>");});
      $("sells").innerHTML=nsell?"<ul class=list>"+sells.join("")+"</ul>":'<div class="empty"><b>No sells planned.</b> The rebalancer found every stock within '+p.rebalance.band+' points of its target, and the tax skill found no losses worth harvesting. The first step is buying, so there is nothing to sell yet.</div>';
      var cols=["var(--bar1)","var(--bar2)","var(--bar3)","var(--bar4)","var(--bar5)"];
      $("alloc").innerHTML=pos.map(function(r,i){return '<span style="width:'+(r.v/total*100)+'%;background:'+cols[i%5]+'" title="'+r.t+'"></span>';}).join("");
      rows("holdings",pos.map(function(r){return "<tr><td><b>"+r.t+"</b><small>"+esc(r.n)+"</small></td><td class=n>"+r.s.toFixed(4)+"</td><td class=n>"+usd(r.e)+"</td><td class=n>"+usd(r.px)+"</td><td class=n>"+usd(r.v)+"</td><td class='n "+cls(r.g)+"'>"+usd(r.g)+"<small>"+pct(r.gp)+"</small></td><td class=n>"+(r.v/total*100).toFixed(1)+"%</td></tr>";}).join(""));
      $("stamp").textContent=D.entry_note+". Prices as of "+new Date(D.prices_as_of).toUTCString().replace(" GMT"," UTC")+" (delayed). Simulated money only.";
      $("rebnote").textContent="Trades only if a stock drifts more than "+p.rebalance.band+" percentage points from its target. Sells are listed before buys.";
      rows("reb",p.rebalance.rows.map(function(r){return "<tr><td><b>"+r.ticker+"</b></td><td class=n>"+r.current_pct.toFixed(2)+"%</td><td class=n>"+r.target_pct.toFixed(2)+"%</td><td class='n "+cls(r.drift)+"'>"+(r.drift>0?"+":"")+r.drift.toFixed(2)+"</td><td>"+esc(r.action)+"</td></tr>";}).join(""));
      rows("lots",p.tax.lots.map(function(l){return "<tr><td>"+esc(l.id)+"</td><td>"+esc(l.date)+"</td><td class=n>"+l.shares.toFixed(4)+"</td><td class=n>"+usd(l.cost)+"</td><td class=n>"+usd(l.value)+"</td><td class='n "+cls(l.gain)+"'>"+usd(l.gain)+"</td><td>"+esc(l.term)+" (long term on "+esc(l.long_term_on)+")</td></tr>";}).join(""));
      $("taxnote").textContent="Realized gains this year: "+usd(p.tax.realized_ytd.short)+" short term, "+usd(p.tax.realized_ytd.long)+" long term. Not tax advice: arithmetic on the lots only.";
    }
    draw();
  }).catch(function(){$("cards").textContent="Couldn't load the plan.";});
})();
