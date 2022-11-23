export const validateParams = (knownParams, params, errorMessage) => {
    const _knownParams = new Set(knownParams);
    const unknownParams = Object.keys(params).filter(p => !_knownParams.has(p));
    if (unknownParams.length > 0) {
        throw new Error(`${errorMessage}. Expected one of: [${[..._knownParams].join(', ')}], But got: [${unknownParams.join(', ')}]`);
    } 
}