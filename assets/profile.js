const DATA_BASE = './data/profile';
const DEFAULT_LANG = 'en';

const state = {
  lang: DEFAULT_LANG,
  data: null
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatRevenue(value) {
  if (value === null || value === undefined || value === '') return '';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toFixed(number % 1 === 0 ? 0 : 2).replace(/\.00$/, '') + 'B';
}

function formatDate(value) {
  if (!value) return '';
  const parts = String(value).split('-');
  if (parts.length !== 3) return String(value);
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString(state.lang === 'zh' ? 'zh-CN' : 'en-US');
}

function withProtocol(url) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function displayCompanyName(card = {}) {
  const legalName = card.eng_org_name || card.org_name || '';
  if (/space exploration technologies/i.test(legalName)) return 'SpaceX';
  return legalName.replace(/\s+(Corp\.|Corporation|Inc\.|Incorporated|Ltd\.|Limited)$/i, '') || card.code || '';
}

function initials(name = '') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}
function colorClass(item) {
  const key = item.colorKey || item.id || '';
  if (key.includes('connectivity')) return 'connectivity';
  if (key.includes('space')) return 'space';
  return 'other';
}

function normalizeProfileData(raw = {}) {
  if (raw.profile || raw.businessModel) return raw;

  const isZh = state.lang === 'zh';
  const card = raw.company_card || {};
  const business = raw.business_analysis || {};
  const code = card.code || business.subject?.code || '';
  const companyName = displayCompanyName(card);
  const title = code ? `${companyName} (${code}) Company Profile` : `${companyName} Company Profile`;

  const labels = isZh
    ? {
        facts: '公司基础资料', industry: '行业', established: '成立时间', listing: '上市日期', exchange: '交易所',
        employees: '全职员工', fiscalYear: '财年截止日', website: '官网', securityType: '证券类型', address: '办公地址',
        business: '主营业务', introduction: '公司简介', model: '业务与商业模式', oneLine: '一句话理解', related: '相关板块',
        executives: '高管资料', management: '高管', board: '董事会', customers: '客户', revenue: '收入方式', watch: '关注点'
      }
    : {
        facts: 'Company Facts', industry: 'Industry', established: 'Established Date', listing: 'Listing Date', exchange: 'Exchange',
        employees: 'Full-time Employees', fiscalYear: 'Fiscal Year Ends', website: 'Website', securityType: 'Security Type', address: 'Office address',
        business: 'Business', introduction: 'Introduction', model: 'Business & Model', oneLine: 'One-line view', related: 'Related Section',
        executives: 'Executive profile', management: 'Executives', board: 'Board', customers: 'Customers', revenue: 'Revenue', watch: 'Watch'
      };

  const facts = [
    { label: labels.industry, value: card.industry },
    { label: labels.established, value: formatDate(card.establish_date) },
    { label: labels.listing, value: formatDate(card.listing_date) },
    { label: labels.exchange, value: card.trade_market },
    { label: labels.employees, value: formatNumber(card.staff_number) },
    { label: labels.fiscalYear, value: card.annual_closing_date },
    { label: labels.website, value: card.org_website, href: withProtocol(card.org_website) },
    { label: labels.securityType, value: card.sec_type },
    { label: labels.address, value: card.eng_office_address },
    { label: labels.business, value: card.main_business || '--' },
    { label: labels.introduction, value: card.org_description, wide: true }
  ].filter(item => item.value !== undefined && item.value !== null && item.value !== '');

  const mapPerson = person => ({
    ...person,
    initials: initials(person.name),
    role: person.cn_title || person.title
  });

  return {
    locale: raw.locale,
    seo: { title, description: card.org_description || '' },
    profile: {
      title,
      legalName: card.eng_org_name || card.org_name || '',
      tagline: card.company_light || card.eng_company_light || '',
      factsTitle: labels.facts,
      facts
    },
    businessModel: {
      title: labels.model,
      summary: {
        label: labels.oneLine,
        headline: business.summary?.headline || '',
        description: business.summary?.description || ''
      },
      introVideo: {
        ...(business.introVideo || {}),
        src: business.introVideo?.videoURL || '',
        title: isZh ? '公司介绍视频' : 'Company introduction video'
      },
      revenueMix: business.revenueMix || {},
      segments: (business.business_segments || []).map(segment => ({
        ...segment,
        description: segment.business_intro,
        points: [
          { label: labels.customers, text: segment.customer },
          { label: labels.revenue, text: segment.revenue_mode },
          { label: labels.watch, text: segment.focus_metrics }
        ].filter(item => item.text)
      }))
    },
    relatedSection: { title: labels.related, themes: raw.related_concepts || [] },
    executiveProfile: {
      title: labels.executives,
      groups: [
        { title: labels.management, people: (raw.executive_profile?.executives || []).map(mapPerson) },
        { title: labels.board, people: (raw.executive_profile?.board || []).map(mapPerson) }
      ].filter(group => group.people.length)
    }
  };
}
async function loadProfile(lang) {
  const response = await fetch(`${DATA_BASE}.${lang}.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load profile.${lang}.json`);
  return response.json();
}

function setSeo(data) {
  document.documentElement.lang = data.locale || (state.lang === 'zh' ? 'zh-CN' : 'en');
  document.title = data.seo?.title || data.profile?.title || 'Company Profile';
  setMeta('description', data.seo?.description || '');
  setMeta('keywords', data.seo?.keywords || '');
}

function setMeta(name, content) {
  let node = document.querySelector(`meta[name="${name}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.name = name;
    document.head.appendChild(node);
  }
  node.content = content;
}

function render(data) {
  const normalized = normalizeProfileData(data);
  state.data = normalized;
  setSeo(normalized);
  renderProfile(normalized);
  initializeVideos();
  bindExecutiveToggles();
}

function renderProfile(data) {
  const profile = data.profile || {};
  const root = document.getElementById('profile-root');
  root.innerHTML = `
    <header class="page-head">
      <div>
        <h1>${escapeHtml(profile.title || '')}</h1>
        <div class="company-title">${escapeHtml(profile.legalName || '')}</div>
        <div class="company-tagline">${escapeHtml(profile.tagline || '')}</div>
      </div>
</header>

    ${renderFacts(profile)}
    ${renderBusinessModel(data.businessModel || {})}
    ${renderRelated(data.relatedSection || {})}
    ${renderExecutives(data.executiveProfile || {})}
  `;
}

function renderFacts(profile = {}) {
  const intro = (profile.facts || []).find(item => item.label === 'Introduction' || item.label === '简介' || item.label === '业务范围');
  return `
    <section class="section company-facts">
      <div class="section-head"><h2>${escapeHtml(profile.factsTitle || '')}</h2></div>
      <div class="facts-grid">
        ${(profile.facts || []).filter(item => !item.wide).map(item => `
          <div class="field">
            <div class="field-label">${escapeHtml(item.label)}</div>
            <div class="field-value">${item.href ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.value)}</a>` : escapeHtml(item.value)}</div>
          </div>
        `).join('')}
      </div>
      ${(profile.facts || []).filter(item => item.wide).map(item => `
        <div class="intro-block">
          <div class="field-label">${escapeHtml(item.label)}</div>
          <p>${item.href ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.value)}</a>` : escapeHtml(item.value)}</p>
        </div>
      `).join('')}
    </section>
  `;
}

function renderBusinessModel(model = {}) {
  return `
    <section class="section business-understand">
      <div class="section-head"><h2>${escapeHtml(model.title || '')}</h2></div>
      <div class="understand-layout ${model.introVideo?.hasVideo ? '' : 'no-video'}">
        ${renderIntroVideo(model.introVideo)}
        ${renderSummary(model.summary)}
        ${renderRevenueMix(model.revenueMix)}
      </div>
      <div class="segment-list">
        ${(model.segments || []).map(renderSegment).join('')}
      </div>
    </section>
  `;
}

function renderIntroVideo(video = {}) {
  if (!video.hasVideo) return '';
  const poster = video.pictureURL || video.poster || '';
  const posterStyle = poster ? ` style="background-image: linear-gradient(rgba(0, 0, 0, .08), rgba(0, 0, 0, .22)), url('${escapeHtml(poster)}');"` : '';
  return `
    <div class="thesis-video" data-has-video="true" data-video-src="${escapeHtml(video.src || video.videoURL || '')}" data-video-poster="${escapeHtml(poster)}" data-video-title="${escapeHtml(video.title || '')}">
      <div class="video-frame" aria-label="${escapeHtml(video.title || 'Company introduction video')}">
        <div class="video-fallback ${poster ? 'has-poster' : ''}"${posterStyle}><div class="play-mark">▶</div></div>
      </div>
    </div>
  `;
}
function renderSummary(summary = {}) {
  return `
    <div class="understand-thesis">
      <div class="understand-kicker">${escapeHtml(summary.label || 'One-line view')}</div>
      <strong>${escapeHtml(summary.headline || '')}</strong>
      ${summary.description ? `<p>${escapeHtml(summary.description)}</p>` : ''}
    </div>
  `;
}

function renderRevenueMix(revenueMix = {}) {
  const items = revenueMix.items || [];
  const totalShare = items.reduce((sum, item) => sum + Number(item.share || 0), 0) || 100;
  return `
    <div class="understand-mix">
      <div class="understand-kicker">${escapeHtml(revenueMix.label || '')}</div>
      <div class="understand-bar" aria-label="${escapeHtml(revenueMix.label || 'Revenue mix')}">
        ${items.map(item => `<div class="understand-segment ${colorClass(item)}" style="width: ${(Number(item.share || 0) / totalShare) * 100}%;" title="${escapeHtml(item.name)} ${escapeHtml(item.share)}%"></div>`).join('')}
      </div>
      <div class="understand-legend">
        ${items.map(item => `
          <div>
            <div class="legend-name">${escapeHtml(item.name)}</div>
            <div class="legend-meta">${escapeHtml(item.share)}% · ${escapeHtml(formatRevenue(item.revenue))}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSegment(segment = {}) {
  return `
    <div class="segment-row">
      <div class="segment-side">
        <div class="segment-title">${escapeHtml(segment.name || '')}</div>
        ${segment.tagline ? `<div class="segment-meta">${escapeHtml(segment.tagline)}</div>` : ''}
      </div>
      <div class="segment-story">
        <strong>${escapeHtml(segment.headline || '')}</strong>
        <p>${escapeHtml(segment.description || segment.business_intro || '')}</p>
        <div class="segment-points">
          ${(segment.points || normalizeSegmentPoints(segment)).map(point => `
            <div class="segment-point">
              <div class="segment-point-label">${escapeHtml(point.label || '')}</div>
              <span>${escapeHtml(point.text || '')}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function normalizeSegmentPoints(segment) {
  return [
    { label: state.lang === 'zh' ? '客户' : 'Customers', text: segment.customer },
    { label: state.lang === 'zh' ? '收入方式' : 'Revenue', text: segment.revenue_mode },
    { label: state.lang === 'zh' ? '关注点' : 'Watch', text: segment.focus_metrics }
  ].filter(item => item.text);
}

function renderRelated(related = {}) {
  return `
    <section class="section related-section">
      <div class="section-head"><h2>${escapeHtml(related.title || '')}</h2></div>
      <div class="theme-row">
        ${(related.themes || []).map(theme => `
          <span class="theme">${theme.iconUrl ? `<img src="${escapeHtml(theme.iconUrl)}" alt="" />` : ''}${escapeHtml(theme.name || theme.indexNameEn || theme.indexName || '')} <span class="${theme.direction === 'down' || Number(theme.percentChange) < 0 ? 'down' : 'up'}">${escapeHtml(theme.change || formatPercent(theme.percentChange))}</span></span>
        `).join('')}
      </div>
    </section>
  `;
}

function formatPercent(value) {
  if (value === undefined || value === null || value === '') return '';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return `${number > 0 ? '+' : ''}${number.toFixed(2)}%`;
}

function renderExecutives(exec = {}) {
  const groups = exec.groups || [];
  return `
    <section class="section exec-section">
      <div class="section-head"><h2>${escapeHtml(exec.title || '')}</h2></div>
      <div class="exec-grid">
        ${groups.map(group => renderExecutiveGroup(group)).join('')}
      </div>
    </section>
  `;
}

function renderExecutiveGroup(group = {}) {
  return `
    <div class="exec-panel">
      <h3>${escapeHtml(group.title || '')}</h3>
      ${(group.people || []).map((person, index) => renderPerson(person, index === 0)).join('')}
    </div>
  `;
}

function renderPerson(person = {}, expanded = false) {
  const hasDetails = person.profile_desc || person.age || person.education || person.salary || person.ownership || person.vote_power;
  return `
    <div class="person ${expanded && hasDetails ? 'expanded' : ''}">
      <button class="person-head" type="button">
        <span class="avatar">${escapeHtml(person.initials || person.name?.[0] || '')}</span>
        <span class="person-main"><span class="person-name">${escapeHtml(person.name || '')}</span><span class="person-role">${escapeHtml(person.role || person.title || '')}</span></span>
        <span class="chev">⌄</span>
      </button>
      ${hasDetails ? `
        <div class="person-detail">
          <div class="person-stats">
            ${renderStat('Gender', person.gender)}
            ${renderStat('Age', person.age)}
            ${renderStat('Education', person.education)}
            ${renderStat('Salary', person.salary)}
            ${renderStat('Ownership', person.ownership)}
            ${renderStat('Vote Power', person.vote_power)}
          </div>
          ${person.profile_desc ? `<p>${escapeHtml(person.profile_desc)}</p>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

function renderStat(label, value) {
  if (value === undefined || value === null || value === '') return '';
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function bindExecutiveToggles() {
  document.querySelectorAll('.person-head').forEach(button => {
    button.addEventListener('click', () => {
      const person = button.closest('.person');
      if (person?.querySelector('.person-detail')) person.classList.toggle('expanded');
    });
  });
}

function initializeVideos() {
  document.querySelectorAll('.thesis-video').forEach(section => {
    const src = section.dataset.videoSrc;
    const poster = section.dataset.videoPoster || '';
    const hasVideo = section.dataset.hasVideo === 'true';
    const frame = section.querySelector('.video-frame');
    if (!hasVideo || !frame) {
      section.hidden = true;
      const layout = section.closest('.understand-layout');
      if (layout) layout.classList.add('no-video');
      return;
    }
    if (!src) return;
    if (/youtube\.com|youtu\.be|vimeo\.com/.test(src)) {
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = section.dataset.videoTitle || 'Company introduction video';
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      frame.replaceChildren(iframe);
      return;
    }
    const video = document.createElement('video');
    video.src = src;
    if (poster) video.poster = poster;
    video.controls = true;
    video.preload = 'metadata';
    frame.replaceChildren(video);
  });
}

async function boot() {
  const root = document.getElementById('profile-root');
  try {
    const data = await loadProfile(DEFAULT_LANG);
    render(data);
  } catch (error) {
    console.error(error);
    root.innerHTML = `<section class="section"><h2>Unable to load profile data</h2><p>Run this page through a local web server so the browser can fetch JSON files.</p></section>`;
  }
}

boot();






