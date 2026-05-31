function getQueryParameter(parameter, url) {
    parameter = parameter.replace(/[\[\]]/g, '\\$&');

    let regex = new RegExp('[?&]' + parameter + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);

    if (!results) return null;
    if (!results[2]) return '';

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


exports.getQueryParameter = getQueryParameter;