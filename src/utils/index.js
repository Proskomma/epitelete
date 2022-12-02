export const validateParams = (expectedParams, params, errorMessage) => {
    const _expectedParams = new Set(expectedParams);
    const unknownParams = Object.keys(params).filter(p => !_expectedParams.has(p));
    if (unknownParams.length > 0) {
        throw new Error(`${errorMessage}. Expected one of: [${[..._expectedParams].join(', ')}], But got: [${unknownParams.join(', ')}]`);
    }
}

export const removeAttribute = (obj, attributeName) => {
    let outObject, value, key;

    if (typeof obj !== "object" || obj === null) {
        return obj;
    }

    // Create an array or object to hold the values
    outObject = Array.isArray(obj) ? [] : {};

    for (key in obj) {
        if(key == attributeName && Object.keys(obj[key]).length === 0) continue;
        value = obj[key];

        // Recursively (deep) copy for nested objects, including arrays
        outObject[key] = removeAtts(value);
    }

    return outObject;
}