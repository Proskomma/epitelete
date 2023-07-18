import UUID from 'pure-uuid';
import base64 from 'base-64';

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

export const getPathValue = ({ object, path }) => path.split("/").reduce((value,key) => {
    value = value[key]
    return value
}, object);

export const handleOccurences = (arrayWords) => {
    let len = arrayWords.length;
    let occurences = new Map();
    let posOccurence = [...arrayWords];
    for(let i = 0; i < len; i++) {
        if(occurences.has(arrayWords[i]) && arrayWords[i] !== "") {
            occurences.set(arrayWords[i], occurences.get(arrayWords[i]) + 1);
        } else {
            occurences.set(arrayWords[i], 1);
        }
        posOccurence[i] = occurences.get(arrayWords[i]);
    };
    return [occurences, posOccurence];
}

export const generateId = () => base64.encode(new UUID(4)).substring(0, 12);

export const findObject = (obj = {}, key, value) => {
    const result = [];
    const recursiveSearch = (obj = {}) => {
        if (!obj || typeof obj !== 'object') { return;};
        if (obj[key] === value){
            result.push(obj);
        };
        Object.keys(obj).forEach(function (k) {
            recursiveSearch(obj[k]);
        });
    }
    recursiveSearch(obj);
    return result;
}

export const findNewGraft = (obj = {}, onNewGraft) => {
    const result = [];
    const recursiveSearch = (obj = {}) => {
        if (!obj || typeof obj !== 'object') { return; };
        if (obj.type === "graft" && obj.new){
            result.push(obj);
            onNewGraft(obj);
        };
        if (obj.blocks) {
            obj.blocks.forEach(function (block) {
                recursiveSearch(block);
            });
        }
        if (obj.content) {
            obj.content.forEach(function (contentElement) {
                recursiveSearch(contentElement);
            });
        }
    }
    recursiveSearch(obj);
    return result;
}