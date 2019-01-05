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

export function arc(cx, cy, r, degStart, degEnd) {
    const start = polar2cart(cx, cy, r, degStart - 0.0001);
    const end = polar2cart(cx, cy, r, degEnd + 0.0001);

    const largeArc = Number(degEnd - degStart > 180);
    const sweep = Number(degEnd - degStart < 360);
    // console.log('arc', {cx, cy, r, degStart, degEnd, largeArc});
    return ['M', start.x, start.y, 'A', r, r, 0, largeArc, sweep, end.x, end.y].join(' ');
}

export function sector(cx, cy, degStart, degEnd, innerRadius, outerRadius) {
    const p2c = polar2cart.bind(null, cx, cy);

    const arcBigStart = p2c(outerRadius, degEnd);
    const arcBigEnd = p2c(outerRadius, degStart);
    const arcSmallStart = p2c(innerRadius, degStart);
    const arcSmallEnd = p2c(innerRadius, degEnd);

    const largeArc = Number(degEnd - degStart > 180);

    return [
        'M', arcBigStart.x, arcBigStart.y,
        'A', outerRadius, outerRadius, 0, largeArc, 0, arcBigEnd.x, arcBigEnd.y,
        'L', arcSmallStart.x, arcSmallStart.y,
        'A', innerRadius, innerRadius, 0, largeArc, 1, arcSmallEnd.x, arcSmallEnd.y,
        'Z'
    ].join(' ')
}

export function sectorPath(cx, cy, degStart, degEnd, innerRadius, outerRadius, opt) {
    return {
        tag: 'path',
        opt: Object.assign({},
            opt,
            {
                d: sector(cx, cy, degStart, degEnd, innerRadius, outerRadius)
            }
        )
    };
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
    if (typeof base !== typeof extra) return deepCopy(extra);
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