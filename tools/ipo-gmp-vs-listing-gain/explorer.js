/* Local-only filtering; no network calls, dependencies, storage or telemetry. */
const IpoExplorer = (() => {
  'use strict';
  const bands = [
    ['negative', 'Negative', n => n < 0], ['zero', 'Zero', n => n === 0],
    ['low', 'Above 0–10%', n => n > 0 && n <= 10],
    ['medium', 'Above 10–25%', n => n > 10 && n <= 25],
    ['high', 'Above 25–50%', n => n > 25 && n <= 50],
    ['veryHigh', 'Above 50%', n => n > 50],
  ];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const format = (value, suffix = '', digits = 1) => value === null || value === undefined ? '—' : Number(value).toLocaleString('en-IN', {minimumFractionDigits: digits, maximumFractionDigits: digits}) + suffix;
  const median = values => {
    if (!values.length) return null;
    const ordered = [...values].sort((a, b) => a - b), middle = Math.floor(ordered.length / 2);
    return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
  };
  function stats(rows) {
    const n = rows.length;
    if (!n) return {n: 0, mae: null, within5: null, within10: null, loss: null, medianGmp: null, medianGain: null};
    return {n, mae: rows.reduce((sum, r) => sum + Math.abs(r.errorPp), 0) / n,
      within5: rows.filter(r => Math.abs(r.errorPp) <= 5).length / n * 100,
      within10: rows.filter(r => Math.abs(r.errorPp) <= 10).length / n * 100,
      loss: rows.filter(r => r.listingGainPercent < 0).length / n * 100,
      medianGmp: median(rows.map(r => r.gmpPercent)), medianGain: median(rows.map(r => r.listingGainPercent))};
  }
  function select(rows, filters) {
    const band = bands.find(([id]) => id === filters.band);
    return rows.filter(r => (!filters.category || filters.category === 'all' || r.category === filters.category)
      && (!filters.minSize || r.issueSizeCr !== null && r.issueSizeCr >= Number(filters.minSize))
      && (!filters.maxSize || r.issueSizeCr !== null && r.issueSizeCr <= Number(filters.maxSize))
      && (!band || band[2](r.gmpPercent))
      && (!filters.from || r.listingDate >= filters.from) && (!filters.to || r.listingDate <= filters.to)
      && (!filters.query || r.ipoName.toLocaleLowerCase('en').includes(filters.query.trim().toLocaleLowerCase('en'))))
      .sort((a, b) => {
        if (filters.sort === 'gmp') return b.gmpPercent - a.gmpPercent;
        if (filters.sort === 'gain') return b.listingGainPercent - a.listingGainPercent;
        if (filters.sort === 'error') return Math.abs(b.errorPp) - Math.abs(a.errorPp);
        return b.listingDate.localeCompare(a.listingDate) || a.ipoName.localeCompare(b.ipoName);
      });
  }
  function bandRows(rows) {
    return bands.map(([, label, predicate]) => {
      const s = stats(rows.filter(r => predicate(r.gmpPercent)));
      return `<tr><th scope="row">${label}</th>${[s.n, format(s.medianGmp, '%'), format(s.medianGain, '%'), format(s.mae, ' pp'), format(s.within5, '%'), format(s.within10, '%'), format(s.loss, '%')].map(v => `<td>${v}</td>`).join('')}</tr>`;
    }).join('');
  }
  function listingRows(rows) {
    if (!rows.length) return '<tr><td colspan="10">No listings match these filters. Widen the selection or reset the filters.</td></tr>';
    return rows.map(r => `<tr><th scope="row"><a href="${escape(r.url)}">${escape(r.ipoName)}</a>${r.sourceWarning ? `<span title="${escape(r.sourceWarning)}"> †</span>` : ''}</th>${[escape(r.category), escape(r.listingDate), format(r.issueSizeCr, '', 2), format(r.issuePrice, '', 2), format(r.gmp, '', 2), format(r.gmpPercent, '%', 2), format(r.listingPrice, '', 2), format(r.listingGainPercent, '%', 2), format(r.errorPp, ' pp', 2)].map(v => `<td>${v}</td>`).join('')}</tr>`).join('');
  }
  function chart(rows) {
    if (!rows.length) return '<p class="empty-chart">No listings to plot for this selection.</p>';
    const low = Math.min(-10, Math.floor(Math.min(...rows.flatMap(r => [r.gmpPercent, r.listingGainPercent])) / 25) * 25);
    const high = Math.max(25, (Math.floor(Math.max(...rows.flatMap(r => [r.gmpPercent, r.listingGainPercent])) / 25) + 1) * 25);
    const x = value => 65 + (value - low) / (high - low) * 610, y = value => 315 - (value - low) / (high - low) * 270;
    const ticks = Array.from({length: 6}, (_, i) => {
      const value = low + (high - low) * i / 5;
      return `<text x="${x(value)}" y="335" text-anchor="middle">${value.toFixed(0)}%</text><text x="55" y="${y(value) + 4}" text-anchor="end">${value.toFixed(0)}%</text>`;
    }).join('');
    const points = rows.map(r => `<circle cx="${x(r.gmpPercent)}" cy="${y(r.listingGainPercent)}" r="3.5" fill="${r.category === 'Mainboard' ? '#0369a1' : '#b45309'}" opacity=".65"><title>${escape(r.ipoName)}: GMP ${r.gmpPercent}%, listing ${r.listingGainPercent}%</title></circle>`).join('');
    return `<svg id="scatter" viewBox="0 0 720 370" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">Last pre-listing GMP versus actual listing gain</title><desc id="chart-desc">Each dot is an issue. Blue is mainboard; orange is SME. Above the diagonal means the listing beat GMP. Exact values are in the table.</desc><path d="M65 45V315H675 M65 315L675 45" fill="none" stroke="#64748b" stroke-width="1.5"/>${ticks}${points}<text x="370" y="364" text-anchor="middle">Last GMP / issue price (%)</text><text transform="translate(15 180) rotate(-90)" text-anchor="middle">Actual listing gain (%)</text></svg>`;
  }
  function csv(rows, columns) {
    const cell = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    return [columns.map(cell).join(','), ...rows.map(row => columns.map(key => cell(row[key])).join(','))].join('\r\n') + '\r\n';
  }
  function mount() {
    const data = JSON.parse(document.getElementById('ipo-data').textContent), form = document.getElementById('filters');
    const download = document.getElementById('filtered-csv');
    let selected = data.rows;
    function update() {
      const filters = Object.fromEntries(new FormData(form));
      const error = filters.minSize && filters.maxSize && Number(filters.minSize) > Number(filters.maxSize)
        ? 'Minimum issue size exceeds the maximum. Adjust either value.'
        : filters.from && filters.to && filters.from > filters.to ? 'The starting date is later than the ending date.' : '';
      document.getElementById('filter-error').textContent = error;
      selected = error ? [] : select(data.rows, filters);
      const s = stats(selected);
      document.getElementById('result-count').textContent = `Showing ${selected.length} of ${data.rows.length} listings.`;
      document.getElementById('summary').innerHTML = [[s.n, 'Listings in selection'], [format(s.mae, ' pp'), 'Mean absolute miss'], [format(s.within5, '%'), 'Within ±5 pp'], [format(s.within10, '%'), 'Within ±10 pp']].map(([value, label]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join('');
      document.getElementById('bands').innerHTML = bandRows(selected);
      document.getElementById('listings').innerHTML = listingRows(selected);
      document.getElementById('chart').innerHTML = chart(selected);
      download.disabled = !selected.length;
    }
    form.querySelector('fieldset').disabled = false;
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('reset', () => setTimeout(update, 0));
    download.addEventListener('click', () => {
      const blob = new Blob(['\uFEFF' + csv(selected, Object.keys(data.rows[0]))], {type: 'text/csv;charset=utf-8'});
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'ipo-gmp-2026-filtered.csv'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    update();
  }
  return {stats, select, csv, bands, mount};
})();
if (typeof module !== 'undefined') module.exports = IpoExplorer;
if (typeof document !== 'undefined') IpoExplorer.mount();
