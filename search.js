
document.getElementById('burger').addEventListener('click',function(){
  document.querySelector('nav.side').classList.toggle('open');});
fetch('search-index.json').then(r=>r.json()).then(function(idx){
  var box=document.getElementById('q'),out=document.getElementById('results');
  if(!box)return;
  box.addEventListener('input',function(){
    var q=box.value.toLowerCase().trim();out.innerHTML='';
    if(q.length<2)return;
    idx.filter(function(p){return (p.t+' '+p.b).toLowerCase().indexOf(q)>-1;})
       .slice(0,8).forEach(function(p){
      var i=p.b.toLowerCase().indexOf(q),s=i>-1?p.b.substr(Math.max(0,i-40),110):'';
      out.insertAdjacentHTML('beforeend',
        '<a href="'+p.u+'">'+p.t+(s?'<span class="s">...'+s+'...</span>':'')+'</a>');});
  });
});
