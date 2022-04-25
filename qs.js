export default function querystring(data, arrEncode, includeUndefined = false) {
    const els = []

    for(const [key, value] of Object.entries(data)) {
        if(Array.isArray(value)) {
            switch(arrEncode) {
                case 0: case 'csv': default:
                    els.push(`${key}=${value.join(',')}`);
                    break;
                case 1: case 'brackets':
                    for(const el of value) els.push(`${key}[]=${el}`);
                    break;
                case 2: case 'repeat':
                    for(const el of value) els.push(`${key}=${el}`);
                    break;
                case 3: case 'sorted':
                    value.forEach((el, i) => els.push(`${key}[${i}]=${el}`));
                    break;
            }
        }
        else if(value !== undefined)
            els.push(`${key}=${value}`)
        else if(includeUndefined)
            els.push(`${key}=`)
    }

    return els.join('&')
}
