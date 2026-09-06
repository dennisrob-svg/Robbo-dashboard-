const $ = (s) => document.querySelector(s);
const weatherCodes = {0:['Clear sky','☀️'],1:['Mainly clear','🌤️'],2:['Partly cloudy','⛅'],3:['Overcast','☁️'],45:['Foggy','🌫️'],48:['Icy fog','🌫️'],51:['Light drizzle','🌦️'],53:['Drizzle','🌦️'],55:['Heavy drizzle','🌧️'],61:['Light rain','🌦️'],63:['Rain','🌧️'],65:['Heavy rain','🌧️'],71:['Light snow','🌨️'],73:['Snow','🌨️'],75:['Heavy snow','❄️'],80:['Rain showers','🌦️'],81:['Rain showers','🌧️'],82:['Heavy showers','⛈️'],95:['Thunderstorm','⛈️']};
const dayFmt = new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short'});
$('#today').textContent = dayFmt.format(new Date());

async function loadWeather(){
  try{
    const url='https://api.open-meteo.com/v1/forecast?latitude=52.9312&longitude=1.3010&current=temperature_2m,apparent_temperature,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FLondon&forecast_days=4';
    const r=await fetch(url); if(!r.ok) throw new Error(); const d=await r.json(), current=d.current, info=weatherCodes[current.weather_code]||['Cromer weather','🌤️'];
    $('#temperature').textContent=Math.round(current.temperature_2m)+'°'; $('#condition').textContent=info[0]; $('#weatherIcon').textContent=info[1]; $('#feelsLike').textContent='Feels like '+Math.round(current.apparent_temperature)+'°';
    $('#forecast').innerHTML=d.daily.time.slice(1,4).map((date,i)=>{const idx=i+1,wi=weatherCodes[d.daily.weather_code[idx]]||['','🌤️'];return `<div><small>${new Intl.DateTimeFormat('en-GB',{weekday:'short'}).format(new Date(date+'T12:00:00'))}</small><span>${wi[1]}</span><b>${Math.round(d.daily.temperature_2m_max[idx])}° <i>${Math.round(d.daily.temperature_2m_min[idx])}°</i></b></div>`}).join('');
  }catch(e){$('#condition').textContent='Weather unavailable';$('#weatherStatus').textContent='Could not refresh · tap to retry';$('#weatherStatus').onclick=loadWeather}
}

const horoscopeFallback=[
  'Balance comes from choosing what deserves your energy. A clear conversation could untangle something that has felt more complicated than it really is.',
  'Your instinct for harmony is useful today, but do not smooth over your own priorities. One thoughtful decision will create welcome momentum.',
  'A fresh perspective arrives when you leave a little space in the day. Trust your eye for what feels right, then take one practical step toward it.'
];
async function loadHoroscope(){
  try{
    const r=await fetch('https://api.allorigins.win/raw?url='+encodeURIComponent('https://ohmanda.com/api/horoscope/libra/')); if(!r.ok) throw new Error(); const d=await r.json();
    $('#horoscopeText').textContent=d.horoscope||d.description||horoscopeFallback[new Date().getDate()%3]; $('#horoscopeSource').textContent='Live daily reading · Ohmanda';
  }catch(e){$('#horoscopeText').textContent=horoscopeFallback[new Date().getDate()%3];$('#horoscopeSource').textContent='Today’s Libra reading · offline edition'}
}

const feeds=[
  ['🇬🇧','UK','https://feeds.bbci.co.uk/news/uk/rss.xml'],['💼','Business','https://feeds.bbci.co.uk/news/business/rss.xml'],['🏠','Property','https://news.google.com/rss/search?q=UK+property+market&hl=en-GB&gl=GB&ceid=GB:en'],['🌍','World','https://feeds.bbci.co.uk/news/world/rss.xml']
];
async function fetchFeed([icon,label,url]){
  const proxy='https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(url); const r=await fetch(proxy); if(!r.ok) throw new Error(); const d=await r.json(); const item=d.items?.[0]; if(!item) throw new Error(); return {icon,label,title:item.title,link:item.link};
}
async function loadNews(){
  $('#newsList').innerHTML='<p class="loading">Gathering today’s headlines…</p>';
  const results=await Promise.allSettled(feeds.map(fetchFeed)); const items=results.filter(x=>x.status==='fulfilled').map(x=>x.value);
  if(!items.length){$('#newsList').innerHTML=feeds.map(([icon,label,url])=>`<a class="news-item" href="${url}" target="_blank" rel="noopener"><span class="news-icon">${icon}</span><span><b>Open today’s ${label.toLowerCase()} headlines</b><small>${label}</small></span><em>›</em></a>`).join('');$('#newsStatus').textContent='Headlines could not refresh · source links available';return}
  $('#newsList').innerHTML=items.map(n=>`<a class="news-item" href="${n.link}" target="_blank" rel="noopener"><span class="news-icon">${n.icon}</span><span><b>${escapeHtml(n.title)}</b><small>${n.label}</small></span><em>›</em></a>`).join(''); $('#newsStatus').textContent='Updated '+new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date());
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
$('#refreshNews').addEventListener('click',loadNews);

let tasks=[];try{tasks=JSON.parse(localStorage.getItem('robbo-tasks-v2'))||[]}catch(e){}
function saveTasks(){localStorage.setItem('robbo-tasks-v2',JSON.stringify(tasks));renderTasks()}
function renderTasks(){const open=tasks.filter(t=>!t.done).length;$('#taskCount').textContent=open+' left';$('#emptyTasks').hidden=tasks.length>0;$('#taskList').innerHTML=tasks.map(t=>`<li class="task ${t.done?'done':''}" data-id="${t.id}"><input type="checkbox" ${t.done?'checked':''} aria-label="Complete task"><label>${escapeHtml(t.text)}</label><button aria-label="Delete task">×</button></li>`).join('')}
$('#taskForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#taskInput'),text=input.value.trim();if(!text)return;tasks.unshift({id:Date.now(),text,done:false});input.value='';saveTasks()});
$('#taskList').addEventListener('click',e=>{const li=e.target.closest('.task');if(!li)return;const id=Number(li.dataset.id),idx=tasks.findIndex(t=>t.id===id);if(e.target.matches('button'))tasks.splice(idx,1);else if(e.target.matches('input'))tasks[idx].done=e.target.checked;saveTasks()});
renderTasks();loadWeather();loadHoroscope();loadNews();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
