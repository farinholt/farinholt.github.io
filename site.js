// Search and inspection of the public profile records embedded in index.html.
// Records are timestamped when this document is loaded; no telemetry is collected.
(() => {
    const data = document.getElementById('event-data');
    if (!data) return;
    const loadedAt = new Date().toISOString();
    const records = JSON.parse(data.textContent).map(record => ({'@timestamp':loadedAt, ...record}));
    const form = document.querySelector('.search-form');
    const input = document.getElementById('query');
    const dataset = document.getElementById('dataset');
    const range = document.getElementById('time-range');
    const error = document.getElementById('query-error');
    const fieldsPanel = document.getElementById('fields-panel');
    const fieldsToggle = document.getElementById('fields-toggle');
    const workspace = document.getElementById('workspace');
    const fieldSearch = document.getElementById('field-search');
    const fieldNames = ['event.action','user.name','user.full_name','user.title','organization.name','user.email','service.name','url.full'];
    const state = {query:'*', filters:new Map(), filtered:records, newest:true, view:'events', open:new Set(['profile-001'])};
    const rows = new Map(records.map(record => [record._id, document.querySelector('[data-record="' + record._id + '"]')]));
    const expanded = new Map(records.map(record => [record._id, document.getElementById('detail-' + record._id)]));
    const clock = new Intl.DateTimeFormat('en-GB', {hour:'2-digit', minute:'2-digit', timeZone:'UTC'});
    const number = new Intl.NumberFormat('en-US');
    const compactNumber = new Intl.NumberFormat('en-US', {notation:'compact', maximumFractionDigits:1});
    // Synthetic background volumes are presentation data, not extra event rows.
    // The table, record JSON and exports continue to use only the profile records.
    const backgroundVolumes = new Map([
        ['profile-001',4167], ['links-001',2183], ['links-002',2879],
        ['links-003',6842], ['links-004',1667], ['links-005',821]
    ]);

    // A deliberately bounded grammar: words, quoted phrases, field:value and AND.
    // Parse errors leave the last successful results intact.
    function compile(query) {
        const source = query.trim();
        if (!source || source === '*') return () => true;
        const pattern = /\s*(?:([\w.@-]+)\s*:\s*)?("(?:[^"\\]|\\.)*"|[^\s"]+)/gy;
        const terms = [];
        let position = 0;
        let expectingTerm = true;
        while (position < source.length) {
            pattern.lastIndex = position;
            const match = pattern.exec(source);
            if (!match) throw new Error('Invalid search syntax. Check quoted values and field:value expressions.');
            position = pattern.lastIndex;
            const field = match[1];
            const raw = match[2];
            let value;
            try { value = raw.startsWith('"') ? JSON.parse(raw) : raw; }
            catch { throw new Error('Invalid quoted value.'); }
            if (!field && raw === 'AND') {
                if (expectingTerm) throw new Error('AND must follow a search condition.');
                expectingTerm = true;
                continue;
            }
            if (!field && (raw === 'OR' || raw === 'NOT')) throw new Error('Use AND to combine search conditions.');
            if (!field && !raw.startsWith('"') && raw.includes(':')) throw new Error('Enter a value after the field name.');
            const hasWildcard = value.includes('*');
            const wildcard = hasWildcard ? new RegExp('^' + value.split('*').map(part => part.replace(/[^a-zA-Z0-9_]/g, '\\$&')).join('.*') + '$', 'i') : null;
            terms.push(record => {
                const values = field ? [record[field]] : Object.values(record);
                return values.some(candidate => {
                    if (candidate === undefined || candidate === null) return false;
                    const text = String(candidate);
                    if (wildcard) return wildcard.test(text);
                    return field ? text.toLowerCase() === value.toLowerCase() : text.toLowerCase().includes(value.toLowerCase());
                });
            });
            expectingTerm = false;
        }
        if (expectingTerm) throw new Error('Enter a search condition after AND.');
        return record => terms.every(term => term(record));
    }

    function showError(message) {
        error.textContent = message;
        error.hidden = !message;
        input.setAttribute('aria-invalid', String(Boolean(message)));
    }

    function buildActivity() {
        const duration = range.value === '15m' ? 900000 : 86400000;
        const scale = duration / 900000;
        const end = Date.now();
        const buckets = Array(60).fill(0);
        const volumes = new Map();
        state.filtered.forEach(record => {
            const volume = Math.round((backgroundVolumes.get(record._id) || 1200) * scale);
            volumes.set(record._id,volume);
            let seed = Array.from(record._id).reduce((value,char) => (Math.imul(value,31) + char.charCodeAt(0)) >>> 0,7);
            seed = (seed + duration) >>> 0;
            const phase = seed % 17 / 3;
            const weights = buckets.map((_,index) => {
                seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
                const noise = .62 + seed / 4294967296 * .76;
                const wave = 1 + .26 * Math.sin(index * .39 + phase) + .15 * Math.sin(index * 1.13 + phase);
                const bursts = 1.3 * Math.exp(-(((index - 18 - phase) / 3.8) ** 2))
                    + .95 * Math.exp(-(((index - 43 + phase) / 2.8) ** 2));
                return noise * (wave + bursts);
            });
            const sum = weights.reduce((total,value) => total + value,0);
            const allocated = weights.map(weight => Math.floor(volume * weight / sum));
            const remainder = volume - allocated.reduce((total,value) => total + value,0);
            for (let index = 0; index < remainder; index++) allocated[index]++;
            allocated.forEach((count,index) => { buckets[index] += count; });
        });
        return {
            buckets, volumes, start:end - duration, end,
            total:buckets.reduce((total,count) => total + count,0)
        };
    }

    function renderTimeline() {
        const {buckets,start,end,total} = state.activity;
        const peak = Math.max(1,...buckets);
        const step = 10 ** Math.floor(Math.log10(peak));
        const maximum = Math.ceil(peak / step) * step;
        const bars = document.getElementById('chart-bars');
        bars.style.setProperty('--bucket-count',String(buckets.length));
        bars.replaceChildren();
        buckets.forEach((count,index) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = count / maximum * 100 + '%';
            bar.dataset.count = String(count);
            bar.title = clock.format(new Date(start + (end - start) * index / buckets.length))
                + ' UTC · ' + number.format(count) + ' events';
            bars.append(bar);
        });
        document.getElementById('chart-max').textContent = compactNumber.format(total ? maximum : 0);
        document.getElementById('chart-mid').textContent = total ? compactNumber.format(maximum / 2) : '';
        const labels = document.getElementById('chart-labels');
        labels.replaceChildren();
        for (let index = 0; index < 4; index++) {
            const label = document.createElement('span');
            label.textContent = clock.format(new Date(start + (end - start) * index / 3));
            labels.append(label);
        }
        const seconds = Math.round((end - start) / buckets.length / 1000);
        document.getElementById('chart-interval').textContent = (seconds >= 60 ? Math.round(seconds / 60) + ' minute' : seconds + ' second') + ' intervals · UTC';
        document.querySelector('.chart').setAttribute('aria-label',number.format(total) + ' events in the selected time range');
    }

    function renderFilters() {
        const chips = document.getElementById('filter-chips');
        chips.replaceChildren();
        state.filters.forEach((value, field) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'filter-chip';
            button.append(document.createTextNode(field + ': ' + value));
            const close = document.createElement('span');
            close.className = 'remove-mark';
            close.textContent = '×';
            close.setAttribute('aria-hidden','true');
            button.append(close);
            button.setAttribute('aria-label','Remove filter ' + field + ': ' + value);
            button.addEventListener('click', () => {
                state.filters.delete(field);
                input.focus({preventScroll:true});
                apply();
            });
            chips.append(button);
        });
        document.getElementById('clear-search').hidden = !state.filters.size && dataset.value === 'all' && (!state.query.trim() || state.query.trim() === '*');
    }

    function filterFieldNames() {
        const term = fieldSearch.value.trim().toLowerCase();
        let count = 0;
        document.querySelectorAll('.field-item').forEach(item => {
            item.hidden = !item.dataset.field.includes(term);
            if (!item.hidden) count++;
        });
        document.getElementById('no-fields').hidden = count !== 0;
    }

    function renderFields() {
        const container = document.getElementById('available-fields');
        const openFields = new Set(Array.from(container.querySelectorAll('details[open]')).map(item => item.dataset.field));
        container.replaceChildren();
        fieldNames.forEach(field => {
            const values = new Map();
            state.filtered.forEach(record => {
                if (record[field] !== undefined) values.set(record[field], (values.get(record[field]) || 0) + state.activity.volumes.get(record._id));
            });
            const detail = document.createElement('details');
            detail.className = 'field-item';
            detail.dataset.field = field;
            detail.open = openFields.has(field);
            const summary = document.createElement('summary');
            const type = document.createElement('span');
            type.className = 'field-type';
            type.textContent = 'a';
            type.setAttribute('aria-hidden','true');
            const volume = Array.from(values.values()).reduce((total,count) => total + count,0);
            const countLabel = document.createElement('span');
            countLabel.className = 'field-volume';
            countLabel.textContent = number.format(volume);
            countLabel.dataset.count = String(volume);
            const meter = document.createElement('span');
            meter.className = 'field-meter';
            meter.setAttribute('aria-hidden','true');
            meter.style.setProperty('--field-volume', (state.activity.total ? volume / state.activity.total * 100 : 0) + '%');
            summary.title = number.format(volume) + ' events · ' + values.size + ' distinct values';
            summary.append(type, document.createTextNode(field), countLabel, meter);
            const list = document.createElement('div');
            list.className = 'field-values';
            values.forEach((count, value) => {
                const button = document.createElement('button');
                button.type = 'button';
                const label = document.createElement('span');
                label.textContent = value;
                const total = document.createElement('span');
                total.textContent = number.format(count);
                total.dataset.count = String(count);
                button.append(label,total);
                button.setAttribute('aria-label','Filter ' + field + ' by ' + value);
                button.addEventListener('click', () => {
                    state.filters.set(field,value);
                    input.focus({preventScroll:true});
                    apply();
                });
                list.append(button);
            });
            if (!values.size) {
                const note = document.createElement('span');
                note.textContent = 'No values';
                list.append(note);
            }
            detail.append(summary,list);
            container.append(detail);
        });
        document.getElementById('field-count').textContent = String(fieldNames.length);
        filterFieldNames();
    }

    function syncViews() {
        document.getElementById('events-view').hidden = state.view !== 'events';
        document.getElementById('statistics-view').hidden = state.view !== 'statistics';
        document.querySelectorAll('[data-result-view]').forEach(button => {
            button.setAttribute('aria-pressed',String(button.dataset.resultView === state.view));
        });
    }

    function apply() {
        const began = performance.now();
        let matches;
        try { matches = compile(state.query); showError(''); }
        catch (problem) { showError(problem.message); return; }
        const cutoff = range.value === 'all' ? -Infinity : Date.now() - (range.value === '24h' ? 86400000 : 900000);
        state.filtered = records.filter(record =>
            matches(record) &&
            (dataset.value === 'all' || record['event.dataset'] === dataset.value) &&
            Date.parse(record['@timestamp']) >= cutoff &&
            Array.from(state.filters).every(([field,value]) => record[field] === value)
        );
        state.activity = buildActivity();
        const selected = new Set(state.filtered.map(record => record._id));
        const ordered = state.newest ? records : [...records].reverse();
        const table = document.getElementById('event-rows');
        ordered.forEach(record => {
            const row = rows.get(record._id);
            const detail = expanded.get(record._id);
            const open = state.open.has(record._id);
            row.hidden = !selected.has(record._id);
            row.classList.toggle('is-expanded',open);
            row.querySelector('button').setAttribute('aria-expanded',String(open));
            detail.hidden = row.hidden || !open;
            table.append(row,detail);
        });
        const count = state.filtered.length;
        const volume = state.activity.total;
        document.getElementById('result-count').textContent = number.format(volume);
        document.getElementById('tab-count').textContent = compactNumber.format(volume);
        document.getElementById('result-range').textContent = count + ' displayed';
        document.getElementById('footer-count').textContent = number.format(volume) + ' events';
        document.getElementById('empty-results').hidden = count !== 0;
        const groups = new Map();
        state.filtered.forEach(record => groups.set(record['event.dataset'], (groups.get(record['event.dataset']) || 0) + state.activity.volumes.get(record._id)));
        const stats = document.getElementById('statistics-rows');
        stats.replaceChildren();
        groups.forEach((total,name) => {
            const row = document.createElement('tr');
            [name,number.format(total)].forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.append(cell);
            });
            stats.append(row);
        });
        renderTimeline();
        renderFields();
        renderFilters();
        syncViews();
        const elapsed = ((performance.now() - began) / 1000).toFixed(3);
        document.getElementById('search-status').textContent = 'Search completed · ' + number.format(volume) + ' events · ' + elapsed + 's';
    }

    function savedSearch(query) {
        input.value = query;
        state.query = query;
        state.filters.clear();
        dataset.value = 'all';
        document.querySelectorAll('.saved-menu, .help-menu').forEach(menu => { menu.open = false; });
        input.focus({preventScroll:true});
        apply();
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        const previous = state.query;
        state.query = input.value;
        try { compile(state.query); apply(); }
        catch (problem) { state.query = previous; showError(problem.message); }
    });
    input.addEventListener('input', () => {
        if (!input.value) { state.query = '*'; apply(); }
    });
    dataset.addEventListener('change',apply);
    range.addEventListener('change',apply);
    fieldSearch.addEventListener('input',filterFieldNames);
    document.querySelectorAll('[data-saved-query]').forEach(button => {
        button.addEventListener('click', () => savedSearch(button.dataset.savedQuery));
    });
    document.getElementById('clear-search').addEventListener('click', () => savedSearch('*'));
    document.querySelectorAll('[data-result-view]').forEach(button => {
        button.addEventListener('click', () => { state.view = button.dataset.resultView; syncViews(); });
    });
    records.forEach(record => {
        const row = rows.get(record._id);
        row.querySelector('button').addEventListener('click', () => {
            if (state.open.has(record._id)) state.open.delete(record._id);
            else state.open.add(record._id);
            const open = state.open.has(record._id);
            row.classList.toggle('is-expanded',open);
            row.querySelector('button').setAttribute('aria-expanded',String(open));
            expanded.get(record._id).hidden = !open;
        });
        const time = document.querySelector('[data-time="' + record._id + '"]');
        time.dateTime = record['@timestamp'];
        time.textContent = record['@timestamp'].slice(0,10) + '\n' + record['@timestamp'].slice(11,23) + ' UTC';
        document.getElementById('json-' + record._id).textContent = JSON.stringify(record,null,2);
        expanded.get(record._id).querySelectorAll('[data-record-view]').forEach(button => {
            button.addEventListener('click', () => {
                const json = button.dataset.recordView === 'json';
                document.getElementById('fields-' + record._id).hidden = json;
                document.getElementById('json-' + record._id).hidden = !json;
                expanded.get(record._id).querySelectorAll('[data-record-view]').forEach(item => {
                    item.setAttribute('aria-pressed',String(item === button));
                });
            });
        });
    });
    document.getElementById('sort-time').addEventListener('click', event => {
        state.newest = !state.newest;
        const button = event.currentTarget;
        button.querySelector('span').textContent = state.newest ? 'Newest first' : 'Oldest first';
        button.setAttribute('aria-label',state.newest ? 'Sort oldest first' : 'Sort newest first');
        apply();
    });
    document.getElementById('timeline-toggle').addEventListener('click', event => {
        const timeline = document.getElementById('timeline');
        timeline.hidden = !timeline.hidden;
        event.currentTarget.textContent = timeline.hidden ? 'Show timeline' : 'Hide timeline';
        event.currentTarget.setAttribute('aria-expanded',String(!timeline.hidden));
    });
    function setFieldsVisible(visible) {
        fieldsPanel.hidden = !visible;
        workspace.classList.toggle('fields-hidden',!visible);
        fieldsToggle.setAttribute('aria-expanded',String(visible));
    }
    fieldsToggle.addEventListener('click', () => setFieldsVisible(fieldsPanel.hidden));
    const compact = window.matchMedia('(max-width: 900px)');
    compact.addEventListener('change',event => setFieldsVisible(!event.matches));
    document.getElementById('export-results').addEventListener('click', () => {
        const output = state.newest ? state.filtered : [...state.filtered].reverse();
        const url = URL.createObjectURL(new Blob([JSON.stringify(output,null,2)], {type:'application/json'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'search-results.json';
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url),1000);
    });
    document.addEventListener('keydown',event => {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
        const target = event.target;
        const editing = target instanceof Element && (target.matches('input, textarea, select') || target.isContentEditable);
        if (event.key === '/' && !editing) {
            event.preventDefault();
            input.focus();
            input.select();
        } else if (event.key === 'Escape') {
            document.querySelectorAll('.saved-menu[open], .help-menu[open]').forEach(menu => {
                menu.open = false;
                menu.querySelector('summary').focus();
            });
        }
    });
    document.addEventListener('click',event => {
        document.querySelectorAll('.saved-menu[open], .help-menu[open]').forEach(menu => {
            if (!menu.contains(event.target)) menu.open = false;
        });
    });
    document.documentElement.classList.add('has-js');
    document.querySelectorAll('.js-control').forEach(control => { control.hidden = false; });
    setFieldsVisible(!compact.matches);
    apply();
})();
