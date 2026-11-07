(function(){
  var $=function(id){return document.getElementById(id);};
  var usd=function(n,d){return (n<0?"-":"")+"$"+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d});};
  var pct=function(n){return (n>0?"+":"")+n.toFixed(2)+"%";};
  var cls=function(n){return n>0.004?"up":n<-0.004?"down":"";};
  var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
  var rows=function(el,html){document.querySelector("#"+el+" tbody").innerHTML=html;};
  function card(l,v,c,s){return '<div class="card"><small>'+l+'</small><b class="'+c+'">'+v+'</b>'+(s?'<small>'+s+'</small>':'')+'</div>';}
  fetch("data/plan.json?"+Date.now()).then(function(r){return r.json();}).then(function(D){
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
    (function(){
      var start=0,now=0;
      D.portfolios.forEach(function(p){start+=p.budget;var v=p.cash;p.buys.forEach(function(b){v+=b.dollars/D.entry[b.ticker]*D.prices[b.ticker];});now+=v;});
      var g=now-start;
      $("bigtotal").textContent=usd(now);
      $("bigsub").innerHTML='<span class="'+cls(g)+'">'+(g>=0?"+":"")+usd(g)+" ("+pct(g/start*100)+")</span> since the simulation started with "+usd(start,0)+(D.portfolios.length>1?" across "+D.portfolios.length+" portfolios":"")+". Pretend money.";
    })();
    (function(){
      var O=D.outlook,p=D.portfolios[0];if(!O)return;var c=p.cash;
      $("ocards").innerHTML=card("12-month range, whole account",usd(O.portfolio.low+c,0)+" to "+usd(O.portfolio.high+c,0),"","A simple model using last year's price swings puts about 8 in 10 outcomes here. A spread, not a forecast.")+card("Same mix, past 12 months",pct(O.portfolio.last_year_pct),cls(O.portfolio.last_year_pct),"what happened last year, not next")+card("Next review",O.next_13f.deadline,"","Berkshire's Q3 13F is due by this date");
      rows("exit",O.stocks.map(function(s){return "<tr><td><b>"+esc(s.ticker)+"</b></td><td class=n>"+usd(s.entry)+"</td><td class='n up'>"+usd(s.take_profit_price)+"<small>+"+O.rules.take_profit_pct+"%</small></td><td class='n down'>"+usd(s.stop_price)+"<small>-"+O.rules.stop_loss_pct+"%</small></td><td class=n>"+usd(s.low,0)+" to "+usd(s.high,0)+"<small>yearly swing ±"+s.vol_pct+"%</small></td><td class='n "+cls(s.last_year_pct)+"'>"+pct(s.last_year_pct)+"</td></tr>";}).join(""));
      var lt=(p.tax.lots[0]||{}).long_term_on;
      $("when").innerHTML=[
        "<b>Profit target.</b> If a stock reaches its profit price (+"+O.rules.take_profit_pct+"% from the buy), a price alert would ring once and a sell would be proposed for review.",
        "<b>Stop.</b> If a stock falls to its stop price (-"+O.rules.stop_loss_pct+"%), an alert would ring and a sell would be proposed to limit the loss.",
        "<b>Drift.</b> If a stock grows more than "+p.rebalance.band+" percentage points past its target share of the account, the rebalancer would propose selling the excess. Sells are listed before buys.",
        "<b>New filing.</b> Berkshire's next 13F is due by "+esc(O.next_13f.deadline)+". If it trims or exits a stock, the targets change and the rebalancer may propose sells.",
        "<b>Taxes.</b> Gains sold before "+esc(lt||"a year")+" are short term. Losses can be harvested only if the wash sale rule allows it.",
        "<b>Always a proposal.</b> A real account would need a person's yes for every sell. Here nothing is placed."].map(function(x){return "<li>"+x+"</li>";}).join("");
    })();
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
