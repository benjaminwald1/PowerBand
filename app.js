(function(){
  var usd=function(n,d){return (n<0?"-":"")+"$"+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d});};
  var pct=function(n){return (n>0?"+":"")+n.toFixed(2)+"%";};
  var cls=function(n){return n>0.004?"up":n<-0.004?"down":"";};
  fetch("data/portfolios.json").then(function(r){return r.json();}).then(function(D){
    var cur=0,tabs=document.getElementById("tabs");
    D.portfolios.forEach(function(p,i){
      var b=document.createElement("button");b.textContent=usd(p.budget,0)+" portfolio";b.setAttribute("role","tab");
      b.onclick=function(){cur=i;draw();};tabs.appendChild(b);
    });
    document.getElementById("srcnote").textContent="Source: "+D.source+".";
    function draw(){
      var p=D.portfolios[cur];
      [].forEach.call(tabs.children,function(b,i){b.setAttribute("aria-selected",i===cur);});
      var rows=p.positions.map(function(x){var px=D.prices[x.ticker],sh=x.dollars/D.entry[x.ticker],v=sh*px;return{t:x.ticker,s:sh,e:D.entry[x.ticker],px:px,v:v,g:v-x.dollars,gp:(v/x.dollars-1)*100};});
      var inv=rows.reduce(function(a,r){return a+r.v;},0),total=inv+p.cash,cost=p.budget-p.cash,gain=inv-cost;
      document.getElementById("cards").innerHTML=
        card("Total value",usd(total),"")+card("Gain / loss",usd(gain),cls(gain),pct(gain/cost*100)+" on "+usd(cost,0)+" invested")+card("Invested",usd(inv),"")+card("Cash buffer",usd(p.cash),"","10% kept in cash");
      var cols=["var(--bar1)","var(--bar2)","var(--bar3)","var(--bar4)","var(--bar5)"];
      document.getElementById("alloc").innerHTML=rows.map(function(r,i){return '<span style="width:'+(r.v/total*100)+'%;background:'+cols[i%5]+'" title="'+r.t+'"></span>';}).join("");
      document.querySelector("#holdings tbody").innerHTML=rows.map(function(r){
        return "<tr><td><b>"+r.t+"</b><small>"+(D.names[r.t]||"")+"</small></td><td class=n>"+r.s.toFixed(4)+"</td><td class=n>"+usd(r.e)+"</td><td class=n>"+usd(r.px)+"</td><td class=n>"+usd(r.v)+"</td><td class='n "+cls(r.g)+"'>"+usd(r.g)+"<small>"+pct(r.gp)+"</small></td><td class=n>"+(r.v/total*100).toFixed(1)+"%</td></tr>";}).join("");
      document.getElementById("stamp").textContent=D.entry_note+". Prices as of "+new Date(D.prices_as_of).toUTCString().replace(" GMT"," UTC")+" (delayed quotes). Simulated money only.";
    }
    function card(l,v,c,s){return '<div class="card"><small>'+l+'</small><b class="'+c+'">'+v+'</b>'+(s?'<small>'+s+'</small>':'')+'</div>';}
    draw();
  }).catch(function(){document.getElementById("cards").textContent="Couldn't load the data.";});
})();
