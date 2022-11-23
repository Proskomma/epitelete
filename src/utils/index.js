export const validateParams = (expectedParams, params, errorMessage) => {
    const _expectedParams = new Set(expectedParams);
    const unknownParams = Object.keys(params).filter(p => !_expectedParams.has(p));
    if (unknownParams.length > 0) {
        throw new Error(`${errorMessage}. Expected one of: [${[..._expectedParams].join(', ')}], But got: [${unknownParams.join(', ')}]`);
    }
}