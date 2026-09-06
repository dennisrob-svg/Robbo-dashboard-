
const $ = (id) => document.getElementById(id);

const weatherCode = {
  0:["Clear","☀️"], 1:["Mainly clear","🌤️"], 2:["Partly cloudy","⛅"], 3:["Overcast","☁️"],
  45:["Fog","🌫️"], 48:["Fog","🌫️"], 51:["Light drizzle","🌦️"], 53:["Drizzle","🌦️"],
  55:["Heavy drizzle","🌧️"], 61:["Light rain","🌦️"], 63:["Rain","🌧️"], 65:["Heavy rain","🌧️"],
  71:["Light snow","🌨️"], 73:["Snow","🌨️"], 75:["Heavy snow","❄️"], 80:["Showers","🌦️"],
  81:["Showers","🌧️"], 82:["Heavy showers","⛈️"], 95:["Thunderstorms","⛈️"]
};

function niceDate() {
  const d = new Date();
  $("todayDate").textContent = new Intl.DateTimeFormat("en-GB", {weekday:"short", day:"numeric", month:"short"}).format(d);
}
niceDate();

async function loadWeather() {
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=52.931&longitude=1.301&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FLondon&forecast_days=4";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather request failed");
    const data = await res.json();
    const code = data.current.weather_code;
    const label = weatherCode[code]?.[0] || "Weather";
    $("temp").textContent = `${Math.round(data.current.temperature_2m)}°`;
    $("weatherText").textContent = label;

    const days = data.daily.time.slice(1,4).map((date, i) => {
      const idx = i + 1;
      const d = new Date(date + "T12:00:00");
      const name = new Intl.DateTimeFormat("en-GB",{weekday:"short"}).format(d);
      const icon = weatherCode[data.daily.weather_code[idx]]?.[1] || "🌤️";
      return `<div class="day">
        <div class="name">${name}</div>
        <div class="icon">${icon}</div>
        <div class="temps">${Math.round(data.daily.temperature_2m_max[idx])}° <span style="color:#829bb4">${Math.round(data.daily.temperature_2m_min[idx])}°</span></div>
      </div>`;
    }).join("");
    $("forecast").innerHTML = days;
  } catch (e) {
    $("weatherText").textContent = "Weather unavailable";
    $("forecast").innerHTML = `<div class="micro">Pull to refresh or try again shortly.</div>`;
  }
}

async function loadHoroscope() {
  try {
    const res = await fetch("https://sigastra.com/api/v1/daily?lang=en&sign=libra");
    if (!res.ok) throw new Error("Horoscope request failed");
    const data = await res.json();
    $("horoscope").textContent = data.items?.[0]?.text || "Your Libra reading is taking a moment to arrive.";
    if (data.attribution?.localizedHref) $("horoscopeCredit").href = data.attribution.localizedHref;
    if (data.attribution?.text) $("horoscopeCredit").textContent = data.attribution.text;
  } catch (e) {
    $("horoscope").textContent = "Balance the practical with the enjoyable today. Keep the important conversations simple and clear.";
  }
}

function cleanTitle(title) {
  return title.replace(/\s+-\s+[^-]+$/, "");
}

async function loadNews() {
  const feeds = [
    ["🇬🇧","UK","https://news.google.com/rss?hl=en-GB&gl=GB&ceid=GB:en"],
    ["💼","Business","https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-GB&gl=GB&ceid=GB:en"],
    ["🏠","Property","https://news.google.com/rss/search?q=UK+property+housing+market&hl=en-GB&gl=GB&ceid=GB:en"],
    ["🌍","World","https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-GB&gl=GB&ceid=GB:en"]
  ];
  try {
    const results = await Promise.all(feeds.map(async ([icon,label,feed]) => {
      const endpoint = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(feed);
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("News request failed");
      const data = await res.json();
      const item = data.items?.[0];
      return item ? {icon,label,title:cleanTitle(item.title),link:item.link,source:data.feed?.title || "Google News"} : null;
    }));
    const rows = results.filter(Boolean).slice(0,4).map(n => `
      <a class="news-item" href="${n.link}" target="_blank" rel="noopener">
        <div class="news-icon">${n.icon}</div>
        <div>
          <div class="news-title">${n.title}</div>
          <div class="news-source">${n.label}</div>
        </div>
        <div class="chev">›</div>
      </a>`).join("");
    $("newsList").innerHTML = rows || `<div class="news-placeholder">No headlines available just now.</div>`;
  } catch (e) {
    $("newsList").innerHTML = `
      <a class="news-item" href="https://news.google.com/?hl=en-GB&gl=GB&ceid=GB:en" target="_blank" rel="noopener">
        <div class="news-icon">📰</div>
        <div><div class="news-title">Open today’s UK headlines</div><div class="news-source">Google News</div></div>
        <div class="chev">›</div>
      </a>`;
  }
}

loadWeather();
loadHoroscope();
loadNews();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
