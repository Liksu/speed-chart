/**
 * @typedef {Array<Number>} RGB
 * @extends Array
 * @property {Number} r
 * @property {Number} g
 * @property {Number} b
 * @property {Number} [a]
 */

/**
 *
 * @param color
 * @returns {RGB}
 */
export function color2rgb(color) {
    const fragment = document.createElement('div');
    fragment.style.backgroundColor = color;
    document.body.appendChild(fragment);
    const rgb = window.getComputedStyle(fragment)
        .backgroundColor
        .match(/([\d.]+)/g)
        .map(string => Number(string));
    fragment.remove();
    [rgb.r, rgb.g, rgb.b, rgb.a] = rgb;
    return rgb;
}

export function rgb2hex(rgb) {
    return '#' + rgb.slice(0, 3).map(c => c.toString(16).padStart(2, '0')).join('');
}

export function rgb2rgba(rgb) {
    return (rgb.length === 4 ? 'rgba' : 'rgb') + '(' + rgb.join(', ') + ')';
}

export function colorShift(startColorRGB, endColorRGB, percent) {
    const r = startColorRGB.r + percent * (endColorRGB.r - startColorRGB.r);
    const g = startColorRGB.g + percent * (endColorRGB.g - startColorRGB.g);
    const b = startColorRGB.b + percent * (endColorRGB.b - startColorRGB.b);

    return [r, g, b];
}

export function polar2cart(cx, cy, r, deg) {
    const rad = (deg - 90) * Math.PI / 180;

    return {
        x: cx + (r * Math.cos(rad)),
        y: cy + (r * Math.sin(rad))
    }
}

export function tick(cx, cy, r, deg, length) {
    const {x: x1, y: y1} = polar2cart(cx, cy, r, deg);
    const {x: x2, y: y2} = polar2cart(cx, cy, r + length, deg);
    return {x1, y1, x2, y2};
}

export function _arc(cx, cy, r, degStart, degEnd, reverse = false) {
    const start = polar2cart(cx, cy, r, degStart - 0.0001);
    const end = polar2cart(cx, cy, r, degEnd + 0.0001);

    const largeArc = Number(degEnd - degStart > 180);
    let sweep = Number(degEnd - degStart < 360);
    if (reverse) sweep = 1 - sweep;

    const to = reverse ? start : end;

    return {
        line: ['A', r, r, 0, largeArc, sweep, to.x, to.y],
        start,
        end
    };
}

export function arc(cx, cy, r, degStart, degEnd) {
    const {line, start} = _arc(cx, cy, r, degStart, degEnd);
    return ['M', start.x, start.y, ...line].join(' ');
}

export function sector(cx, cy, degStart, degEnd, innerRadius, outerRadius, linecap = 'butt') {
    const big = _arc(cx, cy, outerRadius, degStart, degEnd);
    const small = _arc(cx, cy, innerRadius, degStart, degEnd, true);

    let rightSide = ['L', small.end.x, small.end.y];
    let leftSide = ['Z'];

    if (linecap === 'round') {
        const capRadius = (outerRadius - innerRadius) / 2;
        rightSide = ['A', capRadius, capRadius, 0, 1, 1, small.end.x, small.end.y];
        leftSide = ['A', capRadius, capRadius, 0, 1, 1, big.start.x, big.start.y];
    }

    return [
        'M', big.start.x, big.start.y,
        ...big.line,
        ...rightSide,
        ...small.line,
        ...leftSide
    ].join(' ');
}

export function sectorPath(cx, cy, degStart, degEnd, innerRadius, outerRadius, opt) {
    return {
        tag: 'path',
        opt: Object.assign({},
            opt,
            {
                d: sector(cx, cy, degStart, degEnd, innerRadius, outerRadius, opt['stroke-linecap'])
            }
        )
    };
}

export function generateSectorPath(settings, opt) {
    const {geometry, alpha} = settings;

    return sectorPath(
        geometry.center.x, geometry.center.y,
        alpha.start, alpha.end,
        geometry.innerRadius, geometry.maxRadius - geometry.margin,
        opt
    );
}

export function deepCopy(some) {
    // primitives, functions, dates
    if (typeof some !== 'object' || some == null || some instanceof Date) return some;
    // arrays
    if (some instanceof Array) {
        return some.map(item => deepCopy(item));
    }
    // objects
    return Object.keys(some).reduce((result, key) => ({...result, [key]: deepCopy(some[key])}), {});
}

export function merge(base, extra) {
    if (extra === undefined) return deepCopy(base);
    if (typeof extra !== 'object' || extra === null) return deepCopy(extra);
    if (base instanceof Array || extra instanceof Array) return deepCopy(extra);
    if (typeof base !== typeof extra || (base == null)) return deepCopy(extra);
    // else both objects
    return Object.keys(Object.assign({}, base, extra))
        .reduce((result, key) => ({...result, [key]: merge(base[key], extra[key])}), {});
}

export function safeMerge(base, extra) {
    if (arguments.length > 2) {
        const args = Array.from(arguments).slice(2);
        while (args.length) {
            base = safeMerge(base, extra);
            extra = args.shift();
        }
    }

    if (base && typeof base === 'object' && (typeof extra !== 'object' || extra === null)) return deepCopy(base);

    return merge(base, extra);
}

export function pickFirst(...values) {
    return values.find(item => item != null);
}

export function fixValue(value, border, ifNull = value) {
    if (value == null) value = ifNull;
    else {
        if (value && Math.abs(value) < 1) value *= border;
        if (value < 0 || Object.is(value, -0)) value += border;
    }
    return value;
}
